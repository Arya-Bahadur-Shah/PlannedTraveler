import React from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TravelerDashboard from './TravelerDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden">
        {user?.role === 'USER' ? <TravelerDashboard /> : <AdminDashboard />}
      </main>
    </div>
  );
};

export default Dashboard;