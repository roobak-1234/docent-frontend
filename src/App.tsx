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
import LiveCameraDashboard from './components/LiveCameraDashboard';
import NurseDashboard from './components/NurseDashboard';
import StaffDashboard from './components/StaffDashboard';
import HospitalManagement from './components/HospitalManagement';
import D2DChat from './components/D2DChat';
import { authService } from './services/AuthService';



function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<'landing' | 'signup' | 'signin' | 'forgot-password' | 'rpm' | 'map' | 'chat' | 'ambulance' | 'hospital-registration' | 'cameras' | 'd2d-chat' | 'hospital-management'>('landing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    const path = location.pathname.slice(1) || 'landing';
    setCurrentView(path as typeof currentView);
  }, [location.pathname]);

  const navigateTo = (view: typeof currentView) => {
    setCurrentView(view);
    navigate(`/${view === 'landing' ? '' : view}`);
  };

  const handleAuthSuccess = () => {
    const user = authService.getCurrentUser();
    console.log('Auth success - Current user:', user);
    navigateTo('rpm');
  };

  const handleSignout = () => {
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

  const currentUser = authService.getCurrentUser();



  return (
    <div className="App">

      {currentView !== 'signup' && currentView !== 'signin' && currentView !== 'forgot-password' && (
        <Header
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
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

      {currentView === 'd2d-chat' && (
        <D2DChat onBack={() => navigateTo('rpm')} />
      )}

      {(currentView === 'rpm' || currentView === 'hospital-management' || currentView === 'cameras') && currentUser?.userType === 'doctor' && (
        <Layout>
          <div className="mb-6 flex gap-2 p-1.5 bg-white w-fit rounded-xl border border-slate-100 shadow-sm">
            <button onClick={() => navigateTo('rpm')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${currentView === 'rpm' ? 'bg-lifelink-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>My Patients</button>
            <button onClick={() => navigateTo('hospital-management')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${currentView === 'hospital-management' ? 'bg-lifelink-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>Hospital Management</button>
            <button onClick={() => navigateTo('cameras')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${currentView === 'cameras' ? 'bg-lifelink-primary text-white shadow-md shadow-green-500/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>Live Monitor</button>
          </div>

          {currentView === 'rpm' && (
            !selectedPatientId ? (
              <DoctorDashboard
                onPatientSelect={handlePatientSelect}
                onCameraView={handleCameraView}
                onHospitalManagement={handleHospitalManagement}
                onRegisterHospital={() => navigateTo('hospital-registration')}
              />
            ) : (
              <RPMPatientDashboard 
                patientId={selectedPatientId} 
                onBack={() => setSelectedPatientId(null)}
              />
            )
          )}

          {currentView === 'hospital-management' && (
            <div className="-mt-8 -mx-4 pb-8">
              <HospitalManagement onBack={() => navigateTo('rpm')} onRegister={() => navigateTo('hospital-registration')} />
            </div>
          )}

          {currentView === 'cameras' && (
            <div className="-mt-8 -mx-4 pb-8">
              <LiveCameraDashboard onBack={() => navigateTo('rpm')} />
            </div>
          )}
        </Layout>
      )}

      {/* Patient Dashboard - No Sidebar */}
      {currentView === 'rpm' && currentUser?.userType === 'patient' && (
        <div className="min-h-screen bg-lifelink-bg pt-20 p-6">
          <PatientDashboard />
        </div>
      )}

      {/* Ambulance Staff Dashboard - No Sidebar */}
      {currentView === 'rpm' && currentUser?.userType === 'staff' && currentUser?.staffType === 'Ambulance Staff' && (
        <AmbulanceDashboard />
      )}

      {/* Staff Dashboard - No Sidebar */}
      {currentView === 'rpm' && currentUser?.userType === 'staff' && currentUser?.staffType !== 'Ambulance Staff' && currentUser?.staffType !== 'Nurse' && (
        <div className="min-h-screen bg-lifelink-bg pt-20 p-6">
          <StaffDashboard />
        </div>
      )}

      {/* Nurse Dashboard - No Navigation Tabs or Sidebar */}
      {currentView === 'rpm' && (currentUser?.userType === 'nurse' || (currentUser?.userType === 'staff' && currentUser?.staffType === 'Nurse')) && (
        <div className="min-h-screen bg-lifelink-bg pt-20 p-6">
          <NurseDashboard />
        </div>
      )}



      {currentView !== 'signup' && currentView !== 'signin' && currentView !== 'ambulance' && currentView !== 'forgot-password' && currentView !== 'hospital-registration' && currentView !== 'cameras' && currentView !== 'd2d-chat' && currentView !== 'hospital-management' && <Footer />}
    </div>
  );
}

export default App;