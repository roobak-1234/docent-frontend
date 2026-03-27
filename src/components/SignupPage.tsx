import React, { useState } from 'react';
import { Heart, User, Mail, Lock, Phone, ArrowLeft, Stethoscope, Loader2, AlertTriangle } from 'lucide-react';
import { authService } from '../services/AuthService';

interface SignupPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSuccess }) => {
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    doctorId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return;

    setLoading(true);
    setError('');

    try {
      const response = await authService.signup({
        ...formData,
        userType
      });

      if (response.success) {
        if (userType === 'doctor' && response.user?.uniqueDoctorId) {
          alert(`Registration successful! Your unique Doctor ID is: ${response.user.uniqueDoctorId}\n\nShare this ID with patients for registration.`);
        }
        onSuccess();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-lifelink-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-lifelink-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-lifelink-secondary/5 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <button
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-lifelink-primary mb-8 font-medium transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-br from-lifelink-primary to-green-500 p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg shadow-green-500/20">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Join LifeLink AI</h1>
            <p className="text-slate-500">Begin your journey to smarter healthcare</p>
          </div>

          {!userType ? (
            <div className="space-y-4">
              <button
                onClick={() => setUserType('doctor')}
                className="w-full p-6 border-2 border-slate-100 rounded-2xl hover:border-lifelink-primary hover:bg-lifelink-card transition-all text-left group"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-6 h-6 text-lifelink-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Healthcare Provider</h3>
                    <p className="text-sm text-slate-500">Doctor, Nurse, or EMT</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setUserType('patient')}
                className="w-full p-6 border-2 border-slate-100 rounded-2xl hover:border-lifelink-primary hover:bg-lifelink-card transition-all text-left group"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    <User className="w-6 h-6 text-lifelink-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Patient</h3>
                    <p className="text-sm text-slate-500">Monitor personal health</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
              <div className="text-center mb-6">
                <span className="px-4 py-1.5 bg-slate-100 rounded-full text-sm font-semibold text-slate-600">
                  {userType === 'doctor' ? 'Doctor Registration' : 'Patient Registration'}
                </span>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <InputGroup icon={<User />} name="username" placeholder="Full Name" value={formData.username} onChange={handleInputChange} required />
              <InputGroup icon={<Mail />} name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required />
              <InputGroup icon={<Lock />} name="password" type="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
              <InputGroup icon={<Phone />} name="phone" type="tel" placeholder="Phone Number (Optional)" value={formData.phone} onChange={handleInputChange} />

              {userType === 'patient' && (
                <InputGroup icon={<Stethoscope />} name="doctorId" placeholder="Doctor's ID Code (Optional)" value={formData.doctorId} onChange={handleInputChange} />
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setUserType(null)}
                  className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-lifelink-primary text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ icon, ...props }: any) => (
  <div className="relative group">
    <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-lifelink-primary transition-colors">
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <input
      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-lifelink-primary/20 focus:border-lifelink-primary outline-none transition-all font-medium"
      {...props}
    />
  </div>
);

export default SignupPage;