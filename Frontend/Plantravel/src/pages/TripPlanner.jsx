import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, MapPin, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TripPlanner = () => {
  const navigate = useNavigate();

  return (
    <div className="p-12 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-5xl font-black tracking-tight mb-2">Initiate Trip</h1>
        <p className="opacity-50 font-bold">Step 1: Define your temporal and spatial boundaries</p>
      </header>

      <div className="space-y-8 bg-[var(--card-theme)] p-10 rounded-[3.5rem] border border-[var(--primary)]/10 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <MapPin size={12}/> Destination
            </label>
            <input type="text" placeholder="e.g. Mustang, Nepal" className="w-full p-5 rounded-2xl bg-black/5 outline-none focus:ring-2 ring-[var(--primary)]/20" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <Users size={12}/> Group Size
            </label>
            <select className="w-full p-5 rounded-2xl bg-black/5 outline-none">
              <option>Solo Explorer</option>
              <option>Couple</option>
              <option>Family (3-5)</option>
              <option>Large Group (6+)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <CalendarIcon size={12}/> Start Date
            </label>
            <input type="date" className="w-full p-5 rounded-2xl bg-black/5 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <CalendarIcon size={12}/> End Date
            </label>
            <input type="date" className="w-full p-5 rounded-2xl bg-black/5 outline-none" />
          </div>
        </div>

        <button onClick={() => navigate('/budget-input')} className="w-full py-6 rounded-3xl bg-[var(--primary)] text-white font-black text-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all mt-6">
          Proceed to Budgeting <ArrowRight />
        </button>
      </div>
    </div>
  );
};

export default TripPlanner;