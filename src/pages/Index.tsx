
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/LoginForm';
import { SuperAdminDashboard } from '../components/SuperAdminDashboard';
import { GymAdminDashboard } from '../components/GymAdminDashboard';
import { MemberDashboard } from '../components/MemberDashboard';

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'superadmin':
      return <SuperAdminDashboard />;
    case 'gymadmin':
      return <GymAdminDashboard />;
    case 'member':
      return <MemberDashboard />;
    default:
      return <LoginForm />;
  }
};

export default Index;
