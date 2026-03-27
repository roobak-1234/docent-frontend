import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Building2, Phone, Mail, MapPin, Bed, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import AzureMapsPicker from './AzureMapsPicker';
import { HospitalRegistrationData } from '../types/fhirOrganizationSchema';
import { hospitalService } from '../services/hospitalService';
import { authService } from '../services/AuthService';

const schema = yup.object().shape({
  name: yup.string().required('Hospital name is required').min(3, 'Name must be at least 3 characters'),
  type: yup.string().oneOf(['Private', 'Government', 'Clinic']).required('Hospital type is required'),
  phone: yup.string().matches(/^\+?[\d\s-()]+$/, 'Invalid phone format').optional(),
  emergencyEmail: yup.string().email('Invalid email').optional(),
  adminContact: yup.string().required('Admin contact is required'),
  address: yup.string().required('Address is required'),
  latitude: yup.number().required('Location coordinates required'),
  longitude: yup.number().required('Location coordinates required'),
  icuBeds: yup.number().min(0, 'Cannot be negative').required('ICU beds count required'),
  hduBeds: yup.number().min(0, 'Cannot be negative').required('HDU beds count required'),
  isolationBeds: yup.number().min(0, 'Cannot be negative').required('Isolation beds count required'),
  nicuBeds: yup.number().min(0, 'Cannot be negative').required('NICU beds count required'),
  picuBeds: yup.number().min(0, 'Cannot be negative').required('PICU beds count required'),
  ventilators: yup.number().min(0, 'Cannot be negative').required('Ventilator count required'),
  otStatus: yup.string().oneOf(['Available', 'Occupied', 'Maintenance']).required('OT status required'),
  accreditation: yup.string().optional(),
  globalId: yup.string().optional(),
  specializations: yup.object().shape({
    traumaLevel1: yup.boolean().required(),
    cardiacCenter: yup.boolean().required(),
    pediatricEmergency: yup.boolean().required(),
    infectiousDisease: yup.boolean().required(),
    maternalFetal: yup.boolean().required(),
    strokeCenter: yup.boolean().required(),
    mentalHealth: yup.boolean().required()
  }),
  ambulanceIds: yup.array().of(yup.string().required()).optional()
});

interface HospitalRegistrationProps {
  onBack: () => void;
}

