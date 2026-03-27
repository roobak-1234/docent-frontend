import React, { useState, useEffect } from 'react';
import { CheckCircle, User, Users, Calendar, ArrowRight } from 'lucide-react';
import { authService } from '../services/AuthService';

const StaffDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  if (!currentUser || currentUser.userType !== 'staff') {
    return <div>Access denied. Staff account required.</div>;
  }

  return (
    <div className="min-h-screen bg-docent-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-docent-text mb-4">Registration Successful!</h1>
        <p className="text-gray-600 mb-6">
          Welcome to the Docent emergency network, {currentUser.username}.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Account Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{currentUser.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium flex items-center gap-1">
                <Users className="h-4 w-4" />
                {currentUser.staffType || 'Staff'}
              </span>
            </div>
            {currentUser.doctorId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Supervising Doctor:</span>
                <span className="font-medium font-mono">{currentUser.doctorId}</span>
              </div>
            )}
            {currentUser.phone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{currentUser.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">What's Next?</h4>
          <p className="text-blue-700 text-sm">
            Your account has been successfully created. Please contact your supervising doctor 
            or hospital administrator for further instructions and access permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => window.location.href = '/leave-management'}
            className="w-full py-4 bg-docent-primary text-white rounded-2xl font-black shadow-xl shadow-green-500/20 hover:bg-green-600 transition-all flex items-center justify-center gap-2 group"
          >
            <Calendar className="h-5 w-5" />
            Apply for Leave
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <div className="mt-8 text-xs text-gray-400 font-medium">
          Account created on {new Date(currentUser.createdAt).toLocaleDateString()} • Authorized Cloud Record
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;