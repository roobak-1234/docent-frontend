// ✅ AMBULANCE DASHBOARD — FULL VERSION WITH REAL GPS

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Phone, Navigation, CheckCircle, AlertTriangle,
  WifiOff, ArrowLeft, Thermometer, Droplets, MapPin, Zap, Locate, Calendar
} from 'lucide-react';
import { AzureMap } from './AzureMap';
import { hospitalService } from '../services/hospitalService';
import { useAmbulanceSession } from '../hooks/useAmbulanceSession';
import VitalsInputForm from './VitalsInputForm';
import { authService } from '../services/AuthService';
import { getAzureMapsSubscriptionKey } from '../config/maps';

interface AmbulanceDashboardProps {
  onBack?: () => void;
  onLeaveManagement?: () => void;
}

const DEFAULT_CENTER = { latitude: 20.5937, longitude: 78.9629 }; // India

const getRouteFocusZoom = (distanceKm: number): number => {
  if (distanceKm <= 1) return 14;
  if (distanceKm <= 3) return 13;
  if (distanceKm <= 8) return 12;
  if (distanceKm <= 20) return 11;
  if (distanceKm <= 50) return 10;
  if (distanceKm <= 120) return 9;
  return 8;
};

// --- Haversine distance in km ---
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// --- HeartBeat Icon ---
const HeartBeatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${className}`}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

// --- Hospital Icon ---
const HospitalIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 ${className}`}>
    <path d="M12 3v18M3 12h18M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
  </svg>
);

