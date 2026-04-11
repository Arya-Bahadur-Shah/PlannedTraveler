import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, Clock, ExternalLink, AlertTriangle, XCircle, Loader2, Shield } from 'lucide-react';
import api from '../../services/api';

const Moderation = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'resolved'
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('reports/');
      setReports(res.data);
    } catch {
      showToast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading(id + action);
    try {
      await api.post(`reports/${id}/${action}/`);
      setReports(prev =>
        prev.map(r => r.id === id ? { ...r, is_resolved: true } : r)
      );
      showToast(action === 'resolve' ? 'Report dismissed.' : 'Post blocked and report resolved.');
    } catch {
      showToast('Action failed. Try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const visible = reports.filter(r => filter === 'pending' ? !r.is_resolved : r.is_resolved);
  const pendingCount = reports.filter(r => !r.is_resolved).length;

  return (
    <div className="min-h-screen p-8 md:p-12" style={{ background: 'var(--bg-theme)', color: 'var(--text-theme)' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl font-bold text-white text-sm flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}>
            {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] mb-2 opacity-40">
          <Shield size={12} /> Moderation
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter">Content Queue</h1>
            <p className="opacity-40 font-bold mt-2">Review and action community reports</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-50 border border-orange-100">
              <AlertTriangle size={14} className="text-orange-500" />
              <span className="text-xs font-black text-orange-600">{pendingCount} pending</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-8">
        {[
          { id: 'pending', label: 'Pending', count: pendingCount },
          { id: 'resolved', label: 'Resolved', count: reports.filter(r => r.is_resolved).length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all"
            style={filter === tab.id
              ? { background: 'var(--primary)', color: 'white' }
              : { background: 'var(--card-theme)', color: 'var(--text-theme)', opacity: 0.6, border: '1px solid rgba(0,0,0,0.07)' }}>
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              filter === tab.id ? 'bg-white/20' : 'bg-black/10'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin opacity-40" size={36} />
        </div>
      ) : visible.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center py-24 opacity-30">
          <CheckCircle size={48} className="mb-4 text-emerald-400" />
          <p className="text-2xl font-black">{filter === 'pending' ? 'Queue is clear!' : 'Nothing resolved yet.'}</p>
          <p className="font-bold mt-2">{filter === 'pending' ? 'All reports have been handled.' : 'Resolved reports will appear here.'}</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {visible.map((r, i) => (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-[2rem] border overflow-hidden shadow-md"
              style={{ background: 'var(--card-theme)', borderColor: r.is_resolved ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.15)' }}>
              {/* Status bar */}
              <div className="h-1 w-full" style={{ background: r.is_resolved ? '#10b981' : '#f59e0b' }} />

              <div className="p-7">
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                  {/* Report info */}
                  <div className="flex-1 min-w-0">
                    {/* Post title */}
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert size={16} className={r.is_resolved ? 'text-emerald-500' : 'text-orange-500'} />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                        {r.is_resolved ? 'Resolved' : 'Pending'}
                      </span>
                    </div>

                    <h3 className="font-black text-lg mb-1 leading-tight">
                      {r.post_title || `Post #${r.post}`}
                    </h3>

                    {/* Reason */}
                    <div className="p-4 rounded-2xl mb-4 text-sm leading-relaxed font-medium"
                      style={{ background: 'rgba(0,0,0,0.04)' }}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Report Reason</span>
                      {r.reason}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-30">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>· Reported by {r.reported_by_name || 'User'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!r.is_resolved ? (
                    <div className="flex flex-col gap-3 flex-shrink-0 min-w-[160px]">
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleAction(r.id, 'resolve')}
                        disabled={actionLoading === r.id + 'resolve'}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 disabled:opacity-50">
                        {actionLoading === r.id + 'resolve'
                          ? <Loader2 size={14} className="animate-spin" />
                          : <CheckCircle size={14} />}
                        Dismiss Report
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleAction(r.id, 'block_post')}
                        disabled={actionLoading === r.id + 'block_post'}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 disabled:opacity-50">
                        {actionLoading === r.id + 'block_post'
                          ? <Loader2 size={14} className="animate-spin" />
                          : <XCircle size={14} />}
                        Block Post
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 self-start flex-shrink-0">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className="text-xs font-black text-emerald-600">Resolved</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Moderation;