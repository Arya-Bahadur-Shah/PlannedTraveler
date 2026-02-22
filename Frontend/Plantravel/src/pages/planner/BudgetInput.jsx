import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Info, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BudgetInput = () => {
  const navigate = useNavigate();
  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto">
      <h1 className="text-5xl font-black tracking-tight mb-12" style={{ color: 'var(--text-theme)' }}>Travel Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {['Backpacker', 'Comfort', 'Luxury'].map((level) => (
          <div key={level} className="p-8 rounded-[2.5rem] bg-[var(--card-theme)] border border-[var(--primary)]/10 text-center hover:border-[var(--primary)] cursor-pointer transition-all group">
            <h3 className="font-black uppercase tracking-widest mb-2 text-xs opacity-40 group-hover:text-[var(--primary)]">{level}</h3>
            <p className="text-sm font-bold opacity-60">Optimized for efficiency</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--card-theme)] p-10 rounded-[3rem] border border-[var(--primary)]/10">
        <label className="block text-sm font-black uppercase tracking-widest opacity-40 mb-4">Total Estimated Budget (NPR)</label>
        <div className="flex items-center gap-4 mb-10">
          <span className="text-4xl font-black">Rs.</span>
          <input type="number" placeholder="50,000" className="text-6xl font-black bg-transparent outline-none w-full border-b-4 border-[var(--primary)]" />
        </div>

        <button onClick={() => navigate('/itinerary-editor')} className="w-full py-6 rounded-3xl bg-[var(--primary)] text-white font-black text-xl flex items-center justify-center gap-3 hover:shadow-2xl transition-all">
          Generate AI Itinerary <Sparkles />
        </button>
      </div>
    </div>
  );
};

export default BudgetInput;