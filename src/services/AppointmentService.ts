import { get, post, put } from './Api';

export const appointmentService = {
  enableHospitalAppointments: async (uniqueHospitalId: string, settings: any) => {
    try {
      const data = await post<any>('/api/appointments/enable-hospital', {
        uniqueHospitalId,
        settingsJson: JSON.stringify(settings),
        disable: false,
      });
      return { success: true, data: data.hospital };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to enable appointments' };
    }
  },

  disableHospitalAppointments: async (uniqueHospitalId: string) => {
    try {
      await post('/api/appointments/enable-hospital', {
        uniqueHospitalId,
        settingsJson: '{}',
        disable: true,
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to disable appointments' };
    }
  },

  getAppointmentSettings: async (hospitalId: string) => {
    try {
      const data = await get<any>(`/api/appointments/settings/${encodeURIComponent(hospitalId)}`);
      return { success: true, data };
    } catch {
      return { success: false, data: { enabled: false, settings: '{}' } };
    }
  },

  getHospitalAppointments: async (hospitalId: string) => {
    try {
      const data = await get<any[]>(`/api/appointments/hospital/${encodeURIComponent(hospitalId)}`);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, message: e.message, data: [] };
    }
  },

  updateAppointmentStatus: async (appointmentId: number, status: string) => {
    try {
      const data = await put<any>(`/api/appointments/${appointmentId}/status`, { status });
      return { success: true, data };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to update status' };
    }
  },

  bookAppointment: async (appointmentData: {
    uniqueHospitalId: string;
    patientId: string;
    patientName: string;
    patientPhone: string;
    reason: string;
    appointmentDate: string;
    selectedTime: string;
    doctorId?: string;
    doctorName?: string;
  }) => {
    try {
      const data = await post<any>('/api/appointments', appointmentData);
      return { success: true, data: data.appointment };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to book appointment' };
    }
  },

  getPatientAppointments: async (patientId: string) => {
    try {
      const data = await get<any[]>(`/api/appointments/patient/${encodeURIComponent(patientId)}`);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, message: e.message, data: [] };
    }
  },

  getDoctorAppointments: async (doctorId: string) => {
    try {
      const data = await get<any[]>(`/api/appointments/doctor/${encodeURIComponent(doctorId)}`);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, message: e.message, data: [] };
    }
  },

  searchAppointmentEnabledHospitals: async (query: string) => {
    try {
      const data = await get<any[]>(`/api/appointments/search?q=${encodeURIComponent(query)}`);
      return { success: true, data };
    } catch {
      return { success: false, data: [] };
    }
  },
};
