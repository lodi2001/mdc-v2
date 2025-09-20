import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardAdmin from './DashboardAdmin';
import DashboardEditor from './DashboardEditor';
import DashboardClient from './DashboardClient';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render appropriate dashboard based on user role
  // Handle both lowercase and capitalized role names
  const role = user.role?.toLowerCase();
  
  switch (role) {
    case 'admin':
      return <DashboardAdmin />;
    case 'editor':
      return <DashboardEditor />;
    case 'client':
      return <DashboardClient />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Dashboard;