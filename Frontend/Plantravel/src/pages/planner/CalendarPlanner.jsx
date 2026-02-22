import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CalendarPlanner = () => {
  const navigate = useNavigate();
  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-5xl font-black tracking-tight mb-4" style={{ color: 'var(--text-theme)' }}>Start Your Escape</h1>
        <p className="opacity-60 font-bold mb-12">Define your destination and duration to sync with the local Aura.</p>

        <div className="space-y-6 bg-[var(--card-theme)] p-10 rounded-[3rem] border border-[var(--primary)]/10 shadow-2xl">
          <div className="relative">
            <MapPin className="absolute left-5 top-6 opacity-30" />
            <input type="text" placeholder="Where to? (e.g., Mustang, Pokhara)" 
              className="w-full p-6 pl-14 rounded-2xl bg-black/5 outline-none border border-transparent focus:border-[var(--primary)] transition-all" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Departure</label>
              <input type="date" className="w-full p-5 rounded-2xl bg-black/5 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Return</label>
              <input type="date" className="w-full p-5 rounded-2xl bg-black/5 outline-none" />
            </div>
          </div>

          <button onClick={() => navigate('/budget')} className="w-full py-6 rounded-3xl bg-[var(--primary)] text-white font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-[var(--primary)]/20">
            Set Budget <ArrowRight />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CalendarPlanner;