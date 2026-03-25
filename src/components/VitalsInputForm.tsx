import React, { useState } from 'react';
import { Heart, Activity, FileText, Save, X, Bluetooth, Wifi, Droplets } from 'lucide-react';

interface VitalsData {
  heartRate?: number;
  bloodPressure?: string;
  spO2?: number;
  notes?: string;
}

interface VitalsInputFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vitals: VitalsData) => void;
  initialData?: VitalsData;
}

const VitalsInputForm: React.FC<VitalsInputFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData = {}
}) => {
  const [vitals, setVitals] = useState<VitalsData>(initialData);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [wifiConnected, setWifiConnected] = useState(false);

  const handleSave = () => {
    onSave(vitals);
    onClose();
    setVitals({});
  };

  const handleInputChange = (field: keyof VitalsData, value: string | number) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const connectBluetooth = () => {
    setBluetoothConnected(!bluetoothConnected);
    alert(bluetoothConnected ? 'Bluetooth Disconnected' : 'Bluetooth Connected to Monitor-Defibrillator');
  };

  const connectWifi = () => {
    setWifiConnected(!wifiConnected);
    alert(wifiConnected ? 'WiFi Disconnected' : 'WiFi Connected to Monitor-Defibrillator');
  };

  const syncVitalsFromDevice = () => {
    if (!bluetoothConnected && !wifiConnected) {
      alert('Please connect via Bluetooth or WiFi first');
      return;
    }
    
    const connectionType = bluetoothConnected ? 'Bluetooth' : 'WiFi';
    
    setVitals({
      heartRate: 78,
      bloodPressure: '120/80',
      spO2: 98,
      notes: vitals.notes || ''
    });
    
    alert(`Vitals synced from Monitor-Defibrillator via ${connectionType}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative">
        
        {/* Decorative Top Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500"></div>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Activity className="text-blue-500 h-6 w-6" /> TELEMETRY ENTRY
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manual Input & Device Sync</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all border border-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Device Connection Section */}
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bluetooth className="h-4 w-4 text-blue-400" /> Device Connection
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={connectBluetooth}
                className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  bluetoothConnected 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Bluetooth className={`h-5 w-5 mb-1 ${bluetoothConnected ? 'animate-pulse' : ''}`} />
                {bluetoothConnected ? 'BT Linked' : 'Link BT'}
              </button>
              
              <button
                onClick={connectWifi}
                className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  wifiConnected 
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Wifi className={`h-5 w-5 mb-1 ${wifiConnected ? 'animate-pulse' : ''}`} />
                {wifiConnected ? 'WiFi Linked' : 'Link WiFi'}
              </button>
            </div>
            
            <button
              onClick={syncVitalsFromDevice}
              disabled={!bluetoothConnected && !wifiConnected}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all ${
                (bluetoothConnected || wifiConnected)
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30'
                  : 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-800'
              }`}
            >
              <Activity className="h-5 w-5 mr-2" />
              PULL DATALINK
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Manual Override
            </h3>

            {/* Heart Rate */}
            <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden flex items-center px-4 focus-within:border-rose-500/50 focus-within:ring-1 focus-within:ring-rose-500/50 transition-all">
              <div className="bg-rose-500/10 p-2.5 rounded-xl mr-3"><Heart className="h-5 w-5 text-rose-500" /></div>
              <div className="flex-1 py-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Heart Rate</p>
                <input
                  type="number"
                  value={vitals.heartRate || ''}
                  onChange={(e) => handleInputChange('heartRate', parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-white font-black text-2xl focus:outline-none placeholder-slate-700"
                  placeholder="80"
                  min="30" max="200"
                />
              </div>
              <span className="text-sm font-bold text-slate-600">BPM</span>
            </div>

            {/* Blood Pressure */}
            <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden flex items-center px-4 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
              <div className="bg-blue-500/10 p-2.5 rounded-xl mr-3"><Activity className="h-5 w-5 text-blue-500" /></div>
              <div className="flex-1 py-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blood Pressure</p>
                <input
                  type="text"
                  value={vitals.bloodPressure || ''}
                  onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                  className="w-full bg-transparent text-white font-black text-2xl focus:outline-none placeholder-slate-700"
                  placeholder="120/80"
                />
              </div>
            </div>

            {/* SpO2 */}
            <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden flex items-center px-4 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl mr-3"><Droplets className="h-5 w-5 text-emerald-500" /></div>
              <div className="flex-1 py-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SpO2 Level</p>
                <input
                  type="number"
                  value={vitals.spO2 || ''}
                  onChange={(e) => handleInputChange('spO2', parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-white font-black text-2xl focus:outline-none placeholder-slate-700"
                  placeholder="98"
                  min="70" max="100"
                />
              </div>
              <span className="text-sm font-bold text-slate-600">%</span>
            </div>

            {/* Notes */}
            <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-4 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-amber-500/10 p-1.5 rounded-lg"><FileText className="h-4 w-4 text-amber-500" /></div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trauma Notes</p>
              </div>
              <textarea
                value={vitals.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full bg-transparent text-white font-medium focus:outline-none placeholder-slate-700 min-h-[80px] resize-none"
                placeholder="Patient condition, injuries..."
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-4 font-bold text-slate-400 bg-slate-800 rounded-xl hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-4 font-black tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center shadow-lg shadow-blue-500/20"
            >
              <Save className="h-5 w-5 mr-3" />
              CONFIRM TELEMETRY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalsInputForm;