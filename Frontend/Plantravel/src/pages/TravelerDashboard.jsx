import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Calendar, CloudSun, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TravelerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto">
      <header className="mb-16">
        <span className="text-[var(--primary)] text-xs font-black uppercase tracking-[0.4em]">Current Status: Explorer</span>
        <h1 className="text-6xl font-black tracking-tighter mt-4" style={{ color: 'var(--text-theme)' }}>
          Welcome back, <br/> to your <span className="text-[var(--primary)]">Adventure.</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Action Card */}
        <motion.div 
          onClick={() => navigate('/planner')}
          whileHover={{ y: -10 }}
          className="lg:col-span-2 p-12 rounded-[4rem] shadow-xl border border-[var(--primary)]/10 cursor-pointer group flex flex-col justify-between min-h-[400px]"
          style={{ backgroundColor: 'var(--card-theme)' }}
        >
          <div>
            <div className="w-16 h-16 rounded-3xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-8">
              <Sparkles size={32} />
            </div>
            <h2 className="text-4xl font-black mb-4">Generate New Itinerary</h2>
            <p className="text-xl opacity-60 font-medium">Use our AI Core to build a personalized 7-day plan for Mustang or Pokhara based on current weather.</p>
          </div>
          <div className="flex items-center gap-4 font-black uppercase tracking-widest text-[var(--primary)] group-hover:gap-8 transition-all">
            Initiate AI Sequence <ArrowRight />
          </div>
        </motion.div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          <div className="p-8 rounded-[3rem] bg-[var(--card-theme)] border border-[var(--primary)]/5 shadow-lg">
            <CloudSun className="text-[var(--primary)] mb-4" />
            <h4 className="font-black uppercase text-xs tracking-widest opacity-40">Local Aura</h4>
            <p className="text-2xl font-bold">Clear Skies, 22°C</p>
          </div>
          <div className="p-8 rounded-[3rem] bg-[var(--card-theme)] border border-[var(--primary)]/5 shadow-lg">
            <PieChart className="text-[var(--primary)] mb-4" />
            <h4 className="font-black uppercase text-xs tracking-widest opacity-40">Budget Utilization</h4>
            <p className="text-2xl font-bold">Rs. 12,500 Remaining</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelerDashboard;