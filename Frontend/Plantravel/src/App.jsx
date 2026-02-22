import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BlogFeed from './pages/BlogFeed';
import CalendarPlanner from './pages/planner/CalendarPlanner';
import BudgetInput from './pages/planner/BudgetInput';
import ItineraryEditor from './pages/planner/ItineraryEditor';
import MapPage from './pages/planner/MapPage';
import CreateBlog from './pages/community/CreateBlog';
import UserManagement from './pages/admin/UserManagement';

// Components
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  const { user } = useAuth();
  const location = useLocation();
  const hideSidebar = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <div className="flex">
      {!hideSidebar && user && <Sidebar />}
      
      <main className={`flex-1 w-full min-h-screen transition-all duration-500 ${(!hideSidebar && user) ? 'pl-20 md:pl-64' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/blogs" element={<BlogFeed />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><CalendarPlanner /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute><BudgetInput /></ProtectedRoute>} />
          <Route path="/itinerary-editor" element={<ProtectedRoute><ItineraryEditor /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/create-blog" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;