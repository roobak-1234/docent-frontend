import React, { useState } from 'react';
import { Heart, User, Lock, ArrowLeft } from 'lucide-react';
import { authService } from '../services/AuthService';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.resetPassword(
        formData.username,
        userType,
        formData.newPassword
      );

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('An error occurred during password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-docent-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="bg-green-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <Heart className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-docent-text mb-4">Password Reset Successful</h1>
            <p className="text-gray-600 mb-6">Your password has been updated successfully.</p>
            <button
              onClick={onBack}
              className="w-full bg-docent-primary text-white py-3 rounded-lg hover:bg-green-600"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-docent-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="flex items-center text-docent-text hover:text-docent-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sign In
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="bg-docent-primary p-3 rounded-lg w-fit mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-docent-text">Reset Password</h1>
            <p className="text-gray-600">Enter your username and new password</p>
          </div>

          {!userType ? (
            <div className="space-y-4">
              <button
                onClick={() => setUserType('doctor')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-docent-primary hover:bg-docent-card transition-colors text-left"
              >
                <h3 className="font-semibold text-docent-text">Doctor Account</h3>
                <p className="text-sm text-gray-600">Reset password for doctor account</p>
              </button>
              <button
                onClick={() => setUserType('patient')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-docent-primary hover:bg-docent-card transition-colors text-left"
              >
                <h3 className="font-semibold text-docent-text">Patient Account</h3>
                <p className="text-sm text-gray-600">Reset password for patient account</p>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-docent-text">
                  Reset {userType === 'doctor' ? 'Doctor' : 'Patient'} Password
                </h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-docent-text mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-docent-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-docent-text mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-docent-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-docent-text mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-docent-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setUserType(null)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-docent-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;