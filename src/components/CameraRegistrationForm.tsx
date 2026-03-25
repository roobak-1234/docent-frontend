import React, { useState } from 'react';
import { X, Camera, Shield, Monitor } from 'lucide-react';

interface CameraRegistrationFormProps {
  onClose: () => void;
  onSubmit: (camera: {
    name: string;
    location: string;
    streamUrl: string;
    isActive: boolean;
    accessLevel: 'public' | 'restricted' | 'admin';
    resolution: string;
  }) => void;
}

const CameraRegistrationForm: React.FC<CameraRegistrationFormProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    streamUrl: '',
    isActive: true,
    accessLevel: 'public' as 'public' | 'restricted' | 'admin',
    resolution: '1080p',
    streamType: 'HLS' as 'HLS' | 'RTSP' | 'WebRTC'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Camera name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.streamUrl.trim()) {
      newErrors.streamUrl = 'Stream URL is required';
    } else {
      // Basic URL validation
      try {
        new URL(formData.streamUrl);
      } catch {
        newErrors.streamUrl = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name: formData.name,
        location: formData.location,
        streamUrl: formData.streamUrl,
        isActive: formData.isActive,
        accessLevel: formData.accessLevel,
        resolution: formData.resolution
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
              <Camera className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Add New Camera</h2>
              <p className="text-sm text-slate-500">Register a new camera stream for monitoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Camera Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., ER Entrance Camera"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.location ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., Emergency Department"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            </div>
          </div>

          {/* Stream Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Stream Configuration
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Stream URL *
              </label>
              <input
                type="url"
                value={formData.streamUrl}
                onChange={(e) => handleInputChange('streamUrl', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.streamUrl ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="https://example.com/stream.m3u8"
              />
              {errors.streamUrl && <p className="text-red-500 text-sm mt-1">{errors.streamUrl}</p>}
              <p className="text-xs text-slate-500 mt-1">
                Supports HLS (.m3u8), RTSP, and WebRTC streams
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stream Type
                </label>
                <select
                  value={formData.streamType}
                  onChange={(e) => handleInputChange('streamType', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="HLS">HLS (.m3u8)</option>
                  <option value="RTSP">RTSP</option>
                  <option value="WebRTC">WebRTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resolution
                </label>
                <select
                  value={formData.resolution}
                  onChange={(e) => handleInputChange('resolution', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="4K">4K (3840x2160)</option>
                  <option value="1080p">1080p (1920x1080)</option>
                  <option value="720p">720p (1280x720)</option>
                  <option value="480p">480p (854x480)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Access
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Access Level
              </label>
              <select
                value={formData.accessLevel}
                onChange={(e) => handleInputChange('accessLevel', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="public">Public - All medical staff</option>
                <option value="restricted">Restricted - Authorized personnel only</option>
                <option value="admin">Admin - Hospital administrators only</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Determines who can view this camera feed
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Privacy & Compliance</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• All streams are encrypted using Azure Key Vault</li>
                <li>• Face detection and blurring available for HIPAA compliance</li>
                <li>• Access logs are maintained for audit purposes</li>
                <li>• Critical events are automatically recorded to Azure Blob Storage</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
            >
              Add Camera
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CameraRegistrationForm;