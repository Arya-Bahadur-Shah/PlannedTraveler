import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LiveNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws/notifications/');

    ws.onopen = () => {
      console.log('WS Connected');
      const token = localStorage.getItem('access_token');
      if (token) {
        ws.send(JSON.stringify({ action: 'authenticate', token }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'auth_success') return; // Ignore auth confirmation

      // Add notification to state to trigger popup
      const newNotif = {
        id: Date.now(),
        title: data.title || 'Notification',
        message: data.message,
        type: data.type || 'info' // 'info', 'warning', 'danger'
      };

      setNotifications((prev) => [newNotif, ...prev]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
      }, 5000);
    };

    ws.onclose = () => {
      console.log('WS Disconnected');
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'danger': return <AlertCircle size={20} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-yellow-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBgStyle = (type) => {
    switch (type) {
      case 'danger': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${getBgStyle(n.type)} backdrop-blur-md`}
          >
            <div className="mt-1">{getIcon(n.type)}</div>
            <div className="flex-1">
              <h4 className="font-bold text-sm leading-tight text-gray-900">{n.title}</h4>
              <p className="text-xs text-gray-700 mt-1">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default LiveNotifications;
