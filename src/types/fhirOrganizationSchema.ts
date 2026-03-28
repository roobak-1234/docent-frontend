/**
 * FHIR R4 Organization Resource Schema for Hospital Registration
 * Maps hospital registration data to HL7 FHIR standard
 */

export interface FHIROrganization {
  resourceType: 'Organization';
  id?: string;
  identifier: Array<{
    use: 'official' | 'secondary';
    system: string;
    value: string;
  }>;
  active: boolean;
  type: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  name: string;
  telecom: Array<{
    system: 'phone' | 'email';
    value: string;
    use: 'work' | 'mobile';
  }>;
  address: Array<{
    use: 'work';
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
    extension?: Array<{
      url: string;
      valueDecimal: number;
    }>;
  }>;
  extension?: Array<{
    url: string;
    valueString?: string;
    valueInteger?: number;
    valueBoolean?: boolean;
  }>;
}

export interface HospitalRegistrationData {
  name: string;
  type: 'Private' | 'Government' | 'Clinic';
  hospitalId: string;
  phone?: string;
  emergencyEmail?: string;
  adminContact: string;
  address: string;
  latitude: number;
  longitude: number;
  icuBeds: number;
  hduBeds: number;
  isolationBeds: number;
  nicuBeds: number;
  picuBeds: number;
  ventilators: number;
  operationTheaterCount: number;
  accreditation?: string;
  globalId?: string;
  specializations: {
    traumaLevel1: boolean;
    cardiacCenter: boolean;
    pediatricEmergency: boolean;
    infectiousDisease: boolean;
    maternalFetal: boolean;
    strokeCenter: boolean;
    mentalHealth: boolean;
  };
  ambulanceIds?: string[];
}

export const mapToFHIROrganization = (data: HospitalRegistrationData): FHIROrganization => {
  return {
    resourceType: 'Organization',
    identifier: [
      {
        use: 'official',
        system: 'https://lifelink-ai.com/hospital-id',
        value: data.hospitalId
      }
    ],
    active: true,
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: 'prov',
            display: 'Healthcare Provider'
          }
        ]
      }
    ],
    name: data.name,
    telecom: [
      ...(data.phone ? [{
        system: 'phone' as const,
        value: data.phone,
        use: 'work' as const
      }] : []),
      ...(data.emergencyEmail ? [{
        system: 'email' as const,
        value: data.emergencyEmail,
        use: 'work' as const
      }] : [])
    ],
    address: [
      {
        use: 'work',
        line: [data.address],
        city: '',
        state: '',
        postalCode: '',
        country: 'IN',
        extension: [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/geolocation',
            valueDecimal: data.latitude
          },
          {
            url: 'http://hl7.org/fhir/StructureDefinition/geolocation',
            valueDecimal: data.longitude
          }
        ]
      }
    ],
    extension: [
      {
        url: 'https://lifelink-ai.com/hospital-type',
        valueString: data.type
      },
      {
        url: 'https://lifelink-ai.com/icu-beds',
        valueInteger: data.icuBeds
      },
      {
        url: 'https://lifelink-ai.com/hdu-beds',
        valueInteger: data.hduBeds
      },
      {
        url: 'https://lifelink-ai.com/isolation-beds',
        valueInteger: data.isolationBeds
      },
      {
        url: 'https://lifelink-ai.com/nicu-beds',
        valueInteger: data.nicuBeds
      },
      {
        url: 'https://lifelink-ai.com/picu-beds',
        valueInteger: data.picuBeds
      },
      {
        url: 'https://lifelink-ai.com/ventilators',
        valueInteger: data.ventilators
      },
      {
        url: 'https://lifelink-ai.com/operation-theater-count',
        valueInteger: data.operationTheaterCount
      },
      ...(data.accreditation ? [{
        url: 'https://lifelink-ai.com/accreditation',
        valueString: data.accreditation
      }] : []),
      ...(data.globalId ? [{
        url: 'https://lifelink-ai.com/global-id',
        valueString: data.globalId
      }] : []),
      {
        url: 'https://lifelink-ai.com/trauma-level-1',
        valueBoolean: data.specializations.traumaLevel1
      },
      {
        url: 'https://lifelink-ai.com/cardiac-center',
        valueBoolean: data.specializations.cardiacCenter
      },
      {
        url: 'https://lifelink-ai.com/pediatric-emergency',
        valueBoolean: data.specializations.pediatricEmergency
      },
      {
        url: 'https://lifelink-ai.com/infectious-disease',
        valueBoolean: data.specializations.infectiousDisease
      },
      {
        url: 'https://lifelink-ai.com/maternal-fetal',
        valueBoolean: data.specializations.maternalFetal
      },
      {
        url: 'https://lifelink-ai.com/stroke-center',
        valueBoolean: data.specializations.strokeCenter
      },
      {
        url: 'https://lifelink-ai.com/mental-health',
        valueBoolean: data.specializations.mentalHealth
      }
    ]
  };
};