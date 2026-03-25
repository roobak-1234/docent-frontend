import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Activity, Heart, Thermometer, Wind, User, Mail, Phone, MapPin, Edit, Save, ArrowLeft } from 'lucide-react';
import { authService } from '../services/AuthService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface RPMPatientDashboardProps {
    patientId?: string;
    onBack?: () => void;
}

const RPMPatientDashboard: React.FC<RPMPatientDashboardProps> = ({ patientId, onBack }) => {
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [dataSharingSettings, setDataSharingSettings] = useState<any>({});
    const [medicalHistory, setMedicalHistory] = useState('');
    const [emergencyContacts, setEmergencyContacts] = useState('');
    const [isEditingHistory, setIsEditingHistory] = useState(false);
    const [isEditingContacts, setIsEditingContacts] = useState(false);
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        if (patientId) {
            const allUsers = JSON.parse(localStorage.getItem('lifelink_users') || '[]');
            const patient = allUsers.find((u: any) => u.id === patientId && u.userType === 'patient');
            if (patient) {
                const { password, ...patientWithoutPassword } = patient;
                setSelectedPatient(patientWithoutPassword);
                
                // Load data sharing settings
                const savedSettings = localStorage.getItem(`data_sharing_${patientId}`);
                if (savedSettings) {
                    setDataSharingSettings(JSON.parse(savedSettings));
                }
                
                // Load medical history and emergency contacts
                const savedHistory = localStorage.getItem(`medical_history_${patientId}`);
                const savedContacts = localStorage.getItem(`emergency_contacts_${patientId}`);
                if (savedHistory) setMedicalHistory(savedHistory);
                if (savedContacts) setEmergencyContacts(savedContacts);
            }
        }
    }, [patientId]);

    const saveMedicalHistory = () => {
        if (patientId) {
            localStorage.setItem(`medical_history_${patientId}`, medicalHistory);
            setIsEditingHistory(false);
        }
    };

    const saveEmergencyContacts = () => {
        if (patientId) {
            localStorage.setItem(`emergency_contacts_${patientId}`, emergencyContacts);
            setIsEditingContacts(false);
        }
    };

    const displayPatient = selectedPatient || (currentUser?.userType === 'patient' ? currentUser : null);
    const patientName = displayPatient ? displayPatient.username : 'Patient';
    const patientEmail = displayPatient ? displayPatient.email : '';
    const patientPhone = displayPatient ? displayPatient.phone : '';
    const patientIdDisplay = displayPatient ? displayPatient.id : '';

    const mockLocation = {
        lat: 40.7128,
        lng: -74.0060,
        address: '123 Main St, New York, NY 10001'
    };

    // Mock Data
    const heartRateData = {
        labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'],
        datasets: [
            {
                label: 'Heart Rate (BPM)',
                data: [72, 75, 78, 85, 82, 76],
                borderColor: '#66BB6A',
                backgroundColor: 'rgba(102, 187, 106, 0.2)',
                tension: 0.4,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#66BB6A',
                pointBorderWidth: 2,
                fill: true
            }
        ]
    };

    const spo2Data = {
        labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'],
        datasets: [
            {
                label: 'SpO2 (%)',
                data: [98, 97, 98, 99, 98, 98],
                borderColor: '#64B5F6',
                backgroundColor: 'rgba(100, 181, 246, 0.2)',
                tension: 0.4,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#64B5F6',
                pointBorderWidth: 2,
                fill: true
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                grid: {
                    color: '#f1f5f9',
                    drawBorder: false,
                },
                ticks: {
                    color: '#64748b',
                    font: { family: 'Inter' }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#64748b',
                    font: { family: 'Inter' }
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Patient Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 text-gray-500 hover:text-lifelink-primary hover:bg-gray-50 rounded-lg transition-colors"
                            title="Back to Patient List"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    )}
                    <div className="h-12 w-12 rounded-full bg-lifelink-primary/10 flex items-center justify-center text-lifelink-primary font-bold text-xl">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{patientName}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>ID: {patientIdDisplay}</span>
                            {patientEmail && (
                                <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        <span>{patientEmail}</span>
                                    </div>
                                </>
                            )}
                            {patientPhone && (
                                <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        <span>{patientPhone}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-lifelink-primary font-medium mt-1">
                            <span className="w-2 h-2 rounded-full bg-lifelink-primary animate-pulse"></span>
                            <span className="text-sm">Live Monitoring Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-lifelink-secondary hover:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95">Generate OpenAI Summary</button>
                </div>
            </div>

            {/* Patient Info & Location */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Patient Location */}
                {dataSharingSettings.location && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-500" />
                            Current Location
                        </h3>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">{mockLocation.address}</p>
                            <p className="text-xs text-gray-500">Lat: {mockLocation.lat}, Lng: {mockLocation.lng}</p>
                            <div className="bg-blue-50 p-3 rounded-lg mt-3">
                                <p className="text-xs text-blue-800">📍 Location shared for emergency response</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Medical History */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Medical History</h3>
                        <button
                            onClick={() => setIsEditingHistory(!isEditingHistory)}
                            className="p-2 text-gray-500 hover:text-lifelink-primary transition-colors"
                        >
                            {isEditingHistory ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                        </button>
                    </div>
                    {isEditingHistory ? (
                        <div className="space-y-3">
                            <textarea
                                value={medicalHistory}
                                onChange={(e) => setMedicalHistory(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                                rows={4}
                                placeholder="Enter medical history, allergies, medications..."
                            />
                            <button
                                onClick={saveMedicalHistory}
                                className="px-4 py-2 bg-lifelink-primary text-white rounded-lg text-sm hover:bg-green-600"
                            >
                                Save History
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600">
                            {medicalHistory || (
                                <p className="text-gray-400 italic">No medical history recorded. Click edit to add.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Emergency Contacts */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Emergency Contacts</h3>
                        <button
                            onClick={() => setIsEditingContacts(!isEditingContacts)}
                            className="p-2 text-gray-500 hover:text-lifelink-primary transition-colors"
                        >
                            {isEditingContacts ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                        </button>
                    </div>
                    {isEditingContacts ? (
                        <div className="space-y-3">
                            <textarea
                                value={emergencyContacts}
                                onChange={(e) => setEmergencyContacts(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                                rows={4}
                                placeholder="Name: John Doe\nRelation: Spouse\nPhone: +1 (555) 123-4567\n\nName: Jane Smith\nRelation: Sister\nPhone: +1 (555) 987-6543"
                            />
                            <button
                                onClick={saveEmergencyContacts}
                                className="px-4 py-2 bg-lifelink-primary text-white rounded-lg text-sm hover:bg-green-600"
                            >
                                Save Contacts
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600 whitespace-pre-line">
                            {emergencyContacts || (
                                <p className="text-gray-400 italic">No emergency contacts recorded. Click edit to add.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <VitalCard icon={<Heart />} color="text-red-500" label="Heart Rate" value="76" unit="bpm" trend="+2%" trendColor="red" />
                <VitalCard icon={<Activity />} color="text-lifelink-secondary" label="Blood Pressure" value="120/80" unit="mmHg" trend="Normal" trendColor="blue" />
                <VitalCard icon={<Wind />} color="text-lifelink-primary" label="SpO2" value="98" unit="%" trend="-1%" trendColor="green" />
                <VitalCard icon={<Thermometer />} color="text-lifelink-warning" label="Temp" value="98.6" unit="°F" trend="Stable" trendColor="orange" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Heart Rate History</h3>
                        <span className="bg-lifelink-card text-lifelink-primary px-3 py-1 rounded-full text-xs font-bold">Live</span>
                    </div>
                    <Line data={heartRateData} options={options} />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Oxygen Saturation</h3>
                        <span className="bg-lifelink-card text-lifelink-primary px-3 py-1 rounded-full text-xs font-bold">Live</span>
                    </div>
                    <Line data={spo2Data} options={options} />
                </div>
            </div>
        </div>
    );
};

const VitalCard = ({ icon, color, label, value, unit, trend, trendColor }: { icon: React.ReactNode, color: string, label: string, value: string, unit: string, trend: string, trendColor: string }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform ${color}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${trendColor}-50 text-${trendColor}-600`}>{trend}</span>
        </div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
            <span className="text-sm text-slate-400 font-medium">{unit}</span>
        </div>
    </div>
);

export default RPMPatientDashboard;