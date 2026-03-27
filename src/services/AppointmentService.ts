const API_URL = (process.env.REACT_APP_API_BASE_URL || 'https://docent-backend-b4bsayc0dpedc7bf.centralindia-01.azurewebsites.net/api').replace('/api', '');

export const appointmentService = {
  // Doctor/Admin side: Enable appointments for a hospital
  enableHospitalAppointments: async (uniqueHospitalId: string, settings: any) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/enable-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniqueHospitalId,
          settingsJson: JSON.stringify(settings)
        })
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || 'Failed to enable appointments' };
      return { success: true, data: data.hospital };
    } catch (error: any) {
      return { success: false, message: 'Failed to enable appointments' };
    }
  },

  // Get settings for a hospital
  getAppointmentSettings: async (hospitalId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/settings/${hospitalId}`);
      const data = await response.json();
      if (!response.ok) return { success: false, data: { enabled: false, settings: '{}' } };
      return { success: true, data };
    } catch (error: any) {
      return { success: false, data: { enabled: false, settings: '{}' } };
    }
  },

  // Get appointments for a specific hospital (Doctor/Admin view)
  getHospitalAppointments: async (hospitalId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/hospital/${hospitalId}`);
      const data = await response.json();
      if (!response.ok) return { success: false, message: 'Failed to fetch appointments' };
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: 'Failed to fetch appointments' };
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId: number, status: string) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: 'Failed to update status' };
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: 'Failed to update status' };
    }
  },

  // Patient side: Book an appointment
  bookAppointment: async (appointmentData: any) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || 'Failed to book appointment' };
      return { success: true, data: data.appointment };
    } catch (error: any) {
      return { success: false, message: 'Failed to book appointment' };
    }
  },

  // Patient side: Get my appointments
  getPatientAppointments: async (patientId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/patient/${patientId}`);
      const data = await response.json();
      if (!response.ok) return { success: false, message: 'Failed to fetch your appointments' };
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: 'Failed to fetch your appointments' };
    }
  }
};
