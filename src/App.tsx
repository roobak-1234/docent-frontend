import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import RPMPatientDashboard from './components/RPMPatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';

import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPageNew';
import SigninPage from './components/SigninPage';
import ForgotPassword from './components/ForgotPassword';
import AmbulanceDashboard from './components/AmbulanceDashboard';
import HospitalRegistration from './components/HospitalRegistration';
import NurseDashboard from './components/NurseDashboard';
import StaffDashboard from './components/StaffDashboard';
import HospitalManagement from './components/HospitalManagement';
import D2DChat from './components/D2DChat';
import LeaveManagement from './components/LeaveManagement';
import { authService } from './services/AuthService';

type AppView =
  | 'landing'
  | 'signup'
  | 'signin'
  | 'forgot-password'
  | 'rpm'
  | 'map'
  | 'chat'
  | 'ambulance'
  | 'hospital-registration'
  | 'cameras'
  | 'd2d-chat'
  | 'hospital-management'
  | 'hospital-appointments'
  | 'leave-management';

const allowedViews = new Set<AppView>([
  'landing',
  'signup',
  'signin',
  'forgot-password',
  'rpm',
  'map',
  'chat',
  'ambulance',
  'hospital-registration',
  'cameras',
  'd2d-chat',
  'hospital-management',
  'hospital-appointments',
  'leave-management'
]);

const protectedRoutes = new Set<AppView>([
  'rpm',
  'hospital-management',
  'cameras',
  'd2d-chat',
  'ambulance',
  'hospital-registration',
  'hospital-appointments',
  'leave-management'
]);

