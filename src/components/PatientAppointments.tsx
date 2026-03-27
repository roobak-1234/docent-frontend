import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Activity, Search, Building2, Plus, X } from 'lucide-react';
import { appointmentService } from '../services/AppointmentService';

interface PatientAppointmentsProps {
  patientId: string;
  patientName: string;
  patientPhone: string;
  linkedHospital: any;
  facilities: any[];
}

const PatientAppointments: React.FC<PatientAppointmentsProps> = ({ patientId, patientName, patientPhone, linkedHospital, facilities }) => {
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedHospital, setSelectedHospital] = useState<any>(linkedHospital);
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);
  
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    reason: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadAppointments = useCallback(async () => {
    const res = await appointmentService.getPatientAppointments(patientId);
    if (res.success) {
      setMyAppointments(res.data);
    }
  }, [patientId]);

  const checkHospitalSettings = useCallback(async (hospitalId: string) => {
    setLoading(true);
    const res = await appointmentService.getAppointmentSettings(hospitalId);
    if (res.success && res.data.enabled) {
      try {
        setHospitalSettings(JSON.parse(res.data.settings));
      } catch (e) {
        setHospitalSettings(null);
      }
    } else {
      setHospitalSettings(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAppointments();
    if (linkedHospital) {
      checkHospitalSettings(linkedHospital.uniqueHospitalId);
    }
  }, [loadAppointments, checkHospitalSettings, linkedHospital]);

  const handleSearchSelect = (hospital: any) => {
    setSelectedHospital(hospital);
    const hid = hospital.uniqueHospitalId || hospital.UniqueHospitalId || (hospital.id || hospital.Id)?.toString();
    checkHospitalSettings(hid);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital || !hospitalSettings) return;

    setLoading(true);
    setMessage('');
    
    const appointmentData = {
      uniqueHospitalId: selectedHospital.uniqueHospitalId || selectedHospital.UniqueHospitalId || (selectedHospital.id || selectedHospital.Id)?.toString(),
      patientId: patientId,
      patientName: patientName,
      patientPhone: patientPhone || 'N/A',
      reason: bookingForm.reason,
      appointmentDate: new Date(bookingForm.date).toISOString(),
      selectedTime: bookingForm.time
    };

    const res = await appointmentService.bookAppointment(appointmentData);
    if (res.success) {
      setMessage('Appointment booked successfully!');
      setTimeout(() => {
        setShowBookingModal(false);
        setMessage('');
        loadAppointments();
      }, 2000);
    } else {
      setMessage(res.message);
    }
    setLoading(false);
  };

  const filteredFacilities = facilities.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-docent-primary" /> My Appointments
          </h3>
          <p className="text-xs text-slate-500 mt-1">Book and manage your hospital visits</p>
        </div>
        <button
          onClick={() => {
            setSelectedHospital(linkedHospital);
            if (linkedHospital) {
              checkHospitalSettings(linkedHospital.uniqueHospitalId || linkedHospital.id?.toString());
            }
            setShowBookingModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-docent-primary hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-500/20"
        >
          <Plus className="h-4 w-4" /> Book
        </button>
      </div>

      <div className="p-5">
        {myAppointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-600">No Appointments</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">You haven't booked any hospital appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myAppointments.map(appt => (
              <div key={appt.id} className="border border-slate-100 rounded-xl p-4 hover:border-docent-primary transition-colors flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{new Date(appt.appointmentDate).toDateString()}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {appt.selectedTime}
                    </span>
                    <span className="text-xs text-slate-500 line-clamp-1 max-w-[150px]">{appt.reason}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  appt.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                  appt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                  appt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-docent-primary" /> Book Consultation
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {message && (
                <div className={`p-3 text-sm font-bold rounded-xl ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}

              {/* Hospital Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">1. Select Hospital</label>
                
                {selectedHospital ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-blue-900">{selectedHospital.name || selectedHospital.Name}</h4>
                      <p className="text-xs text-blue-700 mt-1">{selectedHospital.address || selectedHospital.Address}</p>
                    </div>
                    {!linkedHospital && (
                      <button onClick={() => { setSelectedHospital(null); setHospitalSettings(null); }} className="text-xs font-bold text-blue-600 hover:text-blue-800 underline">
                        Change
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search hospitals by name or location..." 
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-docent-primary focus:ring-1 focus:ring-docent-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
                      {facilities.filter(f => {
                        const name = (f.name || f.Name || '').toLowerCase();
                        const address = (f.address || f.Address || '').toLowerCase();
                        const query = searchQuery.toLowerCase();
                        return name.includes(query) || address.includes(query);
                      }).map(f => (
                        <div key={f.id || f.uniqueHospitalId} onClick={() => handleSearchSelect(f)} className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm text-slate-800">{f.name || f.Name || 'Hospital'}</div>
                            <div className="text-xs text-slate-500">{f.address || f.Address || 'No Address'}</div>
                          </div>
                          <Building2 className="h-4 w-4 text-slate-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Appointment Details */}
              {selectedHospital && (
                <>
                  {loading && !hospitalSettings && !message ? (
                    <div className="text-center py-4 text-slate-400 text-sm font-medium">Checking hospital availability...</div>
                  ) : !hospitalSettings ? (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                      <Activity className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-amber-800">Online Booking Unavailable</p>
                      <p className="text-xs text-amber-700 mt-1">This hospital is not registered or has not enabled online appointments.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleBook} className="space-y-4 animate-in fade-in">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">Operational:</span>
                          <span className="font-bold text-slate-700">{hospitalSettings.operationalDays}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">Available Slots:</span>
                          <span className="font-bold text-slate-700">{hospitalSettings.slots}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Est. Fee:</span>
                          <span className="font-bold text-docent-primary">{hospitalSettings.fees}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                          <input 
                            type="date" 
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/50 text-sm font-medium"
                            value={bookingForm.date}
                            onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Time</label>
                          <input 
                            type="time" 
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/50 text-sm font-medium"
                            value={bookingForm.time}
                            onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reason for Visit</label>
                        <textarea 
                          required
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/50 text-sm resize-none"
                          placeholder="Please briefly describe your symptoms or reason for visit..."
                          value={bookingForm.reason}
                          onChange={(e) => setBookingForm({...bookingForm, reason: e.target.value})}
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-docent-primary text-white font-black text-sm shadow-md shadow-green-500/20 hover:bg-green-600 disabled:opacity-50 transition-all"
                      >
                        {loading ? 'Processing...' : 'Confirm Booking'}
                      </button>
                    </form>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
