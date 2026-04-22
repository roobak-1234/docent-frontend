import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Search, Building2,
  Plus, X, CheckCircle, AlertTriangle, MapPin
} from 'lucide-react';
import { appointmentService } from '../services/AppointmentService';

interface PatientAppointmentsProps {
  patientId: string;
  patientName: string;
  patientPhone: string;
  linkedHospital: any; // null if patient is not linked
  nearbyHospitals?: any[];
}

const PatientAppointments: React.FC<PatientAppointmentsProps> = ({
  patientId, patientName, patientPhone, linkedHospital, nearbyHospitals = []
}) => {
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Hospital selection
  const [selectedHospital, setSelectedHospital] = useState<any>(linkedHospital);
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);
  const [hospitalCheckState, setHospitalCheckState] = useState<'idle' | 'checking' | 'enabled' | 'disabled' | 'notfound'>('idle');

  // Search for unlinked patients
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Booking form
  const [form, setForm] = useState({ date: '', time: '', reason: '', doctorId: '' });
  const [booking, setBooking] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const loadAppointments = useCallback(async () => {
    const res = await appointmentService.getPatientAppointments(patientId);
    if (res.success) setMyAppointments(res.data || []);
  }, [patientId]);

  const checkHospitalSettings = useCallback(async (hospital: any) => {
    setHospitalCheckState('checking');
    setHospitalSettings(null);
    const hid = hospital.uniqueHospitalId || hospital.UniqueHospitalId || String(hospital.id || hospital.Id || '');

    // Hospitals coming only from map search don't have a system UniqueHospitalId.
    if (!hospital?.uniqueHospitalId && !hospital?.UniqueHospitalId) {
      setHospitalCheckState('notfound');
      return;
    }

    const res = await appointmentService.getAppointmentSettings(hid);

    if (!res.success) {
      setHospitalCheckState('notfound');
      return;
    }
    if (!res.data.enabled) {
      setHospitalCheckState('disabled');
      return;
    }
    try {
      setHospitalSettings(JSON.parse(res.data.settings || '{}'));
      setHospitalCheckState('enabled');
    } catch {
      setHospitalCheckState('disabled');
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    if (linkedHospital) {
      setSelectedHospital(linkedHospital);
      checkHospitalSettings(linkedHospital);
    }
  }, [loadAppointments, checkHospitalSettings, linkedHospital]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    const res = await appointmentService.searchAppointmentEnabledHospitals(searchQuery.trim());
    setSearchResults(res.success ? res.data : []);
    setIsSearching(false);
  };

  const handleSelectSearchResult = (hospital: any) => {
    setSelectedHospital(hospital);
    checkHospitalSettings(hospital);
    setSearchResults([]);
    setSearchQuery('');
    setHasSearched(false);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital || hospitalCheckState !== 'enabled') return;

    setBooking(true);
    setBookingMsg(null);

    const hid = selectedHospital.uniqueHospitalId || selectedHospital.UniqueHospitalId || String(selectedHospital.id || '');

    const selectedDoc = hospitalSettings.assignedDoctors?.find((d: any) => d.id === form.doctorId);

    const res = await appointmentService.bookAppointment({
      uniqueHospitalId: hid,
      patientId,
      patientName,
      patientPhone: patientPhone || 'N/A',
      reason: form.reason,
      appointmentDate: new Date(form.date).toISOString(),
      selectedTime: form.time,
      doctorId: form.doctorId,
      doctorName: selectedDoc?.name,
    });

    if (res.success) {
      setBookingMsg({ type: 'success', text: '✅ Appointment booked! You will be notified once confirmed.' });
      setForm({ date: '', time: '', reason: '', doctorId: '' });
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingMsg(null);
        loadAppointments();
      }, 2500);
    } else {
      setBookingMsg({ type: 'error', text: res.message || 'Booking failed. Please try again.' });
    }
    setBooking(false);
  };

  const openModal = () => {
    setSelectedHospital(linkedHospital);
    if (linkedHospital) checkHospitalSettings(linkedHospital);
    else { setHospitalCheckState('idle'); setHospitalSettings(null); }
    setForm({ date: '', time: '', reason: '', doctorId: '' });
    setBookingMsg(null);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setShowBookingModal(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-docent-primary" /> My Appointments
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Book and manage your hospital visits</p>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-docent-primary hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-500/20">
          <Plus className="h-4 w-4" /> Book Appointment
        </button>
      </div>

      {/* Appointment list */}
      <div className="p-5">
        {myAppointments.length === 0 ? (
          <div className="text-center py-10">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-500">No appointments yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Book Appointment" to schedule a visit.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myAppointments.map(appt => (
              <div key={appt.id}
                className="border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:border-docent-primary/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-slate-300" />
                    <h4 className="font-bold text-sm text-slate-700">{appt.uniqueHospitalId}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {appt.selectedTime}
                    </span>
                    {appt.doctorName && (
                      <span className="flex items-center gap-1 ml-2 text-docent-primary font-medium">
                        Dr. {appt.doctorName}
                      </span>
                    )}
                  </div>
                  {appt.reason && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-[220px]">{appt.reason}</p>
                  )}
                </div>
                <StatusBadge status={appt.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-docent-primary/5 to-blue-500/5">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-docent-primary" /> Book a Consultation
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Feedback message */}
              {bookingMsg && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-start gap-3 ${
                  bookingMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {bookingMsg.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />}
                  {bookingMsg.text}
                </div>
              )}

              {/* ── Step 1: Hospital ── */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">1 · Select Hospital</p>

                {selectedHospital ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-blue-900">{selectedHospital.name || selectedHospital.Name}</h4>
                        <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{selectedHospital.address || selectedHospital.Address || 'Address not available'}
                        </p>
                      </div>
                      {!linkedHospital && (
                        <button
                          onClick={() => { setSelectedHospital(null); setHospitalCheckState('idle'); setHospitalSettings(null); }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 underline shrink-0 ml-3"
                        >
                          Change
                        </button>
                      )}
                    </div>

                    {/* Hospital check status */}
                    {hospitalCheckState === 'checking' && (
                      <p className="text-xs text-blue-500 mt-2 animate-pulse">Checking appointment availability...</p>
                    )}
                    {hospitalCheckState === 'disabled' && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-medium">
                          This hospital is in the <strong>system database</strong> but has <strong>not enabled</strong> appointments yet.
                          Please contact the hospital directly.
                        </p>
                      </div>
                    )}
                    {hospitalCheckState === 'notfound' && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-medium">
                          This hospital has <strong>not registered</strong> in the system database and has <strong>no appointments enabled</strong>.
                          Please select a registered hospital to proceed.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Search for hospitals
                  <div className="space-y-3">
                    {nearbyHospitals.length > 0 && (
                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Nearby Hospitals</p>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {nearbyHospitals.slice(0, 10).map((h) => {
                            const isRegistered = !!(h.uniqueHospitalId || h.UniqueHospitalId);
                            return (
                              <button
                                key={`${h.uniqueHospitalId || h.UniqueHospitalId || h.id || h.Id}_${h.latitude}_${h.longitude}`}
                                type="button"
                                onClick={() => handleSelectSearchResult(h)}
                                className="w-full p-2.5 text-left rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-bold text-slate-800 truncate">{h.name || h.Name || 'Hospital'}</p>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                    isRegistered ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {isRegistered ? 'Registered' : 'Map Only'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 truncate">{h.address || h.Address || 'Address not listed'}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      {linkedHospital
                        ? 'Your linked hospital will be pre-selected.'
                        : 'Search for an appointment-enabled hospital by name or location.'}
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. Apollo, Salem..."
                          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-docent-primary focus:ring-1 focus:ring-docent-primary"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                      </div>
                      <button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}
                        className="px-4 py-2.5 bg-docent-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-green-600 transition-colors">
                        {isSearching ? '...' : 'Search'}
                      </button>
                    </div>

                    {hasSearched && searchResults.length === 0 && !isSearching && (
                      <div className="text-center py-5 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium text-slate-500">No appointment-enabled hospitals found</p>
                        <p className="text-xs mt-1">Try a different name or check the spelling</p>
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 max-h-48 overflow-y-auto">
                        {searchResults.map(h => (
                          <button
                            key={h.uniqueHospitalId || h.id}
                            onClick={() => handleSelectSearchResult(h)}
                            className="w-full p-3 text-left hover:bg-slate-50 flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="font-bold text-sm text-slate-800">{h.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />{h.address || 'Address not listed'}
                              </div>
                            </div>
                            <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">OPEN</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Step 2: Booking Form ── */}
              {hospitalCheckState === 'enabled' && hospitalSettings && (
                <form onSubmit={handleBook} className="space-y-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">2 · Appointment Details</p>

                  {/* Hospital info banner */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Days</p>
                      <p className="text-xs font-bold text-slate-700">{hospitalSettings.operationalDays || '–'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Hours</p>
                      <p className="text-xs font-bold text-slate-700">{hospitalSettings.openTime}–{hospitalSettings.closeTime}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Fee</p>
                      <p className="text-xs font-bold text-docent-primary">{hospitalSettings.fees || '–'}</p>
                    </div>
                  </div>

                  {hospitalSettings.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {hospitalSettings.specializations.map((s: string) => (
                        <span key={s} className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}

                  {hospitalSettings.assignedDoctors?.filter((d: any) => d.id).length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Consulting Doctor</label>
                      <select required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/30 text-sm font-medium bg-white"
                        value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
                        <option value="">Select Doctor...</option>
                        {hospitalSettings.assignedDoctors.filter((d: any) => d.id).map((doc: any) => (
                          <option key={doc.id} value={doc.id}>Dr. {doc.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Date</label>
                      <input type="date" required min={minDate}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/30 text-sm font-medium"
                        value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Preferred Time</label>
                      <input type="time" required
                        min={hospitalSettings.openTime}
                        max={hospitalSettings.closeTime}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/30 text-sm font-medium"
                        value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Reason / Symptoms</label>
                    <textarea required rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/30 text-sm resize-none"
                      placeholder="Briefly describe your symptoms or reason for the visit..."
                      value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
                  </div>

                  <button type="submit" disabled={booking}
                    className="w-full py-3.5 rounded-xl bg-docent-primary text-white font-black shadow-md shadow-green-500/20 hover:bg-green-600 disabled:opacity-50 transition-all">
                    {booking ? 'Booking...' : '✅ Confirm Appointment'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
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
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

export default PatientAppointments;
