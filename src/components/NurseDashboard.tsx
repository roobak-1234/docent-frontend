import React, { useState, useEffect } from 'react';
import { User, Building2, Phone, Mail, MapPin, Stethoscope, Users, MessageSquare, Calendar } from 'lucide-react';
import { authService } from '../services/AuthService';
import { hospitalService } from '../services/hospitalService';

interface NurseDashboardProps {
  onLeaveManagement?: () => void;
}

const NurseDashboard: React.FC<NurseDashboardProps> = ({ onLeaveManagement }) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);



  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    const fetchHospitalData = async () => {
      if (user?.doctorId) {
        const response = await hospitalService.getHospitalById(user.doctorId);
        if (response.success) {
          const hospital = response.data;
          setHospitalInfo(hospital);
          
          if (hospital) {
            // Find doctor who registered this hospital (locally or via adminContact if possible)
            // Note: In a full backend system, this would be another API call
            const allUsers = JSON.parse(localStorage.getItem('docent_users') || '[]');
            const doctor = allUsers.find((u: any) => u.username === hospital.adminContact || u.uniqueDoctorId === hospital.adminContact);
            setDoctorInfo(doctor);
          }
        }
      }
    };

    fetchHospitalData();

    // Get assigned patients based on nurse's assignedPatientIds
    if ((user as any)?.assignedPatientIds && (user as any).assignedPatientIds.length > 0) {
      // Find the real patients from all users
      const allUsers = JSON.parse(localStorage.getItem('docent_users') || '[]');
      const assignedPatients = allUsers.filter((u: any) => 
        (user as any).assignedPatientIds!.includes(u.id) && u.userType === 'patient'
      );
      
      const patientsWithVitals = assignedPatients.map((patient: any) => ({
        id: patient.id,
        name: patient.username,
        condition: patient.condition || 'General Ward',
        room: patient.room || 'TBD',
        vitals: patient.vitals || {
          heartRate: '--',
          bloodPressure: '--/--',
          spO2: '--',
          temperature: '--',
          lastUpdated: 'No data'
        }
      }));
      
      setAssignedPatients(patientsWithVitals);
    } else {
      setAssignedPatients([]);
    }
  }, []);

  if (!currentUser) {
    return (
      <div className="pt-20 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Authentication Required</h3>
          <p className="text-red-700">Please log in to access the nurse dashboard.</p>
        </div>
      </div>
    );
  }

  if (currentUser.userType !== 'nurse' && !(currentUser.userType === 'staff' && (currentUser as any).staffType === 'Nurse')) {
    return (
      <div className="pt-20 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
          <p className="text-red-700">Nurse account or Staff with Nurse type required. Current user type: {currentUser.userType} {(currentUser as any).staffType && `(${(currentUser as any).staffType})`}</p>
          <div className="mt-4 p-4 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800"><strong>Debug Info:</strong></p>
            <p className="text-sm text-red-800">Username: {currentUser.username}</p>
            <p className="text-sm text-red-800">User Type: {currentUser.userType}</p>
            <p className="text-sm text-red-800">Staff Type: {(currentUser as any).staffType || 'N/A'}</p>
            <p className="text-sm text-red-800">User ID: {currentUser.id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 space-y-6">
      {/* Nurse Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-600/10 flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-lifelink-text">
              {currentUser.userType === 'nurse' ? 'Nurse' : 
               (currentUser.userType === 'staff' && (currentUser as any).staffType === 'Nurse') ? 'Nurse' : 'Staff'} {currentUser.username}
            </h2>
            <p className="text-gray-600">{currentUser.email}</p>
            {currentUser.phone && <p className="text-gray-600">{currentUser.phone}</p>}
          </div>
          {onLeaveManagement && (
            <button
              onClick={onLeaveManagement}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all text-sm"
            >
              <Calendar className="h-4 w-4" />
              Apply Leave
            </button>
          )}
        </div>
      </div>

      {/* Doctor Information - Show if available regardless of hospital status */}
      {doctorInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-lifelink-text mb-4 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-lifelink-primary" />
            Supervising Doctor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Doctor Name</p>
                <p className="font-medium">Dr. {doctorInfo.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{doctorInfo.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{doctorInfo.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Doctor ID</p>
                <p className="font-medium font-mono">{doctorInfo.uniqueDoctorId}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Warning - Only if both Doctor and Hospital are missing */}
      {!doctorInfo && !hospitalInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Hospital Connection Not Found</h3>
              <p className="text-yellow-700">
                We could not find a hospital associated with your account's registered Hospital ID.
              </p>
            </div>

            <div className="bg-yellow-100 p-4 rounded-lg space-y-2 text-sm text-yellow-900 border border-yellow-200">
              <p><strong>Debug Info:</strong></p>
              <p>Logged in as: <strong>{currentUser.username}</strong> ({currentUser.userType})</p>
              <p>Registered Hospital ID: <strong>{currentUser.doctorId || 'None'}</strong></p>
            </div>

            <div>
              <p className="text-sm text-yellow-800 mb-2">
                If this ID is incorrect, you may need to update your profile with the correct Hospital ID.
              </p>
              <button
                onClick={() => {
                  authService.signout();
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Sign Out & Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Info Section - Independent */}
      {hospitalInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-lifelink-text mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-lifelink-secondary" />
            Hospital Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Hospital Name</p>
                <p className="font-medium">{hospitalInfo.name}</p>
              </div>
            </div>
            {/* ... remaining hospital fields ... */}
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{hospitalInfo.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Emergency Phone</p>
                <p className="font-medium">{hospitalInfo.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Emergency Email</p>
                <p className="font-medium">{hospitalInfo.emergencyEmail || 'Not provided'}</p>
              </div>
            </div>
            {hospitalInfo.address && (
              <div className="md:col-span-2 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{hospitalInfo.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assigned Patients Section - Persistent */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-lifelink-text flex items-center gap-2">
            <Users className="h-6 w-6 text-lifelink-primary" />
            Assigned Patients
          </h3>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-lifelink-primary hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95 w-full sm:w-auto">
            <MessageSquare className="h-4 w-4" />
            Team Chat
          </button>
        </div>

        {assignedPatients.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 italic">No patients assigned yet. Contact your supervising doctor for patient assignments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {assignedPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-lifelink-primary/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                      <User className="h-6 w-6 text-lifelink-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-lifelink-text">{patient.name}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                        ID: {patient.id} <span className="text-gray-300">•</span> Room {patient.room}
                      </p>
                      <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                         {patient.condition}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100 text-xs font-bold w-fit">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Active Monitoring
                  </div>
                </div>

                {/* RPM Vitals */}
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h5 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Stethoscope className="h-4 w-4 text-lifelink-primary" />
                      Real-Time Vitals
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-50">
                      Last sync: {patient.vitals.lastUpdated}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-50 text-center hover:border-red-100 hover:shadow-red-500/5 transition-all">
                      <div className="text-2xl font-black text-red-600 tabular-nums">{patient.vitals.heartRate}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Heart Rate (BPM)</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-50 text-center hover:border-blue-100 hover:shadow-blue-500/5 transition-all">
                      <div className="text-2xl font-black text-blue-600 tabular-nums font-mono">{patient.vitals.bloodPressure}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Blood Pressure</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-50 text-center hover:border-green-100 hover:shadow-green-500/5 transition-all">
                      <div className="text-2xl font-black text-green-600 tabular-nums">{patient.vitals.spO2}%</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">SpO2</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-50 text-center hover:border-orange-100 hover:shadow-orange-500/5 transition-all">
                      <div className="text-2xl font-black text-orange-600 tabular-nums">{patient.vitals.temperature}°F</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Temperature</div>
                    </div>
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

export default NurseDashboard;