const HospitalRegistration: React.FC<HospitalRegistrationProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [capabilitySummary, setCapabilitySummary] = useState('');

  const { control, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<HospitalRegistrationData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      specializations: {
        traumaLevel1: false,
        cardiacCenter: false,
        pediatricEmergency: false,
        infectiousDisease: false,
        maternalFetal: false,
        strokeCenter: false,
        mentalHealth: false
      },
      ambulanceIds: []
    }
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.userType === 'doctor') {
      setValue('adminContact', currentUser.username);
    }
  }, [setValue]);

  const watchedData = watch();

  const steps = [
    { title: 'Facility Identity', icon: Building2 },
    { title: 'Contact & Location', icon: MapPin },
    { title: 'Capacity & Specializations', icon: Bed },
    { title: 'Review & Submit', icon: CheckCircle }
  ];

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof HospitalRegistrationData)[] => {
    switch (step) {
      case 1: return ['name', 'type'];
      case 2: return ['adminContact', 'address', 'latitude', 'longitude'];
      case 3: return ['icuBeds', 'hduBeds', 'isolationBeds', 'nicuBeds', 'picuBeds', 'ventilators', 'otStatus'];
      default: return [];
    }
  };

  const onSubmit = async (data: HospitalRegistrationData) => {
    setIsSubmitting(true);
    try {
      // Generate unique hospital ID using hospital name
      const hospitalNamePrefix = data.name
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
        .substring(0, 4) // Take first 4 characters
        .toUpperCase();
      const timestamp = Date.now().toString().slice(-4);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const hospitalId = `${hospitalNamePrefix}-${timestamp}-${random}`;
      
      const registrationData = {
        ...data,
        hospitalId: hospitalId // Set the generated ID
      };

      const result = await hospitalService.registerHospital(registrationData);
      
      if (result.success) {
        // Store hospital with unique ID
        const hospitals = JSON.parse(localStorage.getItem('registered_hospitals') || '[]');
        const hospitalWithId = {
          ...registrationData,
          uniqueHospitalId: hospitalId,
          id: Date.now().toString(),
          registeredAt: new Date().toISOString(),
          adminContact: authService.getCurrentUser()?.username || data.adminContact
        };
        hospitals.push(hospitalWithId);
        localStorage.setItem('registered_hospitals', JSON.stringify(hospitals));
        
        const summary = await hospitalService.generateCapabilitySummary(registrationData);
        setCapabilitySummary(`Hospital ID: ${hospitalId}\n\n${summary}`);
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-lifelink-bg flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-lifelink-text mb-4">Hospital Registered Successfully!</h1>
          <p className="text-gray-600 mb-6">Your hospital has been added to the LifeLink AI emergency network.</p>
          
          {capabilitySummary && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">AI-Generated Capability Summary</h3>
              <p className="text-blue-800 text-sm">{capabilitySummary}</p>
              <p className="text-xs text-blue-600 mt-2">This summary will be shown to paramedics for optimal patient routing.</p>
            </div>
          )}
          
          <button
            onClick={onBack}
            className="bg-lifelink-primary text-white px-6 py-3 rounded-lg hover:bg-green-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lifelink-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center text-lifelink-text hover:text-lifelink-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;

              return (
                <div key={stepNumber} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive ? 'border-lifelink-primary bg-lifelink-primary text-white' :
                    isCompleted ? 'border-green-500 bg-green-500 text-white' :
                    'border-gray-300 bg-white text-gray-400'
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isActive ? 'text-lifelink-primary' : 'text-gray-500'}`}>
                      Step {stepNumber}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-lifelink-text' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                  </div>
                  {stepNumber < steps.length && (
                    <div className={`w-16 h-0.5 ml-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Step 1: Facility Identity */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-lifelink-text mb-6">Facility Identity</h2>
              
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-lifelink-text mb-2">Hospital Name</label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                      placeholder="City General Hospital"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                )}
              />

              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-lifelink-text mb-2">Hospital Type</label>
                    <select
                      {...field}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                    >
                      <option value="">Select type</option>
                      <option value="Private">Private Hospital</option>
                      <option value="Government">Government Hospital</option>
                      <option value="Clinic">Clinic</option>
                    </select>
                    {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
                  </div>
                )}
              />
            </div>
          )}

          {/* Step 2: Contact & Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-lifelink-text mb-6">Contact & Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-lifelink-text mb-2">Emergency Phone (Optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          {...field}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="emergencyEmail"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-lifelink-text mb-2">Emergency Desk Email (Optional)</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          {...field}
                          type="email"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                          placeholder="emergency@hospital.com"
                        />
                      </div>
                      {errors.emergencyEmail && <p className="text-red-500 text-sm mt-1">{errors.emergencyEmail.message}</p>}
                    </div>
                  )}
                />
              </div>

              <Controller
                name="adminContact"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-lifelink-text mb-2">Admin Contact Name</label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                      placeholder="Dr. John Smith"
                    />
                    {errors.adminContact && <p className="text-red-500 text-sm mt-1">{errors.adminContact.message}</p>}
                  </div>
                )}
              />

              <Controller
                name="globalId"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-lifelink-text mb-2">Global Identifier (Optional)</label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                      placeholder="NPI, OID, or international ID"
                    />
                    <p className="text-xs text-gray-500 mt-1">International identifier for system interoperability</p>
                  </div>
                )}
              />

              <Controller
                name="accreditation"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-lifelink-text mb-2">Accreditation Status (Optional)</label>
                    <select
                      {...field}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                    >
                      <option value="">Select accreditation</option>
                      <option value="JCI">JCI (Joint Commission International)</option>
                      <option value="ISO">ISO 9001</option>
                      <option value="NABH">NABH (India)</option>
                      <option value="ACHSI">ACHSI (Australia)</option>
                      <option value="Other">Other International</option>
                    </select>
                  </div>
                )}
              />

              <div>
                <label className="block text-sm font-medium text-lifelink-text mb-2">Hospital Location</label>
                <AzureMapsPicker
                  onLocationSelect={(location) => {
                    setValue('address', location.address);
                    setValue('latitude', location.lat);
                    setValue('longitude', location.lng);
                  }}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Capacity & Specializations */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-lifelink-text mb-6">Critical Care Capacity & Equipment</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Controller
                  name="icuBeds"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-lifelink-text mb-2">ICU Beds</label>
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                        placeholder="12"
                      />
                      {errors.icuBeds && <p className="text-red-500 text-sm mt-1">{errors.icuBeds.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="hduBeds"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-lifelink-text mb-2">HDU Beds</label>
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                        placeholder="8"
                      />
                      <p className="text-xs text-gray-500 mt-1">High Dependency Unit</p>
                      {errors.hduBeds && <p className="text-red-500 text-sm mt-1">{errors.hduBeds.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="isolationBeds"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-lifelink-text mb-2">Isolation Beds</label>
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                        placeholder="4"
                      />
                      <p className="text-xs text-gray-500 mt-1">Negative pressure rooms</p>
                      {errors.isolationBeds && <p className="text-red-500 text-sm mt-1">{errors.isolationBeds.message}</p>}
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Controller
                  name="nicuBeds"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-lifelink-text mb-2">NICU Beds</label>
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                        placeholder="6"
                      />
                      <p className="text-xs text-gray-500 mt-1">Neonatal ICU</p>
                      {errors.nicuBeds && <p className="text-red-500 text-sm mt-1">{errors.nicuBeds.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="picuBeds"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-lifelink-text mb-2">PICU Beds</label>
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                        placeholder="4"
                      />
                      <p className="text-xs text-gray-500 mt-1">Pediatric ICU</p>
                      {errors.picuBeds && <p className="text-red-500 text-sm mt-1">{errors.picuBeds.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="ventilators"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-lifelink-text mb-2">Ventilators</label>
                      <input
                        {...field}
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                        placeholder="10"
                      />
                      <p className="text-xs text-gray-500 mt-1">Available ventilators</p>
                      {errors.ventilators && <p className="text-red-500 text-sm mt-1">{errors.ventilators.message}</p>}
                    </div>
                  )}
                />
              </div>

              <Controller
                name="otStatus"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-lifelink-text mb-2">Operating Theater Status</label>
                    <select
                      {...field}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                    >
                      <option value="">Select status</option>
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Under Maintenance</option>
                    </select>
                    {errors.otStatus && <p className="text-red-500 text-sm mt-1">{errors.otStatus.message}</p>}
                  </div>
                )}
              />

              <div>
                <label className="block text-sm font-medium text-lifelink-text mb-4">Medical Specializations & Centers</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'traumaLevel1', label: 'Trauma Level 1', desc: 'Comprehensive trauma care' },
                    { key: 'cardiacCenter', label: 'Cardiac Center', desc: 'Heart surgery & interventions' },
                    { key: 'strokeCenter', label: 'Stroke Center', desc: 'Neurological emergency care' },
                    { key: 'pediatricEmergency', label: 'Pediatric Emergency', desc: 'Children emergency care' },
                    { key: 'infectiousDisease', label: 'Infectious Disease', desc: 'Isolation & outbreak management' },
                    { key: 'maternalFetal', label: 'Maternal-Fetal Medicine', desc: 'High-risk pregnancy care' },
                    { key: 'mentalHealth', label: 'Mental Health', desc: 'Psychiatric emergency services' }
                  ].map(({ key, label, desc }) => (
                    <Controller
                      key={key}
                      name={`specializations.${key as keyof HospitalRegistrationData['specializations']}`}
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 text-lifelink-primary border-gray-300 rounded focus:ring-lifelink-primary mt-1"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                            <p className="text-xs text-gray-500">{desc}</p>
                          </div>
                        </label>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Controller
                name="ambulanceIds"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-lifelink-text mb-2">Ambulance Fleet IDs or Vehicle Registration Numbers (Optional)</label>
                    <input
                      value={field.value?.join(', ') || ''}
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input.trim()) {
                          // Check if input contains registration numbers (letters + numbers)
                          const values = input.split(',').map(v => v.trim()).filter(Boolean);
                          const processedValues = values.map(value => {
                            // If it looks like a registration number (contains letters), generate fleet ID
                            if (/[A-Za-z]/.test(value) && !/^AMB-/.test(value)) {
                              return `AMB-${value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}`;
                            }
                            return value;
                          });
                          field.onChange(processedValues);
                        } else {
                          field.onChange([]);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
                      placeholder="AMB-001, ABC123, XYZ789 or registration numbers"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter Fleet IDs (AMB-001) or Vehicle Registration Numbers (ABC123). Registration numbers will be auto-converted to Fleet IDs.</p>
                  </div>
                )}
              />
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-lifelink-text mb-6">Review & Submit</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Hospital Name:</strong> {watchedData.name}</div>
                  <div><strong>Type:</strong> {watchedData.type}</div>
                  <div><strong>Phone:</strong> {watchedData.phone || 'Not provided'}</div>
                  <div><strong>Email:</strong> {watchedData.emergencyEmail || 'Not provided'}</div>
                  <div><strong>Admin:</strong> {watchedData.adminContact}</div>
                  <div><strong>ICU Beds:</strong> {watchedData.icuBeds}</div>
                  <div><strong>HDU Beds:</strong> {watchedData.hduBeds}</div>
                  <div><strong>Isolation Beds:</strong> {watchedData.isolationBeds}</div>
                  <div><strong>NICU Beds:</strong> {watchedData.nicuBeds}</div>
                  <div><strong>PICU Beds:</strong> {watchedData.picuBeds}</div>
                  <div><strong>Ventilators:</strong> {watchedData.ventilators}</div>
                  <div><strong>OT Status:</strong> {watchedData.otStatus}</div>
                  {watchedData.accreditation && <div><strong>Accreditation:</strong> {watchedData.accreditation}</div>}
                  {watchedData.globalId && <div><strong>Global ID:</strong> {watchedData.globalId}</div>}
                </div>
                
                {watchedData.address && (
                  <div className="text-sm">
                    <strong>Address:</strong> {watchedData.address}
                  </div>
                )}

                <div className="text-sm">
                  <strong>Specializations:</strong> {
                    Object.entries(watchedData.specializations || {})
                      .filter(([_, value]) => value)
                      .map(([key]) => key.replace(/([A-Z])/g, ' $1'))
                      .join(', ') || 'None'
                  }
                </div>

                {watchedData.ambulanceIds && watchedData.ambulanceIds.length > 0 && (
                  <div className="text-sm">
                    <strong>Ambulance Fleet:</strong> {watchedData.ambulanceIds.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-6 py-2 bg-lifelink-primary text-white rounded-lg hover:bg-green-600"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 bg-lifelink-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Register Hospital'}
                <CheckCircle className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalRegistration;