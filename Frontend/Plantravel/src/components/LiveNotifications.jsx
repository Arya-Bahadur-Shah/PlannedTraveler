/**
 * @file LiveNotifications.jsx
 * @description Global notification system combining REST polling and WebSocket push.
 *
 * Architecture:
 * - On mount, fetches the full notification history from GET /api/notifications/
 * - Opens a persistent WebSocket at ws://localhost:8000/ws/notifications/
 * - The WS channel is authenticated by sending the JWT token after connection
 * - When backend fires group_send (on Like / Follow / Budget alerts), the WS message 
 *   becomes an ephemeral animated "toast" that auto-dismisses after 4s
 * - The bell icon in the fixed header shows the count of unread notifications
 * - Clicking the bell opens a slide-in history panel with mark-as-read and delete
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Info, AlertCircle, Trash2, CheckCheck, BellOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * LiveNotifications — Renders the notification bell, slide-in panel,
 * and animated toast pop-ups. Mount this once globally in App.jsx.
 */
const LiveNotifications = () => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);          // ephemeral WS pop-ups
  const [notifications, setNotifications] = useState([]); // persistent REST list
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const panelRef = useRef(null);

  /** Count of unread notifications shown as badge on the bell icon */
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Fetch persistent notifications ──
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('notifications/');
      setNotifications(res.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── WebSocket for live toasts ──
  useEffect(() => {
    if (!user) return;
    const ws = new WebSocket('ws://localhost:8000/ws/notifications/');
    wsRef.current = ws;

    ws.onopen = () => {
      const token = localStorage.getItem('access_token');
      if (token) ws.send(JSON.stringify({ action: 'authenticate', token }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'auth_success') return;

      const newToast = {
        id: Date.now(),
        title: data.title || 'Notification',
        message: data.message,
        type: data.type || 'info',
      };
      setToasts(prev => [newToast, ...prev]);
      // Also refresh the persistent list
      fetchNotifications();

      setTimeout(() => {
        setToasts(prev => prev.filter(n => n.id !== newToast.id));
      }, 5000);
    };

    return () => ws.close();
  }, [user, fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen]);

  const removeToast = (id) => setToasts(prev => prev.filter(n => n.id !== id));

  const deleteNotification = async (id) => {
    try {
      await api.delete(`notifications/${id}/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.is_read).map(n => api.post(`notifications/${n.id}/mark_read/`))
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const clearAll = async () => {
    try {
      await Promise.all(notifications.map(n => api.delete(`notifications/${n.id}/`)));
      setNotifications([]);
    } catch { /* ignore */ }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'danger': return <AlertCircle size={16} className="text-red-500 flex-shrink-0" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />;
      default: return <Info size={16} className="text-blue-500 flex-shrink-0" />;
    }
  };

  const getToastStyle = (type) => {
    switch (type) {
      case 'danger': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getTypeAccent = (type) => {
    switch (type) {
      case 'danger': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!user) return null;

  return (
    <>
      {/* ── Ephemeral Toast Pop-ups ── */}
      <div className="fixed top-20 right-5 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border ${getToastStyle(n.type)} backdrop-blur-md`}
            >
              <div className="mt-0.5">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-sm leading-tight text-gray-900">{n.title}</h4>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
              </div>
              <button onClick={() => removeToast(n.id)} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 mt-0.5">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Bell Button ── */}
      <div className="fixed top-5 right-5 z-[9998]" ref={panelRef}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => { setPanelOpen(o => !o); if (!panelOpen) fetchNotifications(); }}
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all"
          style={{ background: 'var(--card-theme)', border: '1px solid rgba(0,0,0,0.08)' }}
          title="Notifications"
        >
          <Bell size={20} style={{ color: 'var(--text-theme)' }} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow-md"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

        {/* ── Notification Panel ── */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="absolute top-14 right-0 w-96 rounded-3xl shadow-2xl overflow-hidden"
              style={{
                background: 'var(--card-theme)',
                border: '1px solid rgba(0,0,0,0.08)',
                maxHeight: '80vh',
              }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Bell size={16} style={{ color: 'var(--primary)' }} />
                  <h3 className="font-black text-sm" style={{ color: 'var(--text-theme)' }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} title="Mark all read" className="p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100">
                      <CheckCheck size={15} style={{ color: 'var(--text-theme)' }} />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAll} title="Clear all" className="p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-50 hover:opacity-100 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  )}
                  <button onClick={() => setPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-40 hover:opacity-100">
                    <X size={15} style={{ color: 'var(--text-theme)' }} />
                  </button>
                </div>
              </div>

              {/* Panel Body */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 70px)' }}>
                {loading && (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                  </div>
                )}

                {!loading && notifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 opacity-30">
                    <BellOff size={32} className="mb-3" />
                    <p className="font-black text-sm">All clear!</p>
                    <p className="text-xs font-medium mt-1">No notifications yet.</p>
                  </div>
                )}

                {!loading && notifications.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 px-5 py-4 border-b transition-colors hover:bg-black/3 group"
                    style={{
                      borderColor: 'rgba(0,0,0,0.04)',
                      background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.04)'
                    }}
                  >
                    {/* Type dot */}
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${n.is_read ? 'bg-gray-200' : getTypeAccent(n.notification_type)}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-black text-sm leading-tight ${n.is_read ? 'opacity-60' : ''}`} style={{ color: 'var(--text-theme)' }}>
                          {n.title}
                        </p>
                        <span className="text-[10px] opacity-30 font-bold flex-shrink-0">{formatTime(n.created_at)}</span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-50 font-medium">{n.message}</p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 hover:text-red-500 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default LiveNotifications;
