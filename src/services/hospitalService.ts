import { get, post } from './Api';
import { HospitalRegistrationData, mapToFHIROrganization } from '../types/fhirOrganizationSchema';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

class HospitalService {
  private baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://lifelink-api.azurewebsites.net/api';

  async registerHospital(hospitalData: HospitalRegistrationData): Promise<ApiResponse<any>> {
    try {
      // Map to backend Hospital model
      const backendHospital = {
        name: hospitalData.name,
        uniqueHospitalId: hospitalData.hospitalId,
        address: hospitalData.address,
        type: hospitalData.type,
        phone: hospitalData.phone || '',
        emergencyEmail: hospitalData.emergencyEmail || '',
        ambulanceCount: hospitalData.ambulanceIds?.length || 0,
        ventilators: hospitalData.ventilators,
        icuBeds: hospitalData.icuBeds,
        oxygenStock: 100, // Default value
        ambulanceIds: hospitalData.ambulanceIds || [],
        latitude: hospitalData.latitude,
        longitude: hospitalData.longitude,
        adminContact: hospitalData.adminContact
      };

      if (process.env.REACT_APP_API_URL) {
        const result = await post<any>('/api/hospital/register', backendHospital);

        // Also store in Azure Health Data Services (FHIR) if needed
        const fhirOrganization = mapToFHIROrganization(hospitalData);
        await this.storeFHIROrganization(fhirOrganization);

        return {
          success: true,
          data: result.hospital || result,
          message: 'Hospital registered successfully'
        };
      }

      // Fallback
      this.storeHospitalLocally(hospitalData);
      return { success: true, message: 'Hospital registered locally' };
    } catch (error) {
      console.error('Hospital registration failed:', error);
      return { success: false, message: (error as Error).message };
    }
  }

  private async storeFHIROrganization(fhirOrganization: any): Promise<void> {
    try {
      // Azure Health Data Services FHIR endpoint
      const fhirEndpoint = process.env.REACT_APP_FHIR_ENDPOINT || 'https://lifelink-fhir.azurehealthcareapis.com';
      
      await fetch(`${fhirEndpoint}/Organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Authorization': `Bearer ${this.getFHIRToken()}`
        },
        body: JSON.stringify(fhirOrganization)
      });
    } catch (error) {
      console.warn('FHIR storage failed, using fallback:', error);
    }
  }

  private storeHospitalLocally(hospitalData: HospitalRegistrationData): void {
    const hospitals = JSON.parse(localStorage.getItem('registered_hospitals') || '[]');
    hospitals.push({
      ...hospitalData,
      id: Date.now().toString(),
      registeredAt: new Date().toISOString()
    });
    localStorage.setItem('registered_hospitals', JSON.stringify(hospitals));
  }

  async getRegisteredHospitals(): Promise<ApiResponse<HospitalRegistrationData[]>> {
    try {
      if (process.env.REACT_APP_API_URL) {
        const hospitals = await get<HospitalRegistrationData[]>('/api/hospital');
        return { success: true, data: hospitals, message: 'Hospitals retrieved' };
      }
      throw new Error("No backend");
    } catch (error) {
      const hospitals = JSON.parse(localStorage.getItem('registered_hospitals') || '[]');
      return { success: true, data: hospitals, message: 'Retrieved from local' };
    }
  }

  async getHospitalByAdmin(adminContact: string): Promise<ApiResponse<any>> {
    try {
      if (process.env.REACT_APP_API_URL) {
        const hospital = await get<any>(`/api/hospital/admin/${adminContact}`);
        return { success: true, data: hospital, message: 'Hospital retrieved' };
      }
      throw new Error("No backend");
    } catch (error) {
      const hospitals = JSON.parse(localStorage.getItem('registered_hospitals') || '[]');
      const hospital = hospitals.find((h: any) => h.adminContact === adminContact);
      return { success: !!hospital, data: hospital, message: hospital ? 'Retrieved from local' : 'Not found' };
    }
  }

  async getHospitalById(hospitalId: string): Promise<ApiResponse<any>> {
    try {
      if (process.env.REACT_APP_API_URL) {
        const hospital = await get<any>(`/api/hospital/${hospitalId}`);
        return { success: true, data: hospital, message: 'Hospital retrieved' };
      }
      throw new Error("No backend");
    } catch (error) {
      const hospitals = JSON.parse(localStorage.getItem('registered_hospitals') || '[]');
      const hospital = hospitals.find((h: any) => h.uniqueHospitalId === hospitalId || h.hospitalId === hospitalId);
      return { success: !!hospital, data: hospital, message: hospital ? 'Retrieved from local' : 'Not found' };
    }
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || 'demo_token';
  }

  private getFHIRToken(): string {
    return localStorage.getItem('fhir_token') || 'demo_fhir_token';
  }

  async generateCapabilitySummary(hospitalData: any): Promise<string> {
    try {
      const specializations = Object.entries(hospitalData.specializations || {})
        .filter(([_, value]) => value)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
        .join(', ');

      return `${hospitalData.name} is a ${hospitalData.type?.toLowerCase() || 'health'} facility with ${hospitalData.icuBeds || 0} ICU, ${hospitalData.hduBeds || 0} HDU, and ${hospitalData.ventilators || 0} ventilators available. ${specializations ? `Specialized for ${specializations} cases.` : ''}`;
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return `${hospitalData.name} - ${hospitalData.type} hospital with ${hospitalData.icuBeds} ICU beds available.`;
    }
  }

  async searchNearbyHospitals(lat: number, lon: number): Promise<any[]> {
    const subscriptionKey = process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY;
    if (!subscriptionKey) return [];

    try {
      const url = `https://atlas.microsoft.com/search/address/around/json?api-version=1.0&subscription-key=${subscriptionKey}&lat=${lat}&lon=${lon}&radius=10000&query=hospital`;
      const response = await fetch(url);
      const data = await response.json();
      
      return (data.results || []).map((res: any) => ({
        id: res.id,
        name: res.poi.name,
        address: res.address.freeformAddress,
        latitude: res.position.lat,
        longitude: res.position.lon,
        type: 'Hospital',
        isExternal: true,
        specialization: res.poi.classifications?.map((c: any) => c.code).join(', ') || 'General'
      }));
    } catch (error) {
      console.error('Azure Maps Search failed:', error);
      return [];
    }
  }

  async getRoute(start: {lat: number, lon: number}, end: {lat: number, lon: number}): Promise<{ points: any[], distance: string, duration: string }> {
    const subscriptionKey = process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY;
    if (!subscriptionKey) return { points: [], distance: '', duration: '' };

    try {
      // Use emergency travel mode and traffic for "better" routing
      const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${start.lat},${start.lon}:${end.lat},${end.lon}&travelMode=emergency&traffic=true`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = route.legs[0].points.map((p: any) => ({
          latitude: p.latitude,
          longitude: p.longitude
        }));

        const distanceKm = (route.summary.lengthInMeters / 1000).toFixed(1);
        const durationMin = Math.ceil(route.summary.travelTimeInSeconds / 60);

        return {
          points,
          distance: `${distanceKm} km`,
          duration: `${durationMin} min`
        };
      }
      return { points: [], distance: '', duration: '' };
    } catch (error) {
      console.error('Azure Maps Route failed:', error);
      return { points: [], distance: '', duration: '' };
    }
  }
}

export const hospitalService = new HospitalService();