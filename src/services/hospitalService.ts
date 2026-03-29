import { get, post } from './Api';
import { HospitalRegistrationData } from '../types/fhirOrganizationSchema';
import { getAzureMapsSubscriptionKey } from '../config/maps';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

class HospitalService {
  private mapResultToHospital(r: any) {
    const lat = r?.position?.lat;
    const lon = r?.position?.lon;
    if (lat == null || lon == null) return null;

    const classifications = (r?.poi?.classifications || [])
      .map((c: any) => c?.code)
      .filter(Boolean)
      .join(', ');

    return {
      id: r.id,
      name: r?.poi?.name || r?.address?.freeformAddress || 'Hospital',
      address: r?.address?.freeformAddress || 'Address not available',
      latitude: lat,
      longitude: lon,
      type: 'Hospital',
      isExternal: true,
      specialization: classifications || 'General'
    };
  }

  private dedupeHospitals(items: any[]): any[] {
    const seen = new Set<string>();
    const out: any[] = [];

    for (const item of items) {
      if (!item) continue;
      const key = String(item.id || `${item.name}_${item.latitude}_${item.longitude}`);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }

    return out;
  }

  async registerHospital(hospitalData: HospitalRegistrationData): Promise<ApiResponse<any>> {
    try {
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
        operationTheaterCount: hospitalData.operationTheaterCount,
        oxygenStock: 100,
        ambulanceIds: hospitalData.ambulanceIds || [],
        latitude: hospitalData.latitude,
        longitude: hospitalData.longitude,
        adminContact: hospitalData.adminContact
      };
      const result = await post<any>('/api/hospital/register', backendHospital);
      return { success: true, data: result.hospital || result, message: 'Hospital registered successfully' };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async getRegisteredHospitals(): Promise<ApiResponse<any[]>> {
    try {
      const hospitals = await get<any[]>('/api/hospital');
      return { success: true, data: hospitals, message: 'Hospitals retrieved' };
    } catch (error) {
      return { success: false, data: [], message: (error as Error).message };
    }
  }

  async getHospitalByAdmin(adminContact: string): Promise<ApiResponse<any>> {
    try {
      const hospital = await get<any>(`/api/hospital/admin/${encodeURIComponent(adminContact)}`);
      return { success: true, data: hospital, message: 'Hospital retrieved' };
    } catch (error) {
      return { success: false, data: null, message: (error as Error).message };
    }
  }

  async getHospitalById(hospitalId: string): Promise<ApiResponse<any>> {
    try {
      const hospital = await get<any>(`/api/hospital/${encodeURIComponent(hospitalId)}`);
      return { success: true, data: hospital, message: 'Hospital retrieved' };
    } catch (error) {
      return { success: false, data: null, message: (error as Error).message };
    }
  }

  async generateCapabilitySummary(hospitalData: any): Promise<string> {
    const specializations = Object.entries(hospitalData.specializations || {})
      .filter(([, value]) => value)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
      .join(', ');
    return `${hospitalData.name} is a ${hospitalData.type?.toLowerCase() || 'health'} facility with ${hospitalData.icuBeds || 0} ICU, ${hospitalData.hduBeds || 0} HDU, and ${hospitalData.ventilators || 0} ventilators available.${specializations ? ` Specialized for ${specializations} cases.` : ''}`;
  }

  async searchNearbyHospitals(lat: number, lon: number): Promise<any[]> {
    const subscriptionKey = getAzureMapsSubscriptionKey();
    if (!subscriptionKey) return [];

    const base = 'https://atlas.microsoft.com';
    const requests = [
      // Best signal: POI category search for hospitals.
      `${base}/search/poi/category/json?api-version=1.0&subscription-key=${subscriptionKey}&lat=${lat}&lon=${lon}&radius=50000&categorySet=7321&limit=25`,
      // Fallback: around address search with hospital query.
      `${base}/search/address/around/json?api-version=1.0&subscription-key=${subscriptionKey}&lat=${lat}&lon=${lon}&radius=50000&query=hospital&limit=25`,
      // Fallback: nearby POI fuzzy query.
      `${base}/search/poi/json?api-version=1.0&subscription-key=${subscriptionKey}&query=hospital&lat=${lat}&lon=${lon}&radius=50000&limit=25`
    ];

    try {
      const settled = await Promise.allSettled(
        requests.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) return [];
          const data = await res.json();
          return (data?.results || []).map((r: any) => this.mapResultToHospital(r)).filter(Boolean);
        })
      );

      const combined = settled
        .filter((s): s is PromiseFulfilledResult<any[]> => s.status === 'fulfilled')
        .flatMap(s => s.value);

      return this.dedupeHospitals(combined);
    } catch {
      return [];
    }
  }

  async getRoute(start: { lat: number; lon: number }, end: { lat: number; lon: number }): Promise<{ points: any[]; distance: string; duration: string }> {
    const subscriptionKey = getAzureMapsSubscriptionKey();
    if (!subscriptionKey) return { points: [], distance: '', duration: '' };
    try {
      const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${start.lat},${start.lon}:${end.lat},${end.lon}&routeType=fastest&travelMode=car&traffic=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.length > 0) {
        const route = data.routes[0];
        return {
          points: route.legs[0].points.map((p: any) => ({ latitude: p.latitude, longitude: p.longitude })),
          distance: `${(route.summary.lengthInMeters / 1000).toFixed(1)} km`,
          duration: `${Math.ceil(route.summary.travelTimeInSeconds / 60)} min`
        };
      }
      return { points: [], distance: '', duration: '' };
    } catch {
      return { points: [], distance: '', duration: '' };
    }
  }
}

export const hospitalService = new HospitalService();
