import React, { useState, useEffect } from 'react';
import { User, Heart, Eye, Copy, Check, Trash2, Building2, MessageSquare, Plus, Settings, Save, X, AlertTriangle } from 'lucide-react';
import { authService } from '../services/AuthService';

interface Patient {
  id: string;
  username: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface DoctorDashboardProps {
  onPatientSelect: (patientId: string) => void;
  onHospitalManagement?: () => void;
  onRegisterHospital?: () => void;
  onD2DChat?: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onPatientSelect, onHospitalManagement, onRegisterHospital, onD2DChat }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    specialization: currentUser?.specialization || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  useEffect(() => {
    const user = authService.getCurrentUser();
    console.log('Current user in DoctorDashboard:', user);
    setCurrentUser(user);

    const loadPatients = async () => {
      if (user?.uniqueDoctorId) {
        const doctorPatients = await authService.getPatientsByDoctorId(user.uniqueDoctorId);
        setPatients(doctorPatients as Patient[]);
      }
    };

    loadPatients();

    // Refresh patients list if users data changed
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'docent_users' && user?.uniqueDoctorId) {
        authService.loadUsers(); // Reload latest data from storage
        const doctorPatients = await authService.getPatientsByDoctorId(user.uniqueDoctorId);
        setPatients(doctorPatients as Patient[]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const copyDoctorId = () => {
    if (currentUser?.uniqueDoctorId) {
      navigator.clipboard.writeText(currentUser.uniqueDoctorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!currentUser || currentUser.userType !== 'doctor') {
    return <div className="p-8 text-center text-red-500 font-bold">Access denied. Doctor account required.</div>;
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      const result = await authService.updateProfile(currentUser.id, profileFormData);
      if (result.success && result.user) {
        setSaveMessage('Profile successfully synchronized with Docent Cloud.');
        setCurrentUser(result.user); // Update local state to trigger re-render
        setTimeout(() => {
          setIsEditingProfile(false);
          setSaveMessage('');
        }, 2000);
      } else {
        setSaveMessage(result.message);
      }
    } catch (err) {
      setSaveMessage('Neural sync failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Doctor Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-docent-text">Dr. {currentUser.username}</h2>
            <p className="text-gray-600 text-sm flex items-center gap-2">
              <span className="bg-docent-primary/10 text-docent-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">{currentUser.specialization || 'General Practice'}</span>
              <span>{currentUser.email}</span>
            </p>
          </div>
          <div className="w-full sm:w-auto text-left sm:text-right bg-docent-card/30 p-3 sm:p-0 rounded-lg sm:bg-transparent">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Your Unique Doctor ID</p>
            <div className="flex items-center gap-2 mb-1 sm:justify-end">
              <code className="bg-docent-card px-3 py-1.5 rounded-lg text-docent-primary font-mono font-bold text-sm border border-docent-primary/10 shadow-sm">
                {currentUser.uniqueDoctorId || 'ID not generated'}
              </code>
              <button
                onClick={copyDoctorId}
                className="p-2 hover:bg-white rounded-full shadow-sm border border-gray-100 transition-all active:scale-90"
                title="Copy Doctor ID"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Patients use this ID to link their accounts</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {onRegisterHospital && (
          <button
            onClick={onRegisterHospital}
            className="flex flex-col items-center justify-center gap-3 p-4 sm:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-docent-primary transition-all group text-center"
          >
            <div className="bg-docent-primary/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <Building2 className="h-6 w-6 text-docent-primary" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Register Hospital</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter mt-1">Onboard Facility</p>
            </div>
          </button>
        )}

        {onHospitalManagement && (
          <button
            onClick={onHospitalManagement}
            className="flex flex-col items-center justify-center gap-3 p-4 sm:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-500 transition-all group text-center"
          >
            <div className="bg-blue-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Management</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter mt-1">Staff & Assets</p>
            </div>
          </button>
        )}


        {onD2DChat && (
          <button
            onClick={onD2DChat}
            className="flex flex-col items-center justify-center gap-3 p-4 sm:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-green-500 transition-all group text-center"
          >
            <div className="bg-green-50 p-3 rounded-xl group-hover:scale-110 transition-transform relative">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Secured Chat</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter mt-1">Consultation</p>
            </div>
          </button>
        )}

        <button
          onClick={() => {
            setProfileFormData({
              username: currentUser.username,
              email: currentUser.email,
              phone: currentUser.phone || '',
              specialization: currentUser.specialization || ''
            });
            setIsEditingProfile(true);
          }}
          className="flex flex-col items-center justify-center gap-3 p-4 sm:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-800 transition-all group text-center"
        >
          <div className="bg-slate-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <Settings className="h-6 w-6 text-slate-700" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Profile Settings</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter mt-1">Manage Account</p>
          </div>
        </button>
      </div>

      {/* Profile Edit Overlay */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
              <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Settings className="h-5 w-5 text-docent-primary" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight">Profile Credentials</h3>
                 </div>
                 <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                    <X className="h-5 w-5" />
                 </button>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
                 {saveMessage && (
                   <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${saveMessage.includes('synchronize') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {saveMessage.includes('synchronize') ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      {saveMessage}
                   </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                       <input 
                         type="text" 
                         value={profileFormData.username}
                         onChange={(e) => setProfileFormData({...profileFormData, username: e.target.value})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-sm font-bold"
                         required
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                       <input 
                         type="tel" 
                         value={profileFormData.phone}
                         onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-sm font-bold"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={profileFormData.email}
                      onChange={(e) => setProfileFormData({...profileFormData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-sm font-bold"
                      required
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medical Specialization</label>
                    <input 
                      type="text" 
                      value={profileFormData.specialization}
                      onChange={(e) => setProfileFormData({...profileFormData, specialization: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-sm font-bold"
                      placeholder="e.g. Cardiology, Neurosurgery"
                    />
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-4 px-6 border border-slate-200 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Discard
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-4 px-6 bg-docent-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-green-500/20 hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isSaving ? 'Processing...' : (
                        <>
                          <Save className="h-4 w-4" />
                          Update Profile
                        </>
                      )}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Patients List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="h-10 w-1 pt-1 bg-docent-primary rounded-full"></div>
             <h3 className="text-xl font-black text-slate-800 tracking-tight">My Patients</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-docent-primary/10 px-3 py-1 rounded-full">
              <span className="text-docent-primary font-semibold">{patients.length} Patients</span>
            </div>
          </div>
        </div>

        {patients.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">No Patients Yet</h4>
            <p className="text-gray-400 mb-4">
              Share your Doctor ID with patients so they can register under your care.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> When patients sign up, they can enter your Doctor ID
                to automatically link their account to yours for remote monitoring.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-docent-primary hover:shadow-md transition-all cursor-pointer"
                onClick={() => onPatientSelect(patient.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-docent-primary/10 p-2 rounded-full">
                      <User className="h-4 w-4 text-docent-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-docent-text">{patient.username}</h4>
                      <p className="text-xs text-gray-500">Patient ID: {patient.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="View Patient Details">
                      <Eye className="h-4 w-4 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to remove patient ${patient.username}? This will permanently delete their account.`)) {
                          authService.deleteUser(patient.id);
                          setPatients(patients.filter(p => p.id !== patient.id));
                        }
                      }}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                      title="Remove Patient"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <p>{patient.email}</p>
                  {patient.phone && <p>{patient.phone}</p>}
                  <p className="text-xs text-gray-400">
                    Registered: {new Date(patient.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">Active Monitoring</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPatientSelect(patient.id);
                      }}
                      className="text-xs bg-docent-primary text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      View RPM
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;