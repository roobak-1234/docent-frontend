import React, { useState, useEffect } from 'react';
import { Activity, Phone, Navigation, CheckCircle, AlertTriangle, WifiOff, ArrowLeft, Thermometer, Droplets, MapPin, Zap, Building, Calendar } from 'lucide-react';
import { useAmbulanceSession } from '../hooks/useAmbulanceSession';
import { useGeolocationStream } from '../hooks/useGeolocationStream';
import { ambulanceSignalRService } from '../services/AmbulanceSignalRService';
import { AzureMap } from './AzureMap';
import VitalsInputForm from './VitalsInputForm';

interface AmbulanceDashboardProps {
  onBack?: () => void;
}

const AmbulanceDashboard: React.FC<AmbulanceDashboardProps> = ({ onBack }) => {
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showHospitalDetails, setShowHospitalDetails] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilityMarkers, setFacilityMarkers] = useState<any[]>([]);
  const [nearestHospital, setNearestHospital] = useState<any | null>(null);
  const [pendingDispatch, setPendingDispatch] = useState(false);
  const [dispatchAccepted, setDispatchAccepted] = useState(false);
  const [hospitalInfo] = useState({
    name: 'City General Hospital',
    address: '123 Medical Center Dr',
    phone: '+1 (555) 123-4567',
    emergencyPhone: '+1 (555) 911-HELP',
    email: 'emergency@citygeneral.com',
    eta: '8 min',
    distance: '2.3 mi'
  });

  const [emergencyCall] = useState({
    id: 'EMG-001',
    location: '456 Emergency Ave, Downtown',
    type: 'Critical Patient Transfer',
    priority: 'Critical',
    distance: '1.8 miles',
    eta: '6 minutes',
    caller: 'Hospital Command Center',
    phone: '911'
  });

  const {
    session,
    startSession,
    updateVitals,
    completeHandover,
    isSessionActive
  } = useAmbulanceSession();

  const handleLocationUpdate = React.useCallback(async (locationData: any) => {
    if (session && isConnected) {
      await ambulanceSignalRService.broadcastAmbulanceUpdate({
        ambulanceId: session.ambulanceId,
        location: {
          lat: locationData.latitude,
          lng: locationData.longitude,
          accuracy: locationData.accuracy
        },
        vitals: session.vitals.length > 0 ? {
          heartRate: session.vitals[session.vitals.length - 1].heartRate,
          bloodPressure: session.vitals[session.vitals.length - 1].bloodPressure,
          spO2: session.vitals[session.vitals.length - 1].spO2,
          notes: session.vitals[session.vitals.length - 1].notes
        } : undefined,
        timestamp: Date.now()
      });
    }
  }, [session, isConnected]);

  const { location, error, isTracking, startTracking } = useGeolocationStream({
    onLocationUpdate: handleLocationUpdate,
    updateInterval: 5000
  });

  useEffect(() => {
    setIsConnected(true);
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://docent-backend-b4bsayc0dpedc7bf.centralindia-01.azurewebsites.net/api'}/Hospital`);
      if (response.ok) {
        const data = await response.json();
        setFacilities(data);
        const markers = data.map((f: any) => ({
          coordinate: { latitude: f.latitude, longitude: f.longitude },
          type: f.type?.toLowerCase().includes('clinic') ? 'clinic' : 'hospital',
          popupContent: `${f.name} - ${f.address}`,
          color: f.type?.toLowerCase().includes('clinic') ? '#10b981' : '#3b82f6'
        }));
        setFacilityMarkers(markers);
      }
    } catch (err) {
      console.error('Failed to fetch facilities:', err);
    }
  };

  const handleFindNearestHospital = () => {
    if (!location || facilities.length === 0) return;
    
    const hospitals = facilities.filter(f => f.type?.toLowerCase().includes('hospital'));
    if (hospitals.length === 0) return;

    let nearest = hospitals[0];
    let minDistance = Number.MAX_VALUE;

    hospitals.forEach(h => {
      const lat = Number(h.latitude);
      const lng = Number(h.longitude);
      const d = Math.pow(lat - location.latitude, 2) + Math.pow(lng - location.longitude, 2);
      if (d < minDistance) {
        minDistance = d;
        nearest = h;
      }
    });

    setNearestHospital(nearest);
    setDispatchAccepted(true); // Mark as dispatched to the nearest hospital
  };

  const findNearestHospitalFallback = async () => {
    if (!location) return;
    
    try {
      const subKey = process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || "";
      const url = `https://atlas.microsoft.com/search/poi/json?api-version=1.0&query=hospital&subscription-key=${subKey}&lat=${location.latitude}&lon=${location.longitude}&radius=50000`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const first = data.results[0];
          const hospital = {
            name: first.poi.name,
            address: first.address.freeformAddress,
            phone: first.poi.phone || "N/A",
            latitude: first.position.lat,
            longitude: first.position.lon,
            ventilators: "Unknown (External)",
            icuBeds: "Unknown (External)",
            oxygenStock: "Unknown (External)",
            type: "Public Facility"
          };
          setNearestHospital(hospital);
          setDispatchAccepted(true);
        } else {
          alert("No hospitals found in this area (Database or Map Search).");
        }
      }
    } catch (err) {
      console.error("Map search failed:", err);
      alert("Failed to search for nearby hospitals.");
    }
  };

  const handleHospitalAction = () => {
    const hospitalsFromDb = facilities.filter(f => f.type?.toLowerCase().includes('hospital'));
    if (hospitalsFromDb.length > 0) {
      handleFindNearestHospital();
    } else {
      findNearestHospitalFallback();
    }
  };

  useEffect(() => {
    if (!session) {
      startSession('AMB-001', 'HOSP-001', 'PAT-001');
    }
  }, [session, startSession]);

  useEffect(() => {
    if (isSessionActive && !isTracking) {
      startTracking();
    }
  }, [isSessionActive, isTracking, startTracking]);

  const handleVitalsSave = (vitals: any) => {
    updateVitals(vitals);
  };

  const handleCompleteHandover = () => {
    if (window.confirm('Complete handover to hospital? This will end the current session.')) {
      completeHandover();
      setDispatchAccepted(false);
      setPendingDispatch(false);
      alert('✅ HANDOVER COMPLETE\n\nPatient successfully transferred to hospital.\n\nAmbulance is now available for new dispatches.');
    }
  };

  const handleAcceptDispatch = () => {
    if (window.confirm(`🚨 ACCEPT DISPATCH\n\nEmergency: ${emergencyCall.type}\nLocation: ${emergencyCall.location}\nPriority: ${emergencyCall.priority}\n\nAccept this dispatch?`)) {
      setDispatchAccepted(true);
      setPendingDispatch(false);
      alert('✅ DISPATCH ACCEPTED\n\nDispatch confirmed to control center.\nProceeding to emergency location.');
    }
  };

  const handleDeclineDispatch = () => {
    if (window.confirm('Decline this emergency dispatch?')) {
      setPendingDispatch(false);
      alert('Dispatch declined. Returning to available status.');
    }
  };

  const getLatestVitals = () => {
    if (!session || session.vitals.length === 0) return null;
    return session.vitals[session.vitals.length - 1];
  };

  const latestVitals = getLatestVitals();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500/30 flex flex-col">
      {/* Dynamic Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2.5 bg-slate-800/50 hover:bg-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all transform hover:-translate-x-1"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    AMBULANCE 
                    <span className="bg-red-500/10 text-red-500 px-2.5 py-0.5 rounded-lg text-sm leading-none border border-red-500/20">
                      {session?.ambulanceId || 'STANDBY'}
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.location.href = '/leave-management'}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-800/50 hover:bg-slate-700/80 rounded-2xl text-slate-300 hover:text-white transition-all text-xs font-black uppercase tracking-widest border border-slate-700/50"
              >
                <Calendar className="h-4 w-4 text-docent-primary" />
                Leave Hub
              </button>
              <div className="flex items-center gap-3 bg-slate-950/80 px-5 py-2.5 rounded-2xl border border-slate-800/80 shadow-inner">
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-rose-500" />
                    <span className="text-sm font-bold text-rose-500 uppercase tracking-wider">Offline</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Pending Dispatch Alert */}
        {pendingDispatch && (
          <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 to-orange-600 rounded-2xl p-6 shadow-2xl shadow-rose-900/50 border border-rose-500/50">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center mb-3 gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">NEW DISPATCH</h2>
                  <span className="bg-rose-900/50 text-rose-100 border border-rose-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">Pri-1</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-rose-100">
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 opacity-70"/> <span className="font-semibold">{emergencyCall.location}</span></div>
                  <div className="flex items-center gap-2"><Zap className="h-4 w-4 opacity-70"/> <span>{emergencyCall.type}</span></div>
                  <div className="flex items-center gap-2"><Navigation className="h-4 w-4 opacity-70"/> <span>ETA: {emergencyCall.eta} ({emergencyCall.distance})</span></div>
                </div>
              </div>
              
              <div className="flex w-full md:w-auto gap-3">
                <button
                  onClick={handleAcceptDispatch}
                  className="flex-1 md:flex-none bg-white text-rose-600 hover:bg-slate-100 px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-black/20 transition-all transform hover:scale-105 active:scale-95"
                >
                  ACCEPT
                </button>
                <button
                  onClick={handleDeclineDispatch}
                  className="flex-1 md:flex-none bg-rose-900/40 hover:bg-rose-900/60 text-white border border-rose-400/30 px-6 py-4 rounded-xl font-bold transition-all"
                >
                  REJECT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global HUD metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'GPS Status', 
              value: error ? 'DENIED' : (location ? 'TRACKING' : (isTracking ? 'ACQUIRING...' : 'READY')), 
              color: error ? 'text-rose-500' : (location ? 'text-emerald-400' : (isTracking ? 'text-amber-400' : 'text-slate-400')), 
              icon: Navigation 
            },
            { label: 'Dest ETA', value: hospitalInfo.eta, color: 'text-blue-400', icon: Activity },
            { label: 'Distance', value: hospitalInfo.distance, color: 'text-amber-400', icon: MapPin },
            { label: 'Vitals Logged', value: session?.vitals.length || '0', color: 'text-purple-400', icon: Zap }
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2 opacity-50`} />
              <div className={`text-2xl font-black tracking-tight ${stat.color} mb-1 drop-shadow-sm`}>{stat.value}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
          {/* Main Monitor / Map Area */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl overflow-hidden flex flex-col flex-1 shadow-2xl relative">
              <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 shadow-xl">
                <span className="text-sm font-bold text-slate-200 tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-docent-primary" /> LIVE TRACKING
                </span>
              </div>
              <div className="flex-1 w-full bg-slate-950 relative">
                  {location ? (
                    <AzureMap
                      subscriptionKey={process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || ""}
                      center={{ latitude: location.latitude, longitude: location.longitude }}
                      zoom={15}
                      markers={facilityMarkers}
                      ambulances={[{
                        id: session?.ambulanceId || 'AMB-001',
                        coordinate: { latitude: location.latitude, longitude: location.longitude },
                        status: dispatchAccepted ? 'dispatched' : 'idle'
                      }]}
                      route={nearestHospital ? {
                        start: { latitude: location.latitude, longitude: location.longitude },
                        end: { latitude: nearestHospital.latitude, longitude: nearestHospital.longitude }
                      } : undefined}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-950/50">
                       <MapPin className="h-10 w-10 mb-4 animate-bounce text-docent-primary" />
                       <h3 className="text-xl font-black text-white mb-2 tracking-tight">WAITING FOR GPS...</h3>
                       <p className="text-center text-sm max-w-xs text-slate-500 font-medium">
                         {error ? "Please enable location access in your browser settings to track this ambulance." : "Establishing secure link with satellite... Please click 'Allow' if prompted."}
                       </p>
                       {error && (
                         <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> {error}
                         </div>
                       )}
                       <button 
                         onClick={startTracking}
                         className="mt-8 px-8 py-3 bg-docent-primary text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 active:scale-95"
                       >
                         {error ? "Retry Access" : "Grant Location Access"}
                       </button>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Right Panel: Patient Status & Controls */}
          <div className="flex flex-col gap-6">
            
            {/* Vitals Panel */}
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-200 tracking-tight">PATIENT TELEMETRY</h3>
                {latestVitals && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-bold animate-pulse">LIVE</span>}
              </div>
              
              {latestVitals ? (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 border border-rose-900/30 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-rose-500 to-rose-700"></div>
                    <div className="flex items-center gap-3">
                      <div className="bg-rose-500/10 p-2.5 rounded-xl"><HeartBeatIcon className="text-rose-500" /></div>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-[10px]">Heart Rate</span>
                    </div>
                    <div className="text-3xl font-black text-rose-500">{latestVitals.heartRate} <span className="text-sm font-medium opacity-50">BPM</span></div>
                  </div>
                  
                  <div className="bg-slate-950/80 border border-blue-900/30 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-blue-700"></div>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2.5 rounded-xl"><Activity className="h-5 w-5 text-blue-500" /></div>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-[10px]">Blood Pressure</span>
                    </div>
                    <div className="text-xl font-black text-blue-400">{latestVitals.bloodPressure}</div>
                  </div>

                  <div className="bg-slate-950/80 border border-emerald-900/30 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-emerald-700"></div>
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/10 p-2.5 rounded-xl"><Droplets className="h-5 w-5 text-emerald-500" /></div>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-[10px]">SpO2 Level</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-400">{latestVitals.spO2}<span className="text-sm font-medium opacity-50">%</span></div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl">
                  <Activity className="h-10 w-10 mb-3 opacity-20" />
                  <p className="font-medium text-sm">No telemetry data recorded</p>
                </div>
              )}
            </div>

            {/* Nearest Hospital Info Card */}
            {nearestHospital && (
               <div className="bg-slate-900/50 border border-blue-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
                  <h3 className="text-sm font-black text-blue-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                    <Building className="h-4 w-4" /> Nearest Facility
                  </h3>
                  <div className="mb-4">
                    <h4 className="text-xl font-bold text-white mb-1">{nearestHospital.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">{nearestHospital.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Ventilators</p>
                        <p className="text-lg font-black text-white">{nearestHospital.ventilators}</p>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">ICU Beds</p>
                        <p className="text-lg font-black text-white">{nearestHospital.icuBeds}</p>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Oxygen</p>
                        <p className="text-lg font-black text-white">{nearestHospital.oxygenStock}</p>
                    </div>
                    <div className="bg-blue-500/20 p-3 rounded-2xl border border-blue-500/30">
                        <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Type</p>
                        <p className="text-xs font-black text-white">{nearestHospital.type}</p>
                    </div>
                  </div>
               </div>
            )}

            {/* Quick Actions Panel */}
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-sm flex flex-col gap-4">
              {!pendingDispatch && !dispatchAccepted && (
                <button
                  onClick={handleHospitalAction}
                  className="w-full relative group overflow-hidden bg-docent-primary hover:bg-green-600 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center transition-all shadow-xl shadow-green-500/20 active:scale-95"
                >
                  <Navigation className="h-5 w-5 mr-2" />
                  Find Nearby Hospital
                </button>
              )}
              
              <button
                onClick={() => setIsVitalsModalOpen(true)}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-4 px-6 rounded-xl font-bold flex items-center justify-center transition-colors"
              >
                <Thermometer className="h-5 w-5 mr-2" />
                Update Telemetry
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowHospitalDetails(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-3 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Phone className="h-5 w-5 text-amber-500" />
                  <span className="text-xs">Hospital</span>
                </button>
                <div className="bg-slate-800/50 border border-slate-700/50 py-3 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <Navigation className="h-5 w-5 mb-1 opacity-50" />
                  <span className="text-xs font-semibold opacity-50">Nav Active</span>
                </div>
              </div>

              <button
                onClick={handleCompleteHandover}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-4 px-6 rounded-xl font-black tracking-wide flex items-center justify-center transition-all shadow-lg shadow-emerald-900/30"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                COMPLETE HANDOVER
              </button>
            </div>
            
          </div>
        </div>
      </div>

      <VitalsInputForm
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        onSave={handleVitalsSave}
      />

      {showHospitalDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <HospitalIcon className="text-docent-primary" /> HOSPITAL DETAILS
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <p className="font-bold text-white text-lg">{nearestHospital?.name || hospitalInfo.name}</p>
                <p className="text-sm text-slate-400 mt-1">{nearestHospital?.address || hospitalInfo.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-900/20 border border-rose-500/20 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Emergency</p>
                  <p className="text-rose-100 font-mono text-sm break-all">{nearestHospital?.phone || hospitalInfo.emergencyPhone}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Main Line</p>
                  <p className="text-slate-300 font-mono text-sm break-all">{nearestHospital?.phone || hospitalInfo.phone}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowHospitalDetails(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold transition-all border border-slate-700"
            >
              Close Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper icons
const HeartBeatIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${className}`}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const HospitalIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 ${className}`}>
    <path d="M12 3v18" /><path d="M3 12h18" /><path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
  </svg>
);

export default AmbulanceDashboard;