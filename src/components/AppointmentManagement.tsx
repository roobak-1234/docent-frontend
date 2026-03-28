import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, User, Clock, CheckCircle, XCircle, FileText,
  Activity, Settings, AlertTriangle, RefreshCw,
  Sun, DollarSign, Star
} from 'lucide-react';
import { appointmentService } from '../services/AppointmentService';

interface AppointmentManagementProps {
  hospitalId: string;
  hospitalName: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Neurology',
  'Oncology', 'Pediatrics', 'Gynecology', 'Dermatology',
  'ENT', 'Ophthalmology', 'Psychiatry', 'Emergency Medicine',
];

const defaultSettings = {
  operationalDays: 'Monday - Friday',
  openTime: '09:00',
  closeTime: '17:00',
  slotDuration: '30',
  fees: '₹500',
  specializations: [] as string[],
  maxAppointmentsPerDay: '20',
  contactForAppointments: '',
};

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ hospitalId, hospitalName }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [view, setView] = useState<'idle' | 'setup' | 'manage'>('idle');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [step, setStep] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    const settingsRes = await appointmentService.getAppointmentSettings(hospitalId);

    if (settingsRes.success && settingsRes.data.enabled) {
      try {
        const parsed = JSON.parse(settingsRes.data.settings || '{}');
        setSettings(s => ({ ...s, ...parsed }));
      } catch {}

      const apptRes = await appointmentService.getHospitalAppointments(hospitalId);
      if (apptRes.success) setAppointments(apptRes.data || []);
      setView('manage');
    } else {
      setView('idle');
    }
    setLoading(false);
  }, [hospitalId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveSettings = async () => {
    setSaving(true);
    const res = await appointmentService.enableHospitalAppointments(hospitalId, settings);
    if (res.success) {
      loadData();
    } else {
      alert(res.message || 'Failed to save settings.');
    }
    setSaving(false);
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    const res = await appointmentService.updateAppointmentStatus(id, status);
    if (res.success) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  const toggleSpec = (spec: string) => {
    setSettings(s => ({
      ...s,
      specializations: s.specializations.includes(spec)
        ? s.specializations.filter(x => x !== spec)
        : [...s.specializations, spec],
    }));
  };

  const filtered = filterStatus === 'All'
    ? appointments
    : appointments.filter(a => a.status === filterStatus);

  const counts = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'Pending').length,
    confirmed: appointments.filter(a => a.status === 'Confirmed').length,
    completed: appointments.filter(a => a.status === 'Completed').length,
  };

  // ─── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-3" />
        Loading appointment data...
      </div>
    );
  }

  // ─── IDLE (not yet enabled) ──────────────────────────────────────────────────
  if (view === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-docent-primary/10 to-blue-500/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-docent-primary/20">
          <Calendar className="h-12 w-12 text-docent-primary" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-3">Enable Online Appointments</h3>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Allow patients to discover <strong>{hospitalName}</strong> and book consultations online.
          Takes 2 minutes to set up.
        </p>
        <button
          onClick={() => { setView('setup'); setStep(1); }}
          className="px-8 py-4 bg-docent-primary text-white rounded-2xl font-black text-lg hover:bg-green-600 transition-all shadow-xl shadow-green-500/25 hover:scale-105 active:scale-95"
        >
          Set Up Appointment Booking
        </button>
      </div>
    );
  }

  // ─── SETUP WIZARD ────────────────────────────────────────────────────────────
  if (view === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-black border-2 transition-all ${
                step > s ? 'bg-docent-primary border-docent-primary text-white' :
                step === s ? 'border-docent-primary text-docent-primary bg-white' :
                'border-slate-200 text-slate-400 bg-white'
              }`}>
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded-full ${step > s ? 'bg-docent-primary' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          {/* Step 1: Hours */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">🕐 Operational Hours</h3>
                <p className="text-sm text-slate-500">When can patients book appointments?</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Operational Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const days = settings.operationalDays.split(',').map(d => d.trim()).filter(Boolean);
                        const updated = days.includes(day)
                          ? days.filter(d => d !== day)
                          : [...days, day];
                        setSettings(s => ({ ...s, operationalDays: updated.join(', ') }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        settings.operationalDays.includes(day)
                          ? 'bg-docent-primary text-white border-docent-primary'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-docent-primary'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-sm font-bold text-slate-700 mb-2">
                    <Sun className="h-4 w-4 text-amber-400" /> Opening Time
                  </label>
                  <input type="time" value={settings.openTime}
                    onChange={e => setSettings(s => ({ ...s, openTime: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-docent-primary/30 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Closing Time</label>
                  <input type="time" value={settings.closeTime}
                    onChange={e => setSettings(s => ({ ...s, closeTime: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-docent-primary/30 outline-none font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Slot Duration (minutes)</label>
                  <select value={settings.slotDuration}
                    onChange={e => setSettings(s => ({ ...s, slotDuration: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-docent-primary/30 outline-none bg-white font-medium"
                  >
                    {['15', '20', '30', '45', '60'].map(v => <option key={v} value={v}>{v} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Max Appointments/Day</label>
                  <input type="number" min="1" max="100" value={settings.maxAppointmentsPerDay}
                    onChange={e => setSettings(s => ({ ...s, maxAppointmentsPerDay: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-docent-primary/30 outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fees & Specializations */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">💊 Fees & Specializations</h3>
                <p className="text-sm text-slate-500">What does this hospital offer?</p>
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-bold text-slate-700 mb-2">
                  <DollarSign className="h-4 w-4 text-green-500" /> Consultation Fee
                </label>
                <input type="text" placeholder="e.g. ₹500 or Free" value={settings.fees}
                  onChange={e => setSettings(s => ({ ...s, fees: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-docent-primary/30 outline-none font-medium"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-bold text-slate-700 mb-3">
                  <Star className="h-4 w-4 text-amber-400" /> Specializations Available
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpec(spec)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        settings.specializations.includes(spec)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Appointment Contact Number</label>
                <input type="tel" placeholder="Phone number for appointment inquiries"
                  value={settings.contactForAppointments}
                  onChange={e => setSettings(s => ({ ...s, contactForAppointments: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-docent-primary/30 outline-none font-medium"
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-1">✅ Review & Enable</h3>
                <p className="text-sm text-slate-500">Confirm your appointment booking configuration</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">
                <SummaryRow label="Hospital" value={hospitalName} />
                <SummaryRow label="Operational Days" value={settings.operationalDays || 'Not set'} />
                <SummaryRow label="Hours" value={`${settings.openTime} – ${settings.closeTime}`} />
                <SummaryRow label="Slot Duration" value={`${settings.slotDuration} minutes`} />
                <SummaryRow label="Max/Day" value={settings.maxAppointmentsPerDay} />
                <SummaryRow label="Consultation Fee" value={settings.fees || 'Not set'} />
                <SummaryRow label="Specializations" value={settings.specializations.join(', ') || 'General'} />
                {settings.contactForAppointments && <SummaryRow label="Contact" value={settings.contactForAppointments} />}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Once enabled, patients can discover this hospital and book appointments online. 
                  You can edit settings anytime from the Appointments tab.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : setView('idle')}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={() => step < 3 ? setStep(s => s + 1) : handleSaveSettings()}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-black text-white bg-docent-primary hover:bg-green-600 disabled:opacity-50 transition-all shadow-md shadow-green-500/20"
            >
              {saving ? 'Saving...' : step < 3 ? 'Continue →' : '🚀 Enable Appointment Booking'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MANAGE (already enabled) ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-800">Appointment Booking</h2>
            <span className="flex items-center gap-1 bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> ACTIVE
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {settings.operationalDays} · {settings.openTime}–{settings.closeTime} · {settings.slotDuration}min slots · {settings.fees}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setView('setup'); setStep(1); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-bold text-slate-600"
          >
            <Settings className="h-4 w-4" />
            Edit Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Pending', value: counts.pending, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Confirmed', value: counts.confirmed, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Completed', value: counts.completed, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border ${s.border} text-center`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Appointments table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-docent-primary" /> Appointments
          </h3>
          <div className="flex gap-2">
            {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  filterStatus === s
                    ? 'bg-docent-primary text-white border-docent-primary'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-docent-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-500">No {filterStatus !== 'All' ? filterStatus : ''} appointments yet</p>
            <p className="text-sm mt-1">When patients book, they'll appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{appt.patientName}</div>
                          <div className="text-xs text-slate-400">{appt.patientPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {appt.selectedTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 max-w-[180px]">
                        <FileText className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                        <span className="text-slate-600 line-clamp-2" title={appt.reason}>{appt.reason || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {appt.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleStatusUpdate(appt.id, 'Confirmed')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Confirm">
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleStatusUpdate(appt.id, 'Cancelled')}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Cancel">
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                      {appt.status === 'Confirmed' && (
                        <button onClick={() => handleStatusUpdate(appt.id, 'Completed')}
                          className="text-xs font-bold text-docent-primary hover:underline">
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

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Confirmed: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    Completed: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-sm text-slate-500 shrink-0">{label}</span>
    <span className="text-sm font-bold text-slate-800 text-right">{value}</span>
  </div>
);

export default AppointmentManagement;
