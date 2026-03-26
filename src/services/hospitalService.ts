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
        uniqueHospitalId: hospitalData.hospitalId || `HOSP-${Date.now().toString().slice(-6)}`,
        address: hospitalData.address,
        type: hospitalData.type,
        phone: hospitalData.phone || '',
        emergencyEmail: hospitalData.emergencyEmail || '',
        ambulanceCount: hospitalData.ambulanceIds?.length || 0,
        ventilators: hospitalData.ventilators,
        icuBeds: hospitalData.icuBeds,
        oxygenStock: 100, // Default value
        ambulanceIds: hospitalData.ambulanceIds || [],
        adminContact: hospitalData.adminContact
      };

      const response = await fetch(`${this.baseUrl}/hospital/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(backendHospital)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Also store in Azure Health Data Services (FHIR) if needed
      const fhirOrganization = mapToFHIROrganization(hospitalData);
      await this.storeFHIROrganization(fhirOrganization);

      return {
        success: true,
        data: result.hospital || result,
        message: 'Hospital registered successfully'
      };

    } catch (error) {
      console.error('Hospital registration failed:', error);
      
      // Fallback to localStorage for demo
      this.storeHospitalLocally(hospitalData);
      
      return {
        success: true, // Return success for demo purposes
        message: 'Hospital registered successfully (demo mode)'
      };
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
      const response = await fetch(`${this.baseUrl}/hospitals`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const hospitals = await response.json();
      
      return {
        success: true,
        data: hospitals,
        message: 'Hospitals retrieved successfully'
      };

    } catch (error) {
      // Fallback to localStorage
      const hospitals = JSON.parse(localStorage.getItem('registered_hospitals') || '[]');
      
      return {
        success: true,
        data: hospitals,
        message: 'Hospitals retrieved from local storage'
      };
    }
  }

  private getAuthToken(): string {
    // In production, get from Azure AD B2C or Entra ID
    return localStorage.getItem('auth_token') || 'demo_token';
  }

  private getFHIRToken(): string {
    // In production, get FHIR-specific token from Azure Health Data Services
    return localStorage.getItem('fhir_token') || 'demo_fhir_token';
  }

  // Azure OpenAI integration for hospital capability summary
  async generateCapabilitySummary(hospitalData: HospitalRegistrationData): Promise<string> {
    try {
      // Mock Azure OpenAI response - Replace with actual Azure OpenAI Service
      const specializations = Object.entries(hospitalData.specializations)
        .filter(([_, value]) => value)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
        .join(', ');

      const mockSummary = `${hospitalData.name} is a ${hospitalData.type.toLowerCase()} facility with ${hospitalData.icuBeds} ICU, ${hospitalData.hduBeds} HDU, ${hospitalData.isolationBeds} isolation beds, and ${hospitalData.ventilators} ventilators available. OT currently ${hospitalData.otStatus.toLowerCase()}. ${specializations ? `Specialized for ${specializations} cases.` : ''} Optimal for emergency patients requiring these specific services.`;

      return mockSummary;

    } catch (error) {
      console.error('AI summary generation failed:', error);
      return `${hospitalData.name} - ${hospitalData.type} hospital with ${hospitalData.icuBeds} ICU beds available.`;
    }
  }
}

export const hospitalService = new HospitalService();