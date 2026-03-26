import React, { useState, useEffect, useRef } from 'react';
import { User, Heart, Mail, Eye, EyeOff, FileText, Plus, Trash2, Download, Calendar, Upload } from 'lucide-react';
import { authService } from '../services/AuthService';

interface Doctor {
  id: string;
  username: string;
  email: string;
  phone?: string;
  uniqueDoctorId: string;
}

interface DataSharingSettings {
  vitals: boolean;
  location: boolean;
  emergencyContacts: boolean;
  medicalHistory: boolean;
}

interface MedicalRecord {
  id: string;
  title: string;
  type: string;
  date: string;
  notes: string;
  fileName?: string;
  fileData?: string; // base64 for demo purposes
}

const PatientDashboard: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [dataSharingSettings, setDataSharingSettings] = useState<DataSharingSettings>({
    vitals: true,
    location: true,
    emergencyContacts: false,
    medicalHistory: false
  });
  
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<MedicalRecord>>({
    type: 'Prescription'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const loadDoctor = async () => {
      if (currentUser?.doctorId) {
        const assignedDoctor = await authService.getDoctorByUniqueId(currentUser.doctorId);
        if (assignedDoctor) {
          setDoctor(assignedDoctor as Doctor);
        }
      }
    };

    loadDoctor();

    // Load data sharing settings
    const savedSettings = localStorage.getItem(`data_sharing_${currentUser?.id}`);
    if (savedSettings) {
      setDataSharingSettings(JSON.parse(savedSettings));
    }
    
    // Load medical records
    const savedRecords = localStorage.getItem(`medical_records_${currentUser?.id}`);
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, [currentUser]);

  const toggleDataSharing = (key: keyof DataSharingSettings) => {
    const newSettings = { ...dataSharingSettings, [key]: !dataSharingSettings[key] };
    setDataSharingSettings(newSettings);
    localStorage.setItem(`data_sharing_${currentUser?.id}`, JSON.stringify(newSettings));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 2MB to prevent localstorage issues
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large! Please select a file under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRecord(prev => ({
          ...prev,
          fileName: file.name,
          fileData: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveRecord = () => {
    if (!newRecord.title || !newRecord.date) {
      alert("Please fill in the required fields (Title and Date)");
      return;
    }
    
    const record: MedicalRecord = {
      id: Date.now().toString(),
      title: newRecord.title,
      type: newRecord.type || 'Other',
      date: newRecord.date,
      notes: newRecord.notes || '',
      fileName: newRecord.fileName,
      fileData: newRecord.fileData
    };
    
    const updatedRecords = [record, ...records];
    setRecords(updatedRecords);
    localStorage.setItem(`medical_records_${currentUser?.id}`, JSON.stringify(updatedRecords));
    
    setShowAddRecordModal(false);
    setNewRecord({ type: 'Prescription' });
  };

  const deleteRecord = (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedRecords = records.filter(r => r.id !== id);
      setRecords(updatedRecords);
      localStorage.setItem(`medical_records_${currentUser?.id}`, JSON.stringify(updatedRecords));
    }
  };

  const downloadRecord = (record: MedicalRecord) => {
    if (record.fileData) {
      const a = document.createElement('a');
      a.href = record.fileData;
      a.download = record.fileName || `medical_record_${record.id}`;
      a.click();
    }
  };

  if (!currentUser || currentUser.userType !== 'patient') {
    return <div>Access denied. Patient account required.</div>;
  }

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-br from-docent-primary/20 to-docent-secondary/20 p-5 rounded-2xl shadow-inner border border-white">
            <User className="h-10 w-10 text-docent-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{currentUser.username}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
              <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-700">ID: {currentUser.id}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {currentUser.email}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
            <Heart className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Status</p>
              <p className="text-sm font-semibold text-emerald-900">Active Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Medical Records Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-docent-primary" />
                  My Medical Records
                </h3>
                <p className="text-sm text-slate-500 mt-1">Manage and view your complete medical history</p>
              </div>
              <button
                onClick={() => setShowAddRecordModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-docent-primary hover:bg-green-600 shadow-md shadow-green-500/20 text-white rounded-xl text-sm font-bold transition-all transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Add Record
              </button>
            </div>
            
            <div className="p-6">
              {records.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-slate-700 mb-2">No Records Found</h4>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">Upload your prescriptions, test reports, and other medical documents to keep them organized.</p>
                  <button
                    onClick={() => setShowAddRecordModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-docent-primary text-docent-primary hover:bg-docent-primary hover:text-white rounded-lg text-sm font-bold transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    Upload First Record
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {records.map((record) => (
                    <div key={record.id} className="group border border-slate-200 rounded-xl p-5 hover:border-docent-primary hover:shadow-lg transition-all duration-300 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3">
                          <div className="mt-1">
                            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 line-clamp-1" title={record.title}>{record.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                {record.type}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(record.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {record.notes && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {record.notes}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="flex-1 w-full truncate pr-2">
                          {record.fileName ? (
                            <span className="text-xs font-medium text-slate-500 truncate inline-block w-full" title={record.fileName}>
                              📎 {record.fileName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No attachment</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {record.fileData && (
                            <button 
                              onClick={() => downloadRecord(record)}
                              className="p-1.5 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors"
                              title="Download Attachment"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Assigned Doctor Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Your Healthcare Team</h3>
            </div>
            <div className="p-6">
              {doctor ? (
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-4 rounded-xl shadow-sm border border-blue-200">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-lg">Dr. {doctor.username}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5"/> {doctor.email}</p>
                    <code className="text-xs font-mono font-bold mt-2 inline-block bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                      ID: {doctor.uniqueDoctorId}
                    </code>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100">
                    <User className="h-8 w-8 text-orange-400" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">No Assigned Doctor</h4>
                  <p className="text-sm text-slate-500 mb-4 px-4">Contact your healthcare provider to get your doctor's ID link.</p>
                </div>
              )}
            </div>
          </div>

          {/* Data Sharing Controls */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Privacy Controls</h3>
              <p className="text-xs text-slate-500 mt-1">Manage what your team can see</p>
            </div>
            
            <div className="p-5 space-y-3">
              {[
                { key: 'vitals', label: 'Health Vitals', description: 'Real-time metrics' },
                { key: 'medicalHistory', label: 'Medical Records', description: 'Allow doctor to view records' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white">
                  <div className="mb-3 sm:mb-0 pr-4">
                    <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                  <button
                    onClick={() => toggleDataSharing(key as keyof DataSharingSettings)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all w-full sm:w-auto ${
                      dataSharingSettings[key as keyof DataSharingSettings]
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 font-medium hover:bg-slate-100'
                    }`}
                  >
                    {dataSharingSettings[key as keyof DataSharingSettings] ? (
                      <><Eye className="h-4 w-4" /> <span className="text-xs w-12">Shared</span></>
                    ) : (
                      <><EyeOff className="h-4 w-4" /> <span className="text-xs w-12">Private</span></>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-slate-100 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Upload Record</h3>
              <button 
                onClick={() => setShowAddRecordModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Record Title *</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. Blood Test Results"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/50 focus:border-docent-primary bg-slate-50 focus:bg-white transition-all"
                  value={newRecord.title || ''}
                  onChange={e => setNewRecord({...newRecord, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Document Type</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/50 focus:border-docent-primary bg-slate-50 focus:bg-white transition-all appearance-none"
                    value={newRecord.type || 'Prescription'}
                    onChange={e => setNewRecord({...newRecord, type: e.target.value})}
                  >
                    <option value="Prescription">Prescription</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Imaging">Imaging (X-Ray, MRI)</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="General Notes">General Notes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Date *</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/50 focus:border-docent-primary bg-slate-50 focus:bg-white transition-all"
                    value={newRecord.date || ''}
                    onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Attachment (Max 2MB)</label>
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 hover:border-docent-primary transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  {newRecord.fileName ? (
                    <div className="flex items-center justify-center gap-2 text-docent-primary font-medium">
                      <FileText className="h-5 w-5" />
                      <span className="truncate max-w-[200px]">{newRecord.fileName}</span>
                    </div>
                  ) : (
                    <div className="text-slate-500">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                      <span className="text-sm font-medium">Click to browse files</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Additional Notes</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-docent-primary/50 focus:border-docent-primary bg-slate-50 focus:bg-white transition-all resize-none"
                  placeholder="Any extra details about this record..."
                  value={newRecord.notes || ''}
                  onChange={e => setNewRecord({...newRecord, notes: e.target.value})}
                ></textarea>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setShowAddRecordModal(false)}
                className="flex-1 px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveRecord}
                className="flex-1 px-5 py-3 rounded-xl font-bold text-white bg-docent-primary hover:bg-green-600 shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transform hover:-translate-y-0.5 transition-all"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;