import React from 'react';
import { Shield, Users, AlertTriangle, Terminal, Activity } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-[#05070A] text-white p-12">
      <div className="flex justify-between items-end mb-16 border-b border-white/10 pb-10">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-2 font-black uppercase text-[10px] tracking-widest">
            <Shield size={14}/> System Administrator
          </div>
          <h1 className="text-6xl font-black tracking-tighter">COMMAND</h1>
        </div>
        <div className="text-right">
          <p className="text-white/30 text-xs font-bold uppercase mb-1 tracking-widest">Server Load</p>
          <div className="flex items-center gap-4">
            <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-[42%]"/>
            </div>
            <span className="font-mono text-xs">42%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Users', val: '14,202', icon: <Users/> },
          { label: 'Pending Reports', val: '12', icon: <AlertTriangle className="text-orange-500"/> },
          { label: 'API Uptime', val: '99.9%', icon: <Activity className="text-emerald-500"/> },
          { label: 'Active Sessions', val: '842', icon: <Terminal/> },
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