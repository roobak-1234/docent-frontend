import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, User, Clock, CheckCircle, XCircle, FileText, Activity } from 'lucide-react';
import { appointmentService } from '../services/AppointmentService';

interface AppointmentManagementProps {
  hospitalId: string;
}

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ hospitalId }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [settings, setSettings] = useState({
    slots: '',
    fees: '',
    operationalDays: ''
  });
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const settingsRes = await appointmentService.getAppointmentSettings(hospitalId);
    if (settingsRes.success) {
      setIsEnabled(settingsRes.data.enabled);
      if (settingsRes.data.settings) {
        try {
          const parsed = JSON.parse(settingsRes.data.settings);
          setSettings({
            slots: parsed.slots || '',
            fees: parsed.fees || '',
            operationalDays: parsed.operationalDays || ''
          });
        } catch(e) {}
      }
    }

    if (settingsRes.data?.enabled) {
      const appointmentsRes = await appointmentService.getHospitalAppointments(hospitalId);
      if (appointmentsRes.success) {
        setAppointments(appointmentsRes.data);
      }
    }
    setLoading(false);
  }, [hospitalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEnable = async () => {
    if (!settings.slots || !settings.fees || !settings.operationalDays) {
      alert('Please fill out all configuration details.');
      return;
    }
    setLoading(true);
    const result = await appointmentService.enableHospitalAppointments(hospitalId, settings);
    if (result.success) {
      setIsEnabled(true);
      setIsConfiguring(false);
      loadData();
    } else {
      alert(result.message);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    const res = await appointmentService.updateAppointmentStatus(id, status);
    if (res.success) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading appointment data...</div>;
  }

  if (!isEnabled && !isConfiguring) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Appointments Not Enabled</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Online appointments are currently disabled for this hospital. Enable them to allow patients to book consultations directly through the patient portal.
        </p>
        <button
          onClick={() => setIsConfiguring(true)}
          className="bg-docent-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all shadow-md shadow-green-500/20"
        >
          Enable Online Booking
        </button>
      </div>
    );
  }

  if (isConfiguring) {
    return (
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Configure Appointment Settings</h3>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Operational Days</label>
            <input 
              type="text" 
              value={settings.operationalDays}
              onChange={(e) => setSettings({...settings, operationalDays: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-docent-primary outline-none"
              placeholder="e.g. Monday - Friday"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Consultation Time Slots</label>
            <input 
              type="text" 
              value={settings.slots}
              onChange={(e) => setSettings({...settings, slots: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-docent-primary outline-none"
              placeholder="e.g. 09:00 AM - 05:00 PM, 30 min intervals"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Consultation Fees (Base)</label>
            <input 
              type="text" 
              value={settings.fees}
              onChange={(e) => setSettings({...settings, fees: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-docent-primary outline-none"
              placeholder="e.g. $150 / ₹500"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setIsConfiguring(false)}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleEnable}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-docent-primary hover:bg-green-600 transition-all shadow-md shadow-green-500/20"
            >
              Save & Enable
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Appointment Management</h2>
          <p className="text-sm text-slate-500">Manage patient bookings and schedule</p>
        </div>
        <button
          onClick={() => setIsConfiguring(true)}
          className="text-sm font-bold text-docent-primary hover:text-green-600 transition-colors"
        >
          Edit Settings
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Activity className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">No appointments scheduled yet</p>
            <p className="text-sm mt-1">When patients book appointments online, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{appt.patientName}</div>
                          <div className="text-xs text-slate-500">{appt.patientPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {new Date(appt.appointmentDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {appt.selectedTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 max-w-[200px]">
                        <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <span className="truncate" title={appt.reason}>{appt.reason || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        appt.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        appt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                        appt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {appt.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'Confirmed')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Confirm"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'Cancelled')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                      {appt.status === 'Confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(appt.id, 'Completed')}
                          className="text-xs font-bold text-docent-primary hover:text-green-700 underline underline-offset-2 transition-all"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;
