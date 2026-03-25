import React, { useState, useEffect } from 'react';
import { Camera, AlertTriangle, Users, Activity, ArrowLeft, Settings } from 'lucide-react';
import StreamPlayer from './StreamPlayer';
import CameraRegistrationForm from './CameraRegistrationForm';
import { useVisionAnalytics } from '../hooks/useVisionAnalytics';

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  streamUrl: string;
  isActive: boolean;
  accessLevel: 'public' | 'restricted' | 'admin';
  resolution: string;
}

interface LiveCameraDashboardProps {
  onBack: () => void;
}

const LiveCameraDashboard: React.FC<LiveCameraDashboardProps> = ({ onBack }) => {
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [cameras, setCameras] = useState<CameraFeed[]>([
    {
      id: 'cam-001',
      name: 'ER Entrance',
      location: 'Emergency Department',
      streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      isActive: true,
      accessLevel: 'public',
      resolution: '1080p'
    },
    {
      id: 'cam-002',
      name: 'ICU Room 1',
      location: 'Intensive Care Unit',
      streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      isActive: true,
      accessLevel: 'restricted',
      resolution: '720p'
    },
    {
      id: 'cam-003',
      name: 'Ambulance Bay',
      location: 'Emergency Entrance',
      streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      isActive: true,
      accessLevel: 'public',
      resolution: '1080p'
    }
  ]);

  const { crowdDensity, visualEvents, isAnalyzing } = useVisionAnalytics(selectedCamera?.id);

  useEffect(() => {
    if (cameras.length > 0) {
      setSelectedCamera(cameras[0]);
    }
  }, [cameras]);

  const handleCameraRegistration = (newCamera: Omit<CameraFeed, 'id'>) => {
    const camera: CameraFeed = {
      ...newCamera,
      id: `cam-${Date.now()}`
    };
    setCameras(prev => [...prev, camera]);
    setShowRegistration(false);
  };

  return (
    <div className="pt-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-600/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Hospital Live Monitor</h2>
              <p className="text-sm text-slate-500">Real-time camera feeds and AI analytics</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowRegistration(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lifelink-primary hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Settings className="h-4 w-4" />
          Add Camera
        </button>
      </div>

      {/* AI Analytics Bar */}
      {selectedCamera && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-slate-700">Crowd Density</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {crowdDensity || '--'}
            </div>
            <p className="text-xs text-slate-500">People detected</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-slate-700">Activity Level</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {isAnalyzing ? 'Analyzing...' : 'Normal'}
            </div>
            <p className="text-xs text-slate-500">AI assessment</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-slate-700">Alerts</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">0</div>
            <p className="text-xs text-slate-500">Active alerts</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">
                {selectedCamera?.name || 'Select Camera'}
              </h3>
              <p className="text-sm text-slate-500">{selectedCamera?.location}</p>
            </div>
            <div className="aspect-video bg-black relative">
              {selectedCamera ? (
                <StreamPlayer
                  streamUrl={selectedCamera.streamUrl}
                  cameraName={selectedCamera.name}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a camera to view live feed</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Visual Events Summary */}
            {visualEvents && (
              <div className="p-4 bg-blue-50 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">AI Visual Summary</h4>
                <p className="text-sm text-blue-700">{visualEvents}</p>
              </div>
            )}
          </div>
        </div>

        {/* Camera Sidebar */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Camera Feeds</h3>
          {cameras.map((camera) => (
            <div
              key={camera.id}
              onClick={() => setSelectedCamera(camera)}
              className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${
                selectedCamera?.id === camera.id
                  ? 'border-lifelink-primary shadow-md'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${camera.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium text-slate-800">{camera.name}</span>
              </div>
              <p className="text-sm text-slate-500 mb-2">{camera.location}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{camera.resolution}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  camera.accessLevel === 'public' ? 'bg-green-100 text-green-700' :
                  camera.accessLevel === 'restricted' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {camera.accessLevel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Camera Registration Modal */}
      {showRegistration && (
        <CameraRegistrationForm
          onClose={() => setShowRegistration(false)}
          onSubmit={handleCameraRegistration}
        />
      )}
    </div>
  );
};

export default LiveCameraDashboard;