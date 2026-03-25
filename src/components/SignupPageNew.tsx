import React, { useState } from 'react';
import {  User, Mail, Phone, Shield, Stethoscope } from 'lucide-react';
import { authService } from '../services/AuthService';

interface SignupPageProps {
  onBack: () => void;
  onSuccess: () => void;
  navigateTo: (view: 'landing' | 'signup' | 'signin' | 'forgot-password' | 'rpm' | 'map' | 'chat' | 'ambulance' | 'hospital-registration' | 'cameras' | 'd2d-chat' | 'hospital-management') => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSuccess, navigateTo }) => {
  const [userType, setUserType] = useState<'doctor' | 'staff' | 'patient'>('patient');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    country: '',
    medicalId: '',
    doctorId: '',
    staffType: '',
    vehicleNumber: '',
    junctionId: '',
    badgeNumber: '',
    shift: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const countryMedicalIds = {
    'India': 'NMR ID',
    'USA': 'NPI Number',
    'UK': 'GMC Number',
    'Canada': 'CPSO Number',
    'Australia': 'AHPRA Number'
  };

  const staffTypes = [
    'Nurse',
    'Ambulance Staff',
    'Pharmacist',
    'Receptionist',
    'Lab Technician'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';

    if (userType === 'doctor') {
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.medicalId.trim()) newErrors.medicalId = `${countryMedicalIds[formData.country as keyof typeof countryMedicalIds] || 'Medical ID'} is required`;
    }

    if (userType === 'staff') {
      if (!formData.doctorId.trim()) newErrors.doctorId = 'Hospital ID is required';
      if (!formData.staffType) newErrors.staffType = 'Staff type is required';
      if (formData.staffType === 'Ambulance Staff' && !formData.vehicleNumber.trim()) {
        newErrors.vehicleNumber = 'Vehicle number is required for ambulance staff';
      }
      if (!formData.shift) newErrors.shift = 'Shift timing is required for hospital staff';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload: any = {
        ...formData,
        userType: userType as 'doctor' | 'staff' | 'patient'
      };
      if (formData.shift) {
        payload.shift = formData.shift as 'Morning' | 'Evening' | 'Night';
      }
      const success = await authService.signup(payload);

      if (success) {
        navigateTo('signin');
      } else {
        setErrors({ submit: 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred during registration.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-lifelink-bg flex items-center justify-center px-4 transition-all duration-300">
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-lifelink-text mb-2">Healthcare Provider Signup</h1>
          <p className="text-gray-600">Join the Docent emergency network</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300">
          {/* Role Selection - Spans full width if grid */}
          {/* Role Selection - Spans full width if grid */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-lifelink-text mb-3">Select Your Category</label>
            <div className="grid gap-3 grid-cols-2 mb-6">
              {[
                { key: 'doctor', widthKey: ['doctor', 'staff'], label: 'Hospital Staff', icon: <Stethoscope className="h-4 w-4" /> },
                { key: 'patient', widthKey: ['patient'], label: 'Patient', icon: <User className="h-4 w-4" /> }
              ].map(({ key, widthKey, label, icon }) => {
                const isActive = widthKey.includes(userType);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      // Default to doctor if clicking Hospital Staff, otherwise the key itself
                      const newType = key === 'doctor' ? 'doctor' : key as any;
                      setUserType(newType);
                      setFormData(prev => ({ ...prev, country: '', medicalId: '', doctorId: '', staffType: '', vehicleNumber: '', junctionId: '', badgeNumber: '', shift: '' }));
                    }}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors flex flex-col md:flex-row items-center justify-center gap-2 ${isActive
                        ? 'border-lifelink-primary bg-lifelink-primary/10 text-lifelink-primary'
                        : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    {icon}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Sub-Role Dropdown for Hospital Staff */}
            {(userType === 'doctor' || userType === 'staff') && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Specific Hospital Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'doctor', label: 'Doctor' },
                    { id: 'staff', label: 'Health Staff' }
                  ].map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setUserType(role.id as any);
                        setErrors({}); // Clear errors when switching sub-roles
                      }}
                      className={`py-2 px-3 rounded text-sm font-medium transition-all ${userType === role.id
                          ? 'bg-white text-lifelink-primary shadow border-t-2 border-lifelink-primary'
                          : 'text-slate-500 hover:bg-white/50'
                        }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            )}



            {errors.userType && <p className="text-red-500 text-sm mt-1">{errors.userType}</p>}
          </div>

          {/* Basic Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-lifelink-text mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                  placeholder="Enter username"
                />
              </div>
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-lifelink-text mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-lifelink-text mb-2">Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-lifelink-text mb-2">Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Doctor-specific fields */}
          {userType === 'doctor' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-lifelink-text mb-2">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                >
                  <option value="">Select Country</option>
                  {Object.keys(countryMedicalIds).map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
              </div>

              {formData.country && (
                <div>
                  <label className="block text-sm font-medium text-lifelink-text mb-2">
                    {countryMedicalIds[formData.country as keyof typeof countryMedicalIds]}
                  </label>
                  <input
                    type="text"
                    value={formData.medicalId}
                    onChange={(e) => handleInputChange('medicalId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                    placeholder={`Enter ${countryMedicalIds[formData.country as keyof typeof countryMedicalIds]}`}
                  />
                  {errors.medicalId && <p className="text-red-500 text-sm mt-1">{errors.medicalId}</p>}
                </div>
              )}
            </div>
          )}

          {/* Nurse/Staff fields */}
          {userType === 'staff' && (
            <div>
              <label className="block text-sm font-medium text-lifelink-text mb-2">Hospital ID</label>
              <input
                type="text"
                value={formData.doctorId}
                onChange={(e) => handleInputChange('doctorId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                placeholder="Enter Hospital ID (HOSP-XXXXXX)"
              />
              <p className="text-xs text-gray-500 mt-1">Get this ID from your hospital administrator</p>
              {errors.doctorId && <p className="text-red-500 text-sm mt-1">{errors.doctorId}</p>}
            </div>
          )}

          {/* Staff type selection */}
          {userType === 'staff' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-lifelink-text mb-2">Staff Type</label>
                <select
                  value={formData.staffType}
                  onChange={(e) => handleInputChange('staffType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                >
                  <option value="">Select Staff Type</option>
                  {staffTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.staffType && <p className="text-red-500 text-sm mt-1">{errors.staffType}</p>}
              </div>

              {formData.staffType === 'Ambulance Staff' && (
                <div>
                  <label className="block text-sm font-medium text-lifelink-text mb-2">Vehicle Number / Registration</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                    placeholder="Enter vehicle registration number"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the ambulance vehicle registration number</p>
                  {errors.vehicleNumber && <p className="text-red-500 text-sm mt-1">{errors.vehicleNumber}</p>}
                </div>
              )}

              {/* Shift Selection for Staff */}
              <div>
                <label className="block text-sm font-medium text-lifelink-text mb-2">Shift</label>
                <select
                  value={formData.shift}
                  onChange={(e) => handleInputChange('shift', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                >
                  <option value="">Select Shift</option>
                  <option value="Morning">Morning Shift (8 AM - 4 PM)</option>
                  <option value="Evening">Evening Shift (4 PM - 12 AM)</option>
                  <option value="Night">Night Shift (12 AM - 8 AM)</option>
                </select>
                {errors.shift && <p className="text-red-500 text-sm mt-1">{errors.shift}</p>}
              </div>
            </div>
          )}

          {/* Patient doctor ID field */}
          {userType === 'patient' && (
            <div>
              <label className="block text-sm font-medium text-lifelink-text mb-2">Doctor ID (Optional)</label>
              <input
                type="text"
                value={formData.doctorId}
                onChange={(e) => handleInputChange('doctorId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                placeholder="DR-XXXXXX-XXX"
              />
              <p className="text-xs text-gray-500 mt-1">Enter your doctor's unique ID to link your account</p>
            </div>
          )}



          <div className="md:col-span-2">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-lifelink-primary text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;