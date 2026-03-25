import { useState, useEffect } from 'react';

interface AmbulanceSession {
  ambulanceId: string;
  hospitalId: string;
  patientId: string;
  isActive: boolean;
  startTime: Date;
  vitals: {
    heartRate?: number;
    bloodPressure?: string;
    spO2?: number;
    notes?: string;
    timestamp: Date;
  }[];
}

interface UseAmbulanceSessionReturn {
  session: AmbulanceSession | null;
  startSession: (ambulanceId: string, hospitalId: string, patientId: string) => void;
  updateVitals: (vitals: Omit<AmbulanceSession['vitals'][0], 'timestamp'>) => void;
  completeHandover: () => void;
  isSessionActive: boolean;
}

export const useAmbulanceSession = (): UseAmbulanceSessionReturn => {
  const [session, setSession] = useState<AmbulanceSession | null>(null);

  useEffect(() => {
    // Load existing session from localStorage
    const savedSession = localStorage.getItem('ambulance_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      setSession({
        ...parsed,
        startTime: new Date(parsed.startTime),
        vitals: parsed.vitals.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }))
      });
    }
  }, []);

  useEffect(() => {
    // Save session to localStorage whenever it changes
    if (session) {
      localStorage.setItem('ambulance_session', JSON.stringify(session));
    }
  }, [session]);

  const startSession = (ambulanceId: string, hospitalId: string, patientId: string) => {
    const newSession: AmbulanceSession = {
      ambulanceId,
      hospitalId,
      patientId,
      isActive: true,
      startTime: new Date(),
      vitals: []
    };
    setSession(newSession);
  };

  const updateVitals = (vitals: Omit<AmbulanceSession['vitals'][0], 'timestamp'>) => {
    if (!session) return;
    
    const newVital = {
      ...vitals,
      timestamp: new Date()
    };

    setSession(prev => prev ? {
      ...prev,
      vitals: [...prev.vitals, newVital]
    } : null);
  };

  const completeHandover = () => {
    if (session) {
      setSession(prev => prev ? { ...prev, isActive: false } : null);
      localStorage.removeItem('ambulance_session');
      
      // TODO: Push to Azure Health Data Services (FHIR)
      console.log('Handover completed - pushing to FHIR:', session);
    }
  };

  return {
    session,
    startSession,
    updateVitals,
    completeHandover,
    isSessionActive: session?.isActive || false
  };
};