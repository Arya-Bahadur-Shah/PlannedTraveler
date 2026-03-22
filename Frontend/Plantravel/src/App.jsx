import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import BlogFeed from './pages/community/BlogFeed';
import CreateBlog from './pages/community/CreateBlog';
import CalendarPlanner from './pages/planner/CalendarPlanner';
import BudgetInput from './pages/planner/BudgetInput';
import ItineraryEditor from './pages/planner/ItineraryEditor';
import UserManagement from './pages/admin/UserManagement';
import MapPage from './pages/planner/MapPage';
import Moderation from './pages/admin/Moderation';

import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const noSidebarPages = ['/', '/login', '/register', '/forgot-password'];
  const showSidebar = user && !noSidebarPages.includes(location.pathname) && !location.pathname.startsWith('/reset-password');

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      
      <main className={`flex-1 w-full transition-all duration-500 ${showSidebar ? 'pl-20 md:pl-64' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          <Route path="/blogs" element={<BlogFeed />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute allowedRoles={['USER']}><CalendarPlanner /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute allowedRoles={['USER']}><BudgetInput /></ProtectedRoute>} />
          <Route path="/itinerary-editor" element={<ProtectedRoute allowedRoles={['USER']}><ItineraryEditor /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute allowedRoles={['USER']}><MapPage /></ProtectedRoute>} />
          <Route path="/create-blog" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />

          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><Moderation /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;