const AmbulanceDashboard: React.FC<AmbulanceDashboardProps> = ({ onBack, onLeaveManagement }) => {
  const currentUser = authService.getCurrentUser();
  const mapsSubscriptionKey = getAzureMapsSubscriptionKey();

  // --- GPS State ---
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // --- Map State ---
  const [mapTrigger, setMapTrigger] = useState(0);
  const [routePoints, setRoutePoints] = useState<any[]>([]);
  const [nearbyFacilities, setNearbyFacilities] = useState<any[]>([]);
  const [routeFocus, setRouteFocus] = useState<{ center: { latitude: number; longitude: number }; zoom: number } | null>(null);

  // --- Hospital State ---
  const [nearestHospital, setNearestHospital] = useState<any>(null);
  const [routeMetrics, setRouteMetrics] = useState({ distance: '', duration: '' });
  const [isFindingHospital, setIsFindingHospital] = useState(false);

  // --- UI State ---
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [dispatchAccepted, setDispatchAccepted] = useState(false);

  // --- Session ---
  const { session, startSession, updateVitals, completeHandover } = useAmbulanceSession();

  useEffect(() => {
    if (!session) startSession('AMB-001', 'HOSP-001', 'PAT-001');
  }, [session, startSession]);

  // =============================================
  // 🔥 REAL-TIME GPS via watchPosition
  // =============================================
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by this browser.');
      setGpsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCurrentLocation(loc);
        setGpsLoading(false);
        setGpsError(null);
      },
      (err) => {
        setGpsError(err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // =============================================
  // 🏥 AUTO-FETCH HOSPITALS once GPS is ready
  // =============================================
  useEffect(() => {
    if (!currentLocation) return;

    const load = async () => {
      try {
        // Azure Maps hospitals nearby (single source of truth for map results)
        const mapHospitals = await hospitalService.searchNearbyHospitals(
          currentLocation.latitude, currentLocation.longitude
        ).catch(() => []);
        setNearbyFacilities(mapHospitals);
      } catch (e) {
        console.warn('Hospital load failed:', e);
      }
    };

    load();
    // Only re-run if we move > 2km
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation?.latitude?.toFixed(2), currentLocation?.longitude?.toFixed(2)]);

  // =============================================
  // 🔍 FIND NEAREST HOSPITAL + ROUTE
  // =============================================
  const handleFindNearestHospital = useCallback(async () => {
    if (!currentLocation) {
      alert('GPS not ready. Please wait or enable location permissions.');
      return;
    }

    setIsFindingHospital(true);
    const { latitude: lat, longitude: lon } = currentLocation;

    const candidates = await hospitalService.searchNearbyHospitals(lat, lon).catch(() => []);

    if (candidates.length === 0) {
      setIsFindingHospital(false);
      alert('No hospitals found from map search near your location.\nEnsure location permissions are enabled and map key is configured.');
      return;
    }

    // Pick absolute nearest
    let closest: any = null;
    let minDist = Infinity;
    candidates.forEach(h => {
      const d = haversine(lat, lon, h.latitude, h.longitude);
      if (d < minDist) { minDist = d; closest = h; }
    });

    // Ensure it's on the map
    setNearbyFacilities(prev => {
      const ids = new Set(prev.map(f => f.uniqueHospitalId || f.id));
      return ids.has(closest.uniqueHospitalId || closest.id) ? prev : [...prev, closest];
    });
    setNearestHospital(closest);

    // Get real road route
    const route = await hospitalService.getRoute(
      { lat, lon },
      { lat: closest.latitude, lon: closest.longitude }
    );

    if (route.points.length > 0) {
      setRoutePoints(route.points);
      setRouteMetrics({ distance: route.distance, duration: route.duration });
    } else {
      setRoutePoints([
        { latitude: lat, longitude: lon },
        { latitude: closest.latitude, longitude: closest.longitude },
      ]);
      setRouteMetrics({ distance: `~${minDist.toFixed(1)} km`, duration: '' });
    }

    // Focus map so both ambulance and nearest hospital are visible.
    const midLat = (lat + closest.latitude) / 2;
    const midLon = (lon + closest.longitude) / 2;
    setRouteFocus({
      center: { latitude: midLat, longitude: midLon },
      zoom: getRouteFocusZoom(minDist),
    });

    setMapTrigger(prev => prev + 1);
    setDispatchAccepted(true);
    setIsFindingHospital(false);
  }, [currentLocation]);

  const handleLocateMe = () => {
    if (!currentLocation) return;
    setRouteFocus({
      center: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      zoom: 15,
    });
    setMapTrigger(prev => prev + 1);
  };

  const handleCompleteHandover = () => {
    if (window.confirm('Complete handover to hospital? This will end the current session.')) {
      completeHandover();
      setDispatchAccepted(false);
      setRoutePoints([]);
      setNearestHospital(null);
      setRouteMetrics({ distance: '', duration: '' });
      setRouteFocus(null);
    }
  };

  const latestVitals = session?.vitals?.length
    ? session.vitals[session.vitals.length - 1]
    : null;
  const isNearestHospitalRegistered = nearestHospital ? !nearestHospital.isExternal : true;
  const telemetryUpdateBlocked = !!nearestHospital && !isNearestHospitalRegistered;

  const center = routeFocus?.center || currentLocation || DEFAULT_CENTER;
  const zoom = routeFocus?.zoom ?? (currentLocation ? 15 : 5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">

      {/* ── Navigation Bar ── */}
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              {onBack && (
                <button onClick={onBack}
                  className="p-2.5 bg-slate-800/50 hover:bg-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all transform hover:-translate-x-1">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              {onLeaveManagement && (
                <button onClick={onLeaveManagement}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all text-sm font-bold">
                  <Calendar className="h-4 w-4" />
                  Leave
                </button>
              )}
              <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  AMBULANCE
                  <span className="bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-lg text-sm border border-red-500/20">
                    {session?.ambulanceId || 'STANDBY'}
                  </span>
                </h1>
                <p className="text-xs text-slate-400">{currentUser?.username || 'Driver'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700/50">
              {gpsError ? (
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-bold text-rose-500">GPS ERROR</span>
                </div>
              ) : currentLocation ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-bold text-emerald-400">GPS LIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin" />
                  <span className="text-sm font-bold text-amber-400">ACQUIRING</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

        {/* ── HUD Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'GPS Status',
              value: gpsError ? 'ERROR' : (currentLocation ? 'LIVE' : 'SEARCHING'),
              color: gpsError ? 'text-rose-500' : (currentLocation ? 'text-emerald-400' : 'text-amber-400'),
              icon: Navigation,
              subtitle: gpsError ?? (currentLocation ? `±${Math.round(currentLocation.accuracy)}m` : undefined)
            },
            { label: 'Dest ETA', value: routeMetrics.duration || '--', color: 'text-blue-400', icon: Activity },
            { label: 'Distance', value: routeMetrics.distance || '--', color: 'text-amber-400', icon: MapPin },
            { label: 'Vitals Logged', value: String(session?.vitals?.length ?? 0), color: 'text-purple-400', icon: Zap },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2 opacity-50`} />
              <div className={`text-2xl font-black tracking-tight ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
              {stat.subtitle && <div className="text-[10px] text-slate-400 mt-1 truncate max-w-full">{stat.subtitle}</div>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">

          {/* ── Map ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl overflow-hidden flex flex-col flex-1 shadow-2xl relative min-h-[400px]">
              <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 shadow-xl">
                <span className="text-sm font-bold text-slate-200 tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400" /> LIVE TRACKING
                </span>
              </div>

              <div className="flex-1 w-full bg-slate-950 relative">
                <AzureMap
                  subscriptionKey={mapsSubscriptionKey}
                  center={center}
                  zoom={zoom}
                  mapStyle="satellite_road_labels"
                  userLocation={currentLocation}
                  markers={nearbyFacilities
                    .filter(f => f.latitude != null && f.longitude != null)
                    .map(f => ({
                      coordinate: { latitude: f.latitude, longitude: f.longitude },
                      type: (f.type === 'Clinic' ? 'clinic' : 'hospital') as 'hospital' | 'clinic',
                      popupContent: `${f.name}${f.specialization ? ` · ${f.specialization}` : ''}`,
                    }))}
                  ambulances={[]}
                  routePoints={routePoints}
                  trigger={mapTrigger}
                />

                {/* GPS loading overlay */}
                {gpsLoading && (
                  <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                        <MapPin className="h-4 w-4 text-blue-400 absolute inset-0 m-auto" />
                      </div>
                      <p className="text-sm font-bold text-slate-300">Acquiring GPS Signal...</p>
                      <p className="text-xs text-slate-500">Please allow location access</p>
                    </div>
                  </div>
                )}

                {/* GPS error banner */}
                {gpsError && !gpsLoading && (
                  <div className="absolute top-4 right-4 z-20 bg-rose-900/80 border border-rose-500/50 text-rose-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-sm">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    {gpsError}
                  </div>
                )}

                {/* Locate Me Button */}
                <button
                  onClick={handleLocateMe}
                  className="absolute bottom-10 right-10 z-20 bg-white hover:bg-slate-50 text-blue-600 p-4 rounded-full shadow-2xl transition-all border border-slate-200 active:scale-95"
                  title="Recenter Map"
                >
                  <Locate className="h-7 w-7" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="flex flex-col gap-6">

            {/* Vitals Panel */}
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-200 tracking-tight">PATIENT TELEMETRY</h3>
                {latestVitals && (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-bold animate-pulse">LIVE</span>
                )}
              </div>

              {latestVitals ? (
                <div className="space-y-4">
                  {[
                    { label: 'Heart Rate', value: `${latestVitals.heartRate} BPM`, color: 'rose', Icon: HeartBeatIcon },
                    { label: 'Blood Pressure', value: latestVitals.bloodPressure, color: 'blue', Icon: Activity },
                    { label: 'SpO2 Level', value: `${latestVitals.spO2}%`, color: 'emerald', Icon: Droplets },
                  ].map(({ label, value, color, Icon }) => (
                    <div key={label} className={`bg-slate-950/80 border border-${color}-900/30 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden`}>
                      <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-${color}-500 to-${color}-700`} />
                      <div className="flex items-center gap-3">
                        <div className={`bg-${color}-500/10 p-2.5 rounded-xl`}>
                          {label === 'Heart Rate' ? <HeartBeatIcon className={`text-${color}-500`} /> :
                           label === 'Blood Pressure' ? <Activity className={`h-5 w-5 text-${color}-500`} /> :
                           <Droplets className={`h-5 w-5 text-${color}-500`} />}
                        </div>
                        <span className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest`}>{label}</span>
                      </div>
                      <div className={`text-xl font-black text-${color}-400`}>{value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl">
                  <Activity className="h-10 w-10 mb-3 opacity-20" />
                  <p className="font-medium text-sm">No telemetry recorded</p>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-sm flex flex-col gap-4">
              {!dispatchAccepted && (
                <button
                  onClick={handleFindNearestHospital}
                  disabled={isFindingHospital || !currentLocation}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center transition-all border border-red-500 shadow-lg shadow-red-900/20"
                >
                  {isFindingHospital ? (
                    <>
                      <div className="h-5 w-5 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Searching Nearby...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-5 w-5 mr-2" />
                      Find Nearest Hospital
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setIsVitalsModalOpen(true)}
                disabled={telemetryUpdateBlocked}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-slate-800/70 disabled:text-slate-500 disabled:border-slate-700 disabled:cursor-not-allowed text-blue-400 border border-blue-500/30 py-4 px-6 rounded-xl font-bold flex items-center justify-center transition-colors"
              >
                <Thermometer className="h-5 w-5 mr-2" />
                {telemetryUpdateBlocked ? 'Telemetry Update Unavailable' : 'Update Telemetry'}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleFindNearestHospital}
                  disabled={isFindingHospital || !currentLocation}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 border border-slate-700 py-3 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Phone className="h-5 w-5 text-amber-500" />
                  <span className="text-xs">Refresh Route</span>
                </button>
                <div className="bg-slate-800/50 border border-slate-700/50 py-3 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <Navigation className="h-5 w-5 mb-1 opacity-50" />
                  <span className="text-xs font-semibold opacity-50">
                    {dispatchAccepted ? 'Nav Active' : 'Standby'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCompleteHandover}
                disabled={!dispatchAccepted}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-black tracking-wide flex items-center justify-center transition-all shadow-lg shadow-emerald-900/30"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                COMPLETE HANDOVER
              </button>
            </div>

            {/* Nearest Hospital Details */}
            {nearestHospital && dispatchAccepted && (
              <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
                <h3 className="text-lg font-black text-slate-200 tracking-tight mb-4 flex items-center gap-2">
                  <HospitalIcon className="text-emerald-400" />
                  NEAREST HOSPITAL
                </h3>

                <div className="space-y-4">
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                    <p className="font-bold text-white text-lg">{nearestHospital.name}</p>
                    <p className="text-sm text-slate-400 mt-1">{nearestHospital.address || 'Address not available'}</p>
                    {(nearestHospital.specialization || nearestHospital.icuBeds != null || nearestHospital.ventilators != null) && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
                        {nearestHospital.specialization && (
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                            {nearestHospital.specialization}
                          </span>
                        )}
                        {nearestHospital.icuBeds != null && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                            {nearestHospital.icuBeds} ICU Beds
                          </span>
                        )}
                        {nearestHospital.ventilators != null && (
                          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                            {nearestHospital.ventilators} Vents
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Distance</p>
                      <p className="text-white font-mono font-bold">{routeMetrics.distance || '--'}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ETA</p>
                      <p className="text-white font-mono font-bold">{routeMetrics.duration || '--'}</p>
                    </div>
                  </div>

                  {nearestHospital.phone && (
                    <div className="bg-rose-900/20 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3">
                      <Phone className="h-5 w-5 text-rose-400" />
                      <div>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Emergency Line</p>
                        <p className="text-rose-100 font-mono text-sm">{nearestHospital.phone}</p>
                      </div>
                    </div>
                  )}

                  {!isNearestHospitalRegistered && (
                    <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Registration Required</p>
                      <p className="text-sm text-amber-100">
                        This nearest hospital is discovered from map search and is not in the system database.
                        Telemetry updates are disabled until a registered hospital is selected.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Vitals Modal ── */}
      <VitalsInputForm
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        onSave={(vitals) => { updateVitals(vitals); setIsVitalsModalOpen(false); }}
      />
    </div>
  );
};

export default AmbulanceDashboard;