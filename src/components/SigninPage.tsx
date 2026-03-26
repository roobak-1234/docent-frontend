import React, { useState } from 'react';
import { Heart, Mail, Lock,  Loader2, AlertTriangle } from 'lucide-react';
import { authService } from '../services/AuthService';

interface SigninPageProps {
  onBack: () => void;
  onSuccess: () => void;
  onForgotPassword: () => void;
  onSignup: () => void;
}

const SigninPage: React.FC<SigninPageProps> = ({ onBack, onSuccess, onForgotPassword, onSignup }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.signin(formData);
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('An error occurred during signin');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-docent-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-docent-secondary/5 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-br from-docent-primary to-green-500 p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg shadow-green-500/20">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-500">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-docent-primary transition-colors">
                <Mail size={20} />
              </div>
              <input
                type="text"
                name="username"
                placeholder="Username or Email"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-docent-primary/20 focus:border-docent-primary outline-none transition-all font-medium"
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-docent-primary transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-docent-primary/20 focus:border-docent-primary outline-none transition-all font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-docent-primary text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account? <span className="text-docent-primary font-bold cursor-pointer hover:underline" onClick={onSignup}>Sign Up</span>
            </p>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-docent-primary hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;