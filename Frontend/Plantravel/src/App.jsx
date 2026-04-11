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
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import BlogFeed from './pages/community/BlogFeed';
import CreateBlog from './pages/community/CreateBlog';
import CalendarPlanner from './pages/planner/CalendarPlanner';
import VibeSelector from './pages/planner/VibeSelector';
import BudgetInput from './pages/planner/BudgetInput';
import ItineraryEditor from './pages/planner/ItineraryEditor';
import UserManagement from './pages/admin/UserManagement';
import MapPage from './pages/planner/MapPage';
import Moderation from './pages/admin/Moderation';
import SharedItinerary from './pages/SharedItinerary';

import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LiveNotifications from './components/LiveNotifications';

const App = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const noSidebarPages = ['/', '/login', '/register', '/forgot-password'];
  const showSidebar = user && !noSidebarPages.includes(location.pathname)
    && !location.pathname.startsWith('/reset-password')
    && !location.pathname.startsWith('/share');

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      {user && <LiveNotifications />}

      <main className={`flex-1 w-full transition-all duration-500 ${showSidebar ? 'pl-20 md:pl-64' : ''}`}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          <Route path="/blogs" element={<BlogFeed />} />
          {/* Public shared itinerary — no auth required */}
          <Route path="/share/:id" element={<SharedItinerary />} />

          {/* Protected — all users */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="/create-blog" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />

          {/* Protected — planner flow (Step 1 → 2 → 3 → result) */}
          <Route path="/planner" element={<ProtectedRoute allowedRoles={['USER']}><CalendarPlanner /></ProtectedRoute>} />
          <Route path="/vibe"    element={<ProtectedRoute allowedRoles={['USER']}><VibeSelector /></ProtectedRoute>} />
          <Route path="/budget"  element={<ProtectedRoute allowedRoles={['USER']}><BudgetInput /></ProtectedRoute>} />
          <Route path="/itinerary-editor" element={<ProtectedRoute allowedRoles={['USER']}><ItineraryEditor /></ProtectedRoute>} />
          <Route path="/map"     element={<ProtectedRoute allowedRoles={['USER']}><MapPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><Moderation /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;