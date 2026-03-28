import React, { useState, useEffect, useRef } from 'react';
import { User, Heart, Mail, Eye, EyeOff, FileText, Plus, Trash2, Download, Calendar, Upload, MapPin } from 'lucide-react';
import { authService } from '../services/AuthService';
import { hospitalService } from '../services/hospitalService';
import { AzureMap } from './AzureMap';
import PatientAppointments from './PatientAppointments';

interface Doctor {
  id: string;
  username: string;
  email: string;
  phone?: string;
  uniqueDoctorId: string;
}

interface DataSharingSettings {
  vitals: boolean;
  location: boolean;
  emergencyContacts: boolean;
  medicalHistory: boolean;
}

interface MedicalRecord {
  id: string;
  title: string;
  type: string;
  date: string;
  notes: string;
  fileName?: string;
  fileData?: string; // base64 for demo purposes
}

const PatientDashboard: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [dataSharingSettings, setDataSharingSettings] = useState<DataSharingSettings>({
    vitals: true,
    location: true,
    emergencyContacts: false,
    medicalHistory: false
  });
  
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<MedicalRecord>>({
    type: 'Prescription'
  });
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [registeredHospitals, setRegisteredHospitals] = useState<any[]>([]);
  const [isChangingDoctor, setIsChangingDoctor] = useState(false);
  const [newDoctorId, setNewDoctorId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const loadDoctor = async () => {
      if (currentUser?.doctorId) {
        const assignedDoctor = await authService.getDoctorByUniqueId(currentUser.doctorId);
        if (assignedDoctor) {
          setDoctor(assignedDoctor as Doctor);
        }
      }
    };

    loadDoctor();

    // Load data sharing settings
    const savedSettings = localStorage.getItem(`data_sharing_${currentUser?.id}`);
    if (savedSettings) {
      setDataSharingSettings(JSON.parse(savedSettings));
    }
    
    // Load medical records
    const savedRecords = localStorage.getItem(`medical_records_${currentUser?.id}`);
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }

    // Get user location and load nearby hospitals
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserLocation(loc);
          setGpsLoading(false);

          // Load both registered DB hospitals and Azure Maps nearby hospitals
          const [dbResponse, apiHospitals] = await Promise.allSettled([
            hospitalService.getRegisteredHospitals(),
            hospitalService.searchNearbyHospitals(loc.latitude, loc.longitude)
          ]);

          const combined: any[] = [];
          if (dbResponse.status === 'fulfilled' && dbResponse.value.success && dbResponse.value.data) {
            combined.push(...dbResponse.value.data);
          }
          if (apiHospitals.status === 'fulfilled') {
            const existingIds = new Set(combined.map((h: any) => h.uniqueHospitalId || h.id));
            const newItems = apiHospitals.value.filter((h: any) => !existingIds.has(h.id));
            combined.push(...newItems);
          }
          setRegisteredHospitals(combined);
        },
        async (err) => {
          console.error('GPS error:', err);
          setGpsLoading(false);
          // Still load registered hospitals even without GPS
          const response = await hospitalService.getRegisteredHospitals();
          if (response.success && response.data) setRegisteredHospitals(response.data);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsLoading(false);
      const fetchHospitals = async () => {
        const response = await hospitalService.getRegisteredHospitals();
        if (response.success && response.data) {
          setRegisteredHospitals(response.data);
        }
      };
      fetchHospitals();
    }
  }, [currentUser]);

  const handleChangeDoctor = async () => {
    if (!newDoctorId.trim()) return;
    
    const confirmTransfer = window.confirm(
      "Warning: Changing your healthcare provider will transfer your database record to the new doctor/hospital. Are you sure you want to proceed?"
    );
    
    if (confirmTransfer) {
      const allUsers = JSON.parse(localStorage.getItem('docent_users') || '[]');
      const userIndex = allUsers.findIndex((u: any) => u.id === currentUser?.id);
      
      if (userIndex !== -1) {
        allUsers[userIndex].doctorId = newDoctorId;
        localStorage.setItem('docent_users', JSON.stringify(allUsers));
        
        // Update current user in storage
        const updatedUser = { ...currentUser!, doctorId: newDoctorId };
        localStorage.setItem('docent_current_user', JSON.stringify(updatedUser));
        
        // Refresh local state
        setDoctor(null); // Will be reloaded
        setIsChangingDoctor(false);
        setNewDoctorId('');
        window.location.reload(); // Refresh to ensure all states are clean
      }
    }
  };

  const handleDisconnectDoctor = () => {
    if (window.confirm("Are you sure you want to delete the current connection? You will no longer be linked to any healthcare provider.")) {
      const allUsers = JSON.parse(localStorage.getItem('docent_users') || '[]');
      const userIndex = allUsers.findIndex((u: any) => u.id === currentUser?.id);
      
      if (userIndex !== -1) {
        delete allUsers[userIndex].doctorId;
        localStorage.setItem('docent_users', JSON.stringify(allUsers));
        
        const updatedUser = { ...currentUser! };
        delete updatedUser.doctorId;
        localStorage.setItem('docent_current_user', JSON.stringify(updatedUser));
        
        setDoctor(null);
        window.location.reload();
      }
    }
  };

  const toggleDataSharing = (key: keyof DataSharingSettings) => {
    const newSettings = { ...dataSharingSettings, [key]: !dataSharingSettings[key] };
    setDataSharingSettings(newSettings);
    localStorage.setItem(`data_sharing_${currentUser?.id}`, JSON.stringify(newSettings));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 2MB to prevent localstorage issues
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large! Please select a file under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRecord(prev => ({
          ...prev,
          fileName: file.name,
          fileData: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveRecord = () => {
    if (!newRecord.title || !newRecord.date) {
      alert("Please fill in the required fields (Title and Date)");
      return;
    }
    
    const record: MedicalRecord = {
      id: Date.now().toString(),
      title: newRecord.title,
      type: newRecord.type || 'Other',
      date: newRecord.date,
      notes: newRecord.notes || '',
      fileName: newRecord.fileName,
      fileData: newRecord.fileData
    };
    
    const updatedRecords = [record, ...records];
    setRecords(updatedRecords);
    localStorage.setItem(`medical_records_${currentUser?.id}`, JSON.stringify(updatedRecords));
    
    setShowAddRecordModal(false);
    setNewRecord({ type: 'Prescription' });
  };

  const deleteRecord = (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedRecords = records.filter(r => r.id !== id);
      setRecords(updatedRecords);
      localStorage.setItem(`medical_records_${currentUser?.id}`, JSON.stringify(updatedRecords));
    }
  };

  const downloadRecord = (record: MedicalRecord) => {
    if (record.fileData) {
      const a = document.createElement('a');
      a.href = record.fileData;
      a.download = record.fileName || `medical_record_${record.id}`;
      a.click();
    }
  };

  if (!currentUser || currentUser.userType !== 'patient') {
    return <div>Access denied. Patient account required.</div>;
  }

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-br from-lifelink-primary/20 to-lifelink-secondary/20 p-5 rounded-2xl shadow-inner border border-white">
            <User className="h-10 w-10 text-lifelink-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{currentUser.username}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
              <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-700">ID: {currentUser.id}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {currentUser.email}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
            <Heart className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Status</p>
              <p className="text-sm font-semibold text-emerald-900">Active Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Map Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-lifelink-primary" />
                Nearby Hospitals & My Location
              </h3>
            </div>
            <div className="p-4">
              <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative group">
                <AzureMap 
                  subscriptionKey={process.env.REACT_APP_AZURE_MAPS_KEY || ''}
                  center={userLocation || { latitude: 20.5937, longitude: 78.9629 }}
                  zoom={userLocation ? 14 : 5}
                  markers={[
                    ...(userLocation ? [{
                      coordinate: userLocation,
                      popupContent: 'My Current Location',
                      type: 'user' as const
                    }] : []),
                    ...registeredHospitals.map(h => ({
                      coordinate: { latitude: h.latitude, longitude: h.longitude },
                      popupContent: `${h.name} (${h.specialization || h.type || 'Hospital'})`,
                      type: (h.isExternal || h.type === 'Hospital' ? 'hospital' : 'clinic') as 'hospital' | 'clinic'
                    }))
                  ]}
                />
                {gpsLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-lifelink-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-xs font-bold text-slate-600">Acquiring your location...</p>
                      <p className="text-[10px] text-slate-400 mt-1">Allow location access in your browser</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm shadow-blue-500/20"></div>
                  <span>My Location</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-600 shadow-sm shadow-red-500/20"></div>
                  <span>Hospital / Clinic</span>
                </div>
                {userLocation && (
                  <div className="ml-auto text-slate-300 normal-case font-medium">
                    📍 {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Records Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-lifelink-primary" />
                  My Medical Records
                </h3>
                <p className="text-sm text-slate-500 mt-1">Manage and view your complete medical history</p>
              </div>
              <button
                onClick={() => setShowAddRecordModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-lifelink-primary hover:bg-green-600 shadow-md shadow-green-500/20 text-white rounded-xl text-sm font-bold transition-all transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Add Record
              </button>
            </div>
            
            <div className="p-6">
              {records.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-slate-700 mb-2">No Records Found</h4>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">Upload your prescriptions, test reports, and other medical documents to keep them organized.</p>
                  <button
                    onClick={() => setShowAddRecordModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-lifelink-primary text-lifelink-primary hover:bg-lifelink-primary hover:text-white rounded-lg text-sm font-bold transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    Upload First Record
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {records.map((record) => (
                    <div key={record.id} className="group border border-slate-200 rounded-xl p-5 hover:border-lifelink-primary hover:shadow-lg transition-all duration-300 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3">
                          <div className="mt-1">
                            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 line-clamp-1" title={record.title}>{record.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                {record.type}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(record.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {record.notes && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {record.notes}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="flex-1 w-full truncate pr-2">
                          {record.fileName ? (
                            <span className="text-xs font-medium text-slate-500 truncate inline-block w-full" title={record.fileName}>
                              📎 {record.fileName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No attachment</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {record.fileData && (
                            <button 
                              onClick={() => downloadRecord(record)}
                              className="p-1.5 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors"
                              title="Download Attachment"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Appointments ── */}
          <PatientAppointments
            patientId={currentUser.id}
            patientName={currentUser.username}
            patientPhone={currentUser.phone || ''}
            linkedHospital={registeredHospitals[0] || null}
          />
        </div>

        <div className="space-y-6">
          {/* Assigned Doctor Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Your Healthcare Team</h3>
            </div>
            <div className="p-6">
              {doctor ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-4 rounded-xl shadow-sm border border-blue-200">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-lg">Dr. {doctor.username}</h4>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5"/> {doctor.email}</p>
                      <code className="text-xs font-mono font-bold mt-2 inline-block bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                        ID: {doctor.uniqueDoctorId}
                      </code>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <button 
                      onClick={() => setIsChangingDoctor(!isChangingDoctor)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Change Healthcare Provider
                    </button>
                    <button 
                      onClick={handleDisconnectDoctor}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Current Connection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100">
                    <User className="h-8 w-8 text-orange-400" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">No Assigned Doctor</h4>
                  <p className="text-sm text-slate-500 mb-4 px-4">Contact your healthcare provider to get your doctor's ID link.</p>
                  <button 
                    onClick={() => setIsChangingDoctor(true)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-lifelink-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-green-500/20"
                  >
                    Link Doctor/Hospital
                  </button>
                </div>
              )}

              {isChangingDoctor && (
                <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Enter Doctor/Hospital ID</h4>
                  <p className="text-[10px] text-slate-500 mb-4">You will be prompted to transfer your medical database to this provider.</p>
                  <div className="space-y-3">
                    <input 
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lifelink-primary/50 text-sm font-mono"
                      placeholder="e.g. DR-123456-789"
                      value={newDoctorId}
                      onChange={(e) => setNewDoctorId(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleChangeDoctor}
                        className="flex-1 py-2.5 bg-lifelink-primary text-white rounded-xl text-xs font-bold shadow-md shadow-green-500/20"
                      >
                        Connect & Transfer
                      </button>
                      <button 
                        onClick={() => {
                          setIsChangingDoctor(false);
                          setNewDoctorId('');
                        }}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data Sharing Controls */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Privacy Controls</h3>
              <p className="text-xs text-slate-500 mt-1">Manage what your team can see</p>
            </div>
            
            <div className="p-5 space-y-3">
              {[
                { key: 'vitals', label: 'Health Vitals', description: 'Real-time metrics' },
                { key: 'medicalHistory', label: 'Medical Records', description: 'Allow doctor to view records' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white">
                  <div className="mb-3 sm:mb-0 pr-4">
                    <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                  <button
                    onClick={() => toggleDataSharing(key as keyof DataSharingSettings)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all w-full sm:w-auto ${
                      dataSharingSettings[key as keyof DataSharingSettings]
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 font-medium hover:bg-slate-100'
                    }`}
                  >
                    {dataSharingSettings[key as keyof DataSharingSettings] ? (
                      <><Eye className="h-4 w-4" /> <span className="text-xs w-12">Shared</span></>
                    ) : (
                      <><EyeOff className="h-4 w-4" /> <span className="text-xs w-12">Private</span></>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-slate-100 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Upload Record</h3>
              <button 
                onClick={() => setShowAddRecordModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Record Title *</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. Blood Test Results"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lifelink-primary/50 focus:border-lifelink-primary bg-slate-50 focus:bg-white transition-all"
                  value={newRecord.title || ''}
                  onChange={e => setNewRecord({...newRecord, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Document Type</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lifelink-primary/50 focus:border-lifelink-primary bg-slate-50 focus:bg-white transition-all appearance-none"
                    value={newRecord.type || 'Prescription'}
                    onChange={e => setNewRecord({...newRecord, type: e.target.value})}
                  >
                    <option value="Prescription">Prescription</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Imaging">Imaging (X-Ray, MRI)</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="General Notes">General Notes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Date *</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lifelink-primary/50 focus:border-lifelink-primary bg-slate-50 focus:bg-white transition-all"
                    value={newRecord.date || ''}
                    onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Attachment (Max 2MB)</label>
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 hover:border-lifelink-primary transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  {newRecord.fileName ? (
                    <div className="flex items-center justify-center gap-2 text-lifelink-primary font-medium">
                      <FileText className="h-5 w-5" />
                      <span className="truncate max-w-[200px]">{newRecord.fileName}</span>
                    </div>
                  ) : (
                    <div className="text-slate-500">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                      <span className="text-sm font-medium">Click to browse files</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Additional Notes</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lifelink-primary/50 focus:border-lifelink-primary bg-slate-50 focus:bg-white transition-all resize-none"
                  placeholder="Any extra details about this record..."
                  value={newRecord.notes || ''}
                  onChange={e => setNewRecord({...newRecord, notes: e.target.value})}
                ></textarea>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setShowAddRecordModal(false)}
                className="flex-1 px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveRecord}
                className="flex-1 px-5 py-3 rounded-xl font-bold text-white bg-lifelink-primary hover:bg-green-600 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transform hover:-translate-y-0.5 transition-all"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;