function pathToView(pathname: string): AppView {
  const path = pathname.replace(/^\//, '') || 'landing';
  return allowedViews.has(path as AppView) ? (path as AppView) : 'landing';
}



function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const currentView = pathToView(location.pathname);

  const navigateTo = React.useCallback((view: AppView) => {
    navigate(`/${view === 'landing' ? '' : view}`);
  }, [navigate]);

  useEffect(() => {
    // Synchronize auth state
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, [location.pathname]);

  useEffect(() => {
    if (currentView !== pathToView(location.pathname)) {
      return;
    }

    if (currentView === 'landing' && location.pathname !== '/' && location.pathname !== '') {
      navigate('/', { replace: true });
      return;
    }

    if (protectedRoutes.has(currentView) && !currentUser) {
      console.log('Unauthorized access - Redirecting to landing');
      navigate('/', { replace: true });
      return;
    }
  }, [currentView, currentUser, location.pathname, navigate]);

  const handleAuthSuccess = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    navigateTo('rpm');
  };

  const handleSignout = () => {
    authService.signout();
    setCurrentUser(null);
    navigateTo('landing');
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    navigateTo('rpm');
  };

  const handleCameraView = () => {
    navigateTo('cameras');
  };

  // const handleAmbulanceView = () => {
  //   navigateTo('ambulance');
  // };

  const handleHospitalManagement = () => {
    navigateTo('hospital-management');
  };




  return (
    <div className="App">

      {currentView !== 'signup' && currentView !== 'signin' && currentView !== 'forgot-password' && (
        <Header
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          currentUser={currentUser}
          onSignup={() => navigateTo('signup')}
          onSignin={() => navigateTo('signin')}
          onSignout={handleSignout}
        />
      )}

      {currentView === 'landing' && (
        <LandingPage
          onSignup={() => navigateTo('signup')}
          onSignin={() => navigateTo('signin')}
        />
      )}

      {currentView === 'signup' && (
        <SignupPage
          onBack={() => navigateTo('landing')}
          onSuccess={handleAuthSuccess}
          navigateTo={navigateTo}
        />
      )}

      {currentView === 'signin' && (
        <SigninPage
          onBack={() => navigateTo('landing')}
          onSuccess={handleAuthSuccess}
          onForgotPassword={() => navigateTo('forgot-password')}
          onSignup={() => navigateTo('signup')}
        />
      )}

      {currentView === 'forgot-password' && (
        <ForgotPassword
          onBack={() => navigateTo('signin')}
        />
      )}

      {currentView === 'ambulance' && (
        currentUser?.userType === 'staff' && currentUser?.staffType === 'Ambulance Staff' ? (
          <AmbulanceDashboard onBack={() => navigateTo('rpm')} />
        ) : (
          <AmbulanceDashboard onBack={() => navigateTo('hospital-management')} />
        )
      )}

      {currentView === 'hospital-registration' && (
        <HospitalRegistration
          onBack={() => navigateTo('rpm')}
        />
      )}

      {/* View Logic */}

      {(currentView === 'rpm' || currentView === 'hospital-management' || currentView === 'hospital-appointments' || currentView === 'cameras' || currentView === 'd2d-chat' || currentView === 'leave-management') && currentUser?.userType === 'doctor' && (
        <Layout>
          <div className={`${currentView === 'hospital-management' || currentView === 'hospital-appointments' ? 'mb-2' : 'mb-10'} flex flex-wrap gap-2 p-1.5 bg-white w-full sm:w-fit rounded-xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar`}>
            <button onClick={() => navigateTo('rpm')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${currentView === 'rpm' ? 'bg-lifelink-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>My Patients</button>
            <button onClick={() => navigateTo('hospital-management')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${currentView === 'hospital-management' ? 'bg-lifelink-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>Hospitals</button>
            <button onClick={() => navigateTo('hospital-appointments')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${currentView === 'hospital-appointments' ? 'bg-lifelink-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>Appointments</button>
            <button onClick={() => navigateTo('leave-management')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${currentView === 'leave-management' ? 'bg-lifelink-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>Leave Management</button>
            <button onClick={() => navigateTo('d2d-chat')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${currentView === 'd2d-chat' ? 'bg-lifelink-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>Secured Chat</button>
          </div>

          {currentView === 'rpm' && (
            !selectedPatientId ? (
              <DoctorDashboard
                onPatientSelect={handlePatientSelect}
                onCameraView={handleCameraView}
                onHospitalManagement={handleHospitalManagement}
                onRegisterHospital={() => navigateTo('hospital-registration')}
                onD2DChat={() => navigateTo('d2d-chat')}
              />
            ) : (
              <RPMPatientDashboard 
                patientId={selectedPatientId} 
                onBack={() => setSelectedPatientId(null)}
              />
            )
          )}

          {(currentView === 'hospital-management' || currentView === 'hospital-appointments') && (
            <div className="-mx-4 pb-8">
              <HospitalManagement
                onBack={() => navigateTo('rpm')}
                onRegister={() => navigateTo('hospital-registration')}
                initialTab={currentView === 'hospital-appointments' ? 'appointments' : 'staff'}
              />
            </div>
          )}


          {currentView === 'd2d-chat' && (
            <div className="-mt-8 -mx-4 pb-8 h-[calc(100vh-140px)]">
              <D2DChat onBack={() => navigateTo('rpm')} />
            </div>
          )}

          {currentView === 'leave-management' && (
            <div className="-mt-8 -mx-4 pb-8">
              <LeaveManagement />
            </div>
          )}
        </Layout>
      )}

      {/* Hospital Admin Dashboard */}
      {(currentView === 'rpm' || currentView === 'hospital-management' || currentView === 'hospital-appointments' || currentView === 'leave-management') && currentUser?.userType === 'hospitalAdmin' && (
        <div className="min-h-screen bg-lifelink-bg">
          {currentView === 'leave-management' ? (
            <div className="pt-20 p-6"><LeaveManagement /></div>
          ) : (
            <HospitalManagement
              onBack={() => navigateTo('rpm')}
              onRegister={() => navigateTo('hospital-registration')}
              initialTab={currentView === 'hospital-appointments' ? 'appointments' : 'staff'}
            />
          )}
        </div>
      )}

      {/* Patient Dashboard - No Sidebar */}
      {currentView === 'rpm' && currentUser?.userType === 'patient' && (
        <div className="min-h-screen bg-lifelink-bg pt-20 p-6">
          <PatientDashboard />
        </div>
      )}

      {/* Ambulance Staff Dashboard - No Sidebar */}
      {(currentView === 'rpm' || currentView === 'leave-management') && currentUser?.userType === 'staff' && currentUser?.staffType === 'Ambulance Staff' && (
        currentView === 'leave-management' ? (
          <div className="min-h-screen bg-lifelink-bg pt-20 p-6">
            <LeaveManagement />
          </div>
        ) : (
          <AmbulanceDashboard onLeaveManagement={() => navigateTo('leave-management')} />
        )
      )}

      {/* Staff Dashboard - No Sidebar */}
      {(currentView === 'rpm' || currentView === 'leave-management') && currentUser?.userType === 'staff' && currentUser?.staffType !== 'Ambulance Staff' && currentUser?.staffType !== 'Nurse' && (
        <div className="min-h-screen bg-lifelink-bg pt-20 p-6">
          {currentView === 'leave-management' ? (
            <LeaveManagement />
          ) : (
            <StaffDashboard onLeaveManagement={() => navigateTo('leave-management')} />
          )}
        </div>
      )}

      {/* Nurse Dashboard - No Navigation Tabs or Sidebar */}
      {(currentView === 'rpm' || currentView === 'leave-management') && (currentUser?.userType === 'nurse' || (currentUser?.userType === 'staff' && currentUser?.staffType === 'Nurse')) && (
        <div className="min-h-screen bg-lifelink-bg pt-20 p-6">
          {currentView === 'leave-management' ? (
            <LeaveManagement />
          ) : (
            <NurseDashboard onLeaveManagement={() => navigateTo('leave-management')} />
          )}
        </div>
      )}



      {currentView !== 'signup' && currentView !== 'signin' && currentView !== 'ambulance' && currentView !== 'forgot-password' && currentView !== 'hospital-registration' && currentView !== 'cameras' && currentView !== 'd2d-chat' && currentView !== 'hospital-management' && currentView !== 'leave-management' && <Footer />}
    </div>
  );
}

export default App;