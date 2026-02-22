import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Database, Cpu, Globe, ArrowUpRight } from 'lucide-react';

const SuperAdminDash = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-12">
      <header className="mb-16 flex justify-between items-start">
        <div>
          <span className="text-red-500 text-xs font-black uppercase tracking-[0.3em]">Level 10 Access</span>
          <h1 className="text-6xl font-black tracking-tighter mt-2">Root Control</h1>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-[10px] font-bold opacity-40 mb-1">AI CORE STATUS</p>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> <span className="text-sm font-black uppercase">Optimized</span></div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {[
          { label: "Global Users", value: "24.2k", icon: <Globe className="text-blue-400"/> },
          { label: "AI Tokens/Month", value: "1.2M", icon: <Cpu className="text-purple-400"/> },
          { label: "DB Latency", value: "14ms", icon: <Database className="text-emerald-400"/> },
          { label: "Security Events", value: "0", icon: <ShieldAlert className="text-red-400"/> }
        ].map((s, i) => (
          <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
            <div className="mb-6">{s.icon}</div>
            <p className="text-sm font-bold opacity-40 uppercase tracking-widest">{s.label}</p>
            <h4 className="text-4xl font-black mt-1">{s.value}</h4>
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-10 rounded-[3rem] border border-white/10">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">System Logs <ArrowUpRight size={20} className="opacity-30"/></h3>
            <div className="space-y-4 font-mono text-xs opacity-60">
               <p className="text-emerald-400">[12:45:01] Auth Handshake: User ID 8211 (Traveler)</p>
               <p className="text-blue-400">[12:44:59] AI Itinerary Generated for "Lumbini"</p>
               <p className="text-orange-400">[12:40:12] Token Refresh for "Admin_91"</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SuperAdminDash;