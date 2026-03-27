import React, { useState, useEffect } from 'react';
import { CheckCircle, User, Users } from 'lucide-react';
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
    <div className="min-h-screen bg-lifelink-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-lifelink-text mb-4">Registration Successful!</h1>
        <p className="text-gray-600 mb-6">
          Welcome to the LifeLink AI emergency network, {currentUser.username}.
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

        <div className="text-xs text-gray-500">
          Account created on {new Date(currentUser.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;