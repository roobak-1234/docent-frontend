import React, { useState, useEffect } from 'react';
import { User, Building2, Phone, Mail, MapPin, Stethoscope, Users, MessageSquare } from 'lucide-react';
import { authService } from '../services/AuthService';

const NurseDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);



  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    if (user?.doctorId) {
      // Find hospital by unique hospital ID (since nurses register with hospital ID)
      const hospitals = JSON.parse(localStorage.getItem('registered_hospitals') || '[]');
      const hospital = hospitals.find((h: any) => h.uniqueHospitalId === user.doctorId);
      setHospitalInfo(hospital);

      if (hospital) {
        // Find doctor who registered this hospital
        const allUsers = JSON.parse(localStorage.getItem('docent_users') || '[]');
        const doctor = allUsers.find((u: any) => u.username === hospital.adminContact);
        setDoctorInfo(doctor);

        // Get assigned patients based on nurse's assignedPatientIds
        if ((user as any).assignedPatientIds && (user as any).assignedPatientIds.length > 0) {
          // Find the real patients from all users
          const allUsers = JSON.parse(localStorage.getItem('docent_users') || '[]');
          const assignedPatients = allUsers.filter((u: any) => 
            (user as any).assignedPatientIds!.includes(u.id) && u.userType === 'patient'
          );
          
          const patientsWithVitals = assignedPatients.map((patient: any) => ({
            id: patient.id,
            name: patient.username,
            condition: 'Under monitoring',
            room: `Room ${Math.floor(Math.random() * 300) + 100}`,
            vitals: {
              heartRate: Math.floor(Math.random() * 40) + 60,
              bloodPressure: `${Math.floor(Math.random() * 40) + 110}/${Math.floor(Math.random() * 20) + 70}`,
              spO2: Math.floor(Math.random() * 6) + 94,
              temperature: (Math.random() * 2 + 98).toFixed(1),
              lastUpdated: new Date().toLocaleTimeString()
            }
          }));
          
          setAssignedPatients(patientsWithVitals);
        } else {
          setAssignedPatients([]);
        }
      }
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
          <div>
            <h2 className="text-xl font-semibold text-lifelink-text">
              {currentUser.userType === 'nurse' ? 'Nurse' : 
               (currentUser.userType === 'staff' && (currentUser as any).staffType === 'Nurse') ? 'Nurse' : 'Staff'} {currentUser.username}
            </h2>
            <p className="text-gray-600">{currentUser.email}</p>
            {currentUser.phone && <p className="text-gray-600">{currentUser.phone}</p>}
          </div>
        </div>
      </div>

      {/* Doctor Information */}
      {doctorInfo ? (
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
      ) : hospitalInfo ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Hospital Administrator Not Found</h3>
          <p className="text-blue-700">
            The administrator for this hospital could not be found in the system.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Hospital Not Found</h3>
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
                If this ID is incorrect (e.g., if you generated a new ID as a doctor), you may need to create a new account with the correct ID.
              </p>
              <button
                onClick={() => {
                  authService.signout();
                  window.location.href = '/'; // Force full reload to clear states
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Sign Out & Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Information */}
      {hospitalInfo ? (
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

          {/* Assigned Patients Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-lifelink-text flex items-center gap-2">
                <Users className="h-5 w-5 text-lifelink-primary" />
                Assigned Patients
              </h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                <MessageSquare className="h-4 w-4" />
                Team Chat
              </button>
            </div>

            {assignedPatients.length === 0 ? (
              <p className="text-gray-500 italic">No patients assigned yet. Contact your supervising doctor for patient assignments.</p>
            ) : (
              <div className="space-y-4">
                {assignedPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-lifelink-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-lifelink-primary/10 p-3 rounded-full">
                          <User className="h-6 w-6 text-lifelink-primary" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-lifelink-text">{patient.name}</h4>
                          <p className="text-sm text-gray-500">ID: {patient.id} • Room {patient.room}</p>
                          <p className="text-sm text-gray-600 mt-1"><strong>Condition:</strong> {patient.condition}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        Active Monitoring
                      </span>
                    </div>

                    {/* RPM Vitals */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-lifelink-primary" />
                          Real-Time Vitals (RPM)
                        </h5>
                        <span className="text-xs text-gray-500">Last updated: {patient.vitals.lastUpdated}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-red-600">{patient.vitals.heartRate}</div>
                          <div className="text-xs text-gray-500">Heart Rate (BPM)</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-blue-600">{patient.vitals.bloodPressure}</div>
                          <div className="text-xs text-gray-500">Blood Pressure</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-green-600">{patient.vitals.spO2}%</div>
                          <div className="text-xs text-gray-500">SpO2</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-orange-600">{patient.vitals.temperature}°F</div>
                          <div className="text-xs text-gray-500">Temperature</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-sm text-green-600 font-medium">Live monitoring active</span>
                        </div>
                        <button className="px-3 py-1 bg-lifelink-primary text-white rounded text-sm hover:bg-lifelink-primary/90 transition-colors">
                          View Full RPM Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : doctorInfo ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">No Hospital Registered</h3>
          <p className="text-blue-700">
            Dr. {doctorInfo.username} has not registered a hospital in the system yet.
          </p>
        </div>
      ) : null}

    </div>
  );
};

export default NurseDashboard;