import React from 'react';
import { useAuth } from '../context/AuthContext';
import TravelerDashboard from './TravelerDashboard';
import AdminDashboard from './AdminDashboard';

// Note: Sidebar and LiveNotifications are rendered by App.jsx — no need to duplicate here.
const Dashboard = () => {
  const { user } = useAuth();
  return user?.role === 'USER' ? <TravelerDashboard /> : <AdminDashboard />;
};

export default Dashboard;