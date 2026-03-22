import React, { useEffect, useState } from 'react';
import { Shield, Users, AlertTriangle, PenTool, Map } from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_users: 0, total_posts: 0, total_trips: 0, pending_reports: 0 });

  useEffect(() => {
    api.get('admin/stats/').then(res => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-12">
      <div className="flex justify-between items-end mb-16 border-b border-white/10 pb-10">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-2 font-black uppercase text-[10px] tracking-widest">
            <Shield size={14}/> System Administrator
          </div>
          <h1 className="text-6xl font-black tracking-tighter">COMMAND</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Users', val: stats.total_users, icon: <Users/> },
          { label: 'Community Posts', val: stats.total_posts, icon: <PenTool className="text-pink-500"/> },
          { label: 'AI Trips Gen.', val: stats.total_trips, icon: <Map className="text-emerald-500"/> },
          { label: 'Pending Reports', val: stats.pending_reports, icon: <AlertTriangle className="text-orange-500"/> },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem]">
            <div className="opacity-30 mb-4">{s.icon}</div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{s.label}</p>
            <h4 className="text-3xl font-black mt-1">{s.val}</h4>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;