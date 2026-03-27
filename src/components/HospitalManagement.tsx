import React, { useState, useEffect } from 'react';
import { Building2, Users, ArrowLeft, User, Mail, Phone, UserCheck, Truck, Trash2, Camera, Calendar } from 'lucide-react';
import { authService } from '../services/AuthService';
import { hospitalService } from '../services/hospitalService';
import LiveCameraDashboard from './LiveCameraDashboard';
import LeaveManagement from './LeaveManagement';
import AppointmentManagement from './AppointmentManagement';

interface HospitalManagementProps {
  onBack: () => void;
  onRegister?: () => void;
}

const HospitalManagement: React.FC<HospitalManagementProps> = ({ onBack, onRegister }) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [hospitalStaff, setHospitalStaff] = useState<any[]>([]);
  const [doctorPatients, setDoctorPatients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'staff' | 'monitor' | 'leaves' | 'appointments'>('staff');

  useEffect(() => {
    const fetchData = async () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        // Fetch hospital info from backend
        const hospitalResult = await hospitalService.getHospitalByAdmin(user.username);
        let doctorHospital = hospitalResult.data;

        if (doctorHospital) {
          setHospitalInfo(doctorHospital);

          const refreshData = async () => {
            // Find all staff registered under this hospital
            const staff = await authService.getHospitalStaff(doctorHospital.uniqueHospitalId);
            setHospitalStaff(staff);

            // Get real patients under this doctor
            if (user.uniqueDoctorId) {
              const patients = await authService.getPatientsByDoctorId(user.uniqueDoctorId);
              setDoctorPatients(patients);
            }

            // Find ambulance staff and add their vehicles to hospital ambulance list
            const ambulanceStaff = staff.filter((s: any) =>
              s.userType === 'staff' && s.staffType === 'Ambulance Staff' && s.vehicleNumber
            );

            if (ambulanceStaff.length > 0) {
              const staffVehicles = ambulanceStaff.map((s: any) => {
                const vehicleId = s.vehicleNumber.includes('-') ? s.vehicleNumber : `AMB-${s.vehicleNumber}`;
                return {
                  id: vehicleId,
                  registration: s.vehicleNumber,
                  staffName: s.username,
                  staffId: s.id,
                  type: 'staff',
                  isOnline: s.isOnline
                };
              });

              const existingAmbulances = (doctorHospital.ambulanceIds || []).map((id: string) => ({
                id: id,
                registration: id,
                type: 'hospital'
              }));

              doctorHospital.ambulanceIds = [...existingAmbulances, ...staffVehicles];
              setHospitalInfo({ ...doctorHospital });
            }
          };

          await refreshData();

          const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'docent_users') {
              refreshData();
            }
          };

          window.addEventListener('storage', handleStorageChange);
          return () => window.removeEventListener('storage', handleStorageChange);
        }
      }
    };

    fetchData();
  }, []);

  if (!currentUser || currentUser.userType !== 'doctor') {
    return <div>Access denied. Doctor account required.</div>;
  }

  if (!hospitalInfo) {
    return (
      <div className="min-h-screen bg-docent-bg pt-20">
        <div className="w-full px-4 py-8">
          <button
            onClick={onBack}
            className="flex items-center text-docent-text hover:text-docent-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <Building2 className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Hospital Registered</h3>
        <p className="text-yellow-700 mb-6">You need to register a hospital first to access management features.</p>
        {onRegister && (
          <button
            onClick={onRegister}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Building2 className="h-4 w-4" />
            Register Hospital Now
          </button>
        )}
      </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-docent-bg pt-20">
      <div className="w-full px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center text-docent-text hover:text-docent-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        {/* Hospital Hub Navigation */}
        <div className="flex bg-white p-1.5 gap-2 rounded-2xl border border-slate-100 shadow-sm mb-6 w-full sm:w-fit overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all whitespace-nowrap ${activeTab === 'staff' ? 'bg-docent-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Users className="h-4 w-4" />
            Staff & Assets
          </button>
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all whitespace-nowrap ${activeTab === 'monitor' ? 'bg-docent-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Camera className="h-4 w-4" />
            Live Monitor
          </button>
          <button 
            onClick={() => setActiveTab('leaves')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all whitespace-nowrap ${activeTab === 'leaves' ? 'bg-docent-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Calendar className="h-4 w-4" />
            Leave Hub
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all whitespace-nowrap ${activeTab === 'appointments' ? 'bg-docent-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <UserCheck className="h-4 w-4" />
            Appointments
          </button>
        </div>

        {activeTab === 'staff' && (
          <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-purple-600/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-docent-text">{hospitalInfo.name}</h2>
                  <p className="text-gray-600">{hospitalInfo.type} Hospital</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Hospital ID</p>
                  <code className="text-sm font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    {hospitalInfo.uniqueHospitalId || 'ID not found'}
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-docent-primary">{hospitalInfo.icuBeds || 0}</p>
              <p className="text-sm text-gray-600">ICU Beds</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-docent-secondary">{hospitalInfo.hduBeds || 0}</p>
              <p className="text-sm text-gray-600">HDU Beds</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-500">{hospitalInfo.ventilators || 0}</p>
              <p className="text-sm text-gray-600">Ventilators</p>
            </div>
          </div>
        </div>

        {/* Hospital Staff */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-docent-text flex items-center gap-2">
              <Users className="h-5 w-5 text-docent-primary" />
              Hospital Staff
            </h3>
            <div className="bg-docent-primary/10 px-3 py-1 rounded-full">
              <span className="text-docent-primary font-semibold">{hospitalStaff.length} Staff Members</span>
            </div>
          </div>

          {hospitalStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-500 mb-2">No Staff Registered</h4>
              <p className="text-gray-400 mb-4">
                Share your Hospital ID with staff members so they can register under your hospital.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Hospital ID:</strong> {hospitalInfo.uniqueHospitalId || 'ID not found'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Staff should use this ID during registration to join your hospital.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hospitalStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={`border rounded-lg p-4 transition-all ${staff.isOnline
                    ? 'border-green-200 bg-green-50/30 hover:shadow-green-100 hover:border-green-300'
                    : 'border-gray-200 hover:border-docent-primary'
                    } hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${staff.isOnline ? 'bg-green-100' : 'bg-docent-primary/10'
                        }`}>
                        {staff.userType === 'nurse' ? (
                          <UserCheck className={`h-4 w-4 ${staff.isOnline ? 'text-green-600' : 'text-docent-primary'}`} />
                        ) : (
                          <User className={`h-4 w-4 ${staff.isOnline ? 'text-green-600' : 'text-docent-primary'}`} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-docent-text flex items-center gap-2">
                          {staff.username}
                          {staff.isOnline && (
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online"></span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {staff.userType === 'nurse' ? 'Nurse' : staff.staffType || 'Staff'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${staff.userType === 'nurse'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-indigo-100 text-indigo-700'
                        }`}>
                        {staff.userType === 'nurse' ? 'Nurse' : 'Staff'}
                      </span>
                      {staff.shift && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide border border-amber-200">
                          {staff.shift} Shift
                        </span>
                      )}
                      {staff.isOnline && (
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">
                          Online
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${staff.username} from the hospital staff?`)) {
                            // Actually delete the user from authService
                            authService.deleteUser(staff.id);
                            // Also update local state
                            setHospitalStaff(prev => prev.filter(s => s.id !== staff.id));
                          }
                        }}
                        className="mt-2 text-red-500 hover:text-red-700 focus:outline-none transition-colors"
                        title="Remove Staff Member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {staff.isOnline ? (
                        <span className="text-green-600 font-medium">Currently Active</span>
                      ) : (
                        `Joined: ${new Date(staff.createdAt).toLocaleDateString()}`
                      )}
                    </p>
                  </div>

                  {/* Staff Permissions & Patient Assignment */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    {staff.userType === 'nurse' && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Permissions</span>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={staff.permissions?.canAccessPatientData || false}
                            onChange={(e) => {
                              const updatedStaff = hospitalStaff.map(s => 
                                s.id === staff.id 
                                  ? { ...s, permissions: { ...s.permissions, canAccessPatientData: e.target.checked } }
                                  : s
                              );
                              setHospitalStaff(updatedStaff);
                              
                              // Update localStorage
                              const allUsers = JSON.parse(localStorage.getItem('docent_users') || '[]');
                              const updatedUsers = allUsers.map((u: any) => 
                                u.id === staff.id 
                                  ? { ...u, permissions: { ...u.permissions, canAccessPatientData: e.target.checked } }
                                  : u
                              );
                              localStorage.setItem('docent_users', JSON.stringify(updatedUsers));
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-xs text-gray-600">Patient Data Access</span>
                        </label>
                      </div>
                    )}
                    
                    {staff.userType === 'nurse' && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-gray-700">Assigned Patients</span>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {doctorPatients.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">No patients available</p>
                          ) : (
                            doctorPatients.map((patient) => (
                              <label key={patient.id} className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={(staff.assignedPatientIds || []).includes(patient.id)}
                                  onChange={(e) => {
                                    const currentPatients = staff.assignedPatientIds || [];
                                    const updatedPatients = e.target.checked
                                      ? [...currentPatients, patient.id]
                                      : currentPatients.filter((id: string) => id !== patient.id);
                                    
                                    const updatedStaff = hospitalStaff.map(s => 
                                      s.id === staff.id 
                                        ? { ...s, assignedPatientIds: updatedPatients }
                                        : s
                                    );
                                    setHospitalStaff(updatedStaff);
                                    
                                    // Update localStorage
                                    const allUsers = JSON.parse(localStorage.getItem('docent_users') || '[]');
                                    const updatedUsers = allUsers.map((u: any) => 
                                      u.id === staff.id 
                                        ? { ...u, assignedPatientIds: updatedPatients }
                                        : u
                                    );
                                    localStorage.setItem('docent_users', JSON.stringify(updatedUsers));
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-gray-700">{patient.username}</span>
                              </label>
                            ))
                          )}
                        </div>
                        {(staff.assignedPatientIds || []).length > 0 && (
                          <p className="text-xs text-green-600 font-medium">
                            {(staff.assignedPatientIds || []).length} patient(s) assigned
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ambulance Fleet */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-docent-text flex items-center gap-2">
              <Truck className="h-5 w-5 text-red-600" />
              Ambulance Fleet
            </h3>
            <div className="bg-red-600/10 px-3 py-1 rounded-full">
              <span className="text-red-600 font-semibold">{hospitalInfo.ambulanceIds?.length || 0} Vehicles</span>
            </div>
          </div>

          {!hospitalInfo.ambulanceIds || hospitalInfo.ambulanceIds.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-500 mb-2">No Ambulances Registered</h4>
              <p className="text-gray-400">
                No ambulance fleet has been registered for this hospital.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hospitalInfo.ambulanceIds.map((ambulance: any, index: number) => {
                const isActive = ambulance.isOnline || (ambulance.type === 'staff' && ambulance.isOnline);

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${isActive
                      ? 'border-green-200 bg-green-50/50 hover:border-green-300 hover:shadow-green-100'
                      : 'border-red-200 bg-red-50/50 hover:border-red-300 hover:shadow-red-100'
                      } hover:shadow-md`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-full ${isActive ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        <Truck className={`h-6 w-6 ${isActive ? 'text-green-600' : 'text-red-600'
                          }`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{ambulance.id || ambulance}</h4>
                        <p className={`text-xs font-semibold ${isActive ? 'text-green-700' : 'text-red-700'
                          }`}>
                          {isActive ? (
                            <span className="flex items-center gap-1">
                              ● Active • Driver: {ambulance.staffName}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              ○ Offline • Unassigned
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isActive
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                        }`}>
                        {isActive ? 'In Service' : 'Offline'}
                      </span>
                      {isActive && (
                        <button className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm">
                          Track Live
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="-mt-20 animate-in fade-in duration-500">
            <LiveCameraDashboard onBack={() => setActiveTab('staff')} />
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="-mt-8 animate-in fade-in duration-500">
            <LeaveManagement />
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="-mt-8 animate-in fade-in duration-500">
            <AppointmentManagement hospitalId={hospitalInfo.uniqueHospitalId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalManagement;