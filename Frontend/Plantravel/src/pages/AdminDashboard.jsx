import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, PenTool, Map, AlertTriangle,
  TrendingUp, CheckCircle, Clock, ShieldAlert
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import api from '../services/api';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

// Animated count-up hook
const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

const StatCard = ({ label, value, icon, iconBg, sub }) => {
  const animated = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="p-7 rounded-[2rem] border shadow-lg flex items-center gap-5"
      style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.07)' }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{label}</p>
        <p className="text-4xl font-black mt-0.5">{animated}</p>
        {sub && <p className="text-xs opacity-40 font-bold mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_users: 0, total_posts: 0, total_trips: 0, pending_reports: 0 });
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    api.get('admin/stats/').then(res => setStats(res.data)).catch(console.error);
    api.get('reports/').then(res => setReports(res.data.filter(r => !r.is_resolved))).catch(console.error).finally(() => setLoadingReports(false));
    api.get('users/').then(res => setUsers(res.data)).catch(console.error);
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`reports/${id}/${action}/`);
      setReports(prev => prev.filter(r => r.id !== id));
      if (action === 'resolve') setStats(s => ({ ...s, pending_reports: Math.max(0, s.pending_reports - 1) }));
    } catch { /* ignore */ }
  };

  // Derived chart data from users (join dates grouped by month)
  const monthlyUsers = (() => {
    const map = {};
    users.forEach(u => {
      if (u.date_joined) {
        const m = new Date(u.date_joined).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        map[m] = (map[m] || 0) + 1;
      }
    });
    return Object.entries(map).map(([month, count]) => ({ month, count }));
  })();

  const rolePie = (() => {
    const map = {};
    users.forEach(u => { map[u.role] = (map[u.role] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="min-h-screen p-8 md:p-12" style={{ background: 'var(--bg-theme)', color: 'var(--text-theme)' }}>
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--primary)' }}>
            <Shield size={13} /> System Administrator
          </div>
          <h1 className="text-5xl font-black tracking-tighter">Command Center</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-emerald-700">All Systems Live</span>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard label="Total Explorers" value={stats.total_users} iconBg="rgba(99,102,241,0.12)" icon={<Users size={24} style={{ color: 'var(--primary)' }} />} sub="Registered accounts" />
        <StatCard label="Community Posts" value={stats.total_posts} iconBg="rgba(236,72,153,0.12)" icon={<PenTool size={24} className="text-pink-500" />} sub="Published stories" />
        <StatCard label="AI Trips Gen." value={stats.total_trips} iconBg="rgba(16,185,129,0.12)" icon={<Map size={24} className="text-emerald-500" />} sub="Itineraries created" />
        <StatCard label="Pending Reports" value={stats.pending_reports} iconBg={stats.pending_reports > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)'}
          icon={stats.pending_reports > 0 ? <AlertTriangle size={24} className="text-red-500" /> : <CheckCircle size={24} className="text-emerald-500" />}
          sub={stats.pending_reports > 0 ? 'Needs attention' : 'All clear'} />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* User Growth Bar Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="p-7 rounded-[2rem] border shadow-lg" style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="font-black text-lg">User Growth</h3>
          </div>
          {monthlyUsers.length === 0 ? (
            <p className="opacity-30 font-bold italic">No user data yet.</p>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyUsers} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', opacity: 0.4 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', opacity: 0.4 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                  <Bar dataKey="count" name="Users" fill="var(--primary)" radius={[8, 8, 8, 8]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Role Distribution Pie Chart */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
          className="p-7 rounded-[2rem] border shadow-lg" style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="font-black text-lg">User Roles</h3>
          </div>
          {rolePie.length === 0 ? (
            <p className="opacity-30 font-bold italic">No role data yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-52 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rolePie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                      {rolePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3">
                {rolePie.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">{r.name}</p>
                      <p className="text-lg font-black leading-tight">{r.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Pending Reports Table ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-[2rem] border overflow-hidden shadow-lg" style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-3 px-7 py-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <ShieldAlert size={18} className="text-orange-500" />
          <h3 className="font-black text-lg">Moderation Queue</h3>
          {reports.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">{reports.length}</span>
          )}
        </div>

        {loadingReports ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center gap-3 px-7 py-8 opacity-40">
            <CheckCircle size={20} className="text-emerald-500" />
            <p className="font-black">Queue is clear — no pending reports.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
            {reports.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-5 px-7 py-5 hover:bg-black/2 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                    <p className="font-black text-sm truncate" style={{ color: 'var(--primary)' }}>
                      {r.post_title || `Post #${r.post}`}
                    </p>
                  </div>
                  <p className="text-sm opacity-60 mb-1 leading-snug">{r.reason}</p>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-30">
                    <Clock size={10} />
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span>· By {r.reported_by_name || 'User'}</span>
                  </div>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button onClick={() => handleAction(r.id, 'resolve')}
                    className="px-4 py-2 rounded-xl font-black text-xs transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100">
                    ✓ Dismiss
                  </button>
                  <button onClick={() => handleAction(r.id, 'block_post')}
                    className="px-4 py-2 rounded-xl font-black text-xs transition-all bg-red-50 text-red-600 hover:bg-red-100 border border-red-100">
                    🚫 Block Post
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;