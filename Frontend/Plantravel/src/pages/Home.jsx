import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Sparkles, Map, ShieldCheck, Globe } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen pt-20 px-6 max-w-7xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="text-center mb-24"
      >
        {/* Updated Badge text */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-8">
          <Sparkles size={16} className="text-[var(--primary)]" />
          <span className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">
            Every Traveler's Personal Guide
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight" style={{ color: 'var(--text-theme)' }}>
          TRAVEL WITH <br/> <span className="text-[var(--primary)]">INTELLIGENCE</span>
        </h1>

        <p className="max-w-2xl mx-auto text-xl opacity-70 mb-10 font-medium" style={{ color: 'var(--text-theme)' }}>
          PlannedTraveler combines seasonal intelligence, interactive maps, and real traveler experiences to build your perfect escape.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/register" className="px-10 py-5 rounded-3xl bg-[var(--primary)] text-white font-black text-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
            Start Planning <ArrowRight />
          </Link>
          <Link to="/blogs" className="px-10 py-5 rounded-3xl bg-white/50 backdrop-blur-md border border-[var(--primary)]/20 text-[var(--text-theme)] font-black text-xl hover:bg-white transition-all">
            Explore Community
          </Link>
        </div>
      </motion.div>

      {/* Feature Grid with Map Integration Update */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div whileHover={{ y: -5 }} className="p-10 rounded-[3rem] bg-[var(--card-theme)] border border-[var(--primary)]/10 shadow-sm">
          <div className="mb-6 text-[var(--primary)]"><Globe size={32}/></div>
          <h3 className="text-2xl font-black mb-4" style={{ color: 'var(--text-theme)' }}>Ai Integrated</h3>
          <p className="opacity-60 leading-relaxed font-medium" style={{ color: 'var(--text-theme)' }}>
            Generate your own travel using AI tools for proper enjoyment.
          </p>
        </motion.div>

        {/* Updated Map Card */}
        <motion.div whileHover={{ y: -5 }} className="p-10 rounded-[3rem] bg-[var(--card-theme)] border border-[var(--primary)]/10 shadow-sm">
          <div className="mb-6 text-[var(--primary)]"><Map size={32}/></div>
          <h3 className="text-2xl font-black mb-4" style={{ color: 'var(--text-theme)' }}>Map Integrated</h3>
          <p className="opacity-60 leading-relaxed font-medium" style={{ color: 'var(--text-theme)' }}>
            Visual routes and landmark tracking. Navigate through Nepal with live map data and optimized itineraries.
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="p-10 rounded-[3rem] bg-[var(--card-theme)] border border-[var(--primary)]/10 shadow-sm">
          <div className="mb-6 text-[var(--primary)]"><ShieldCheck size={32}/></div>
          <h3 className="text-2xl font-black mb-4" style={{ color: 'var(--text-theme)' }}>Trusted Content</h3>
          <p className="opacity-60 leading-relaxed font-medium" style={{ color: 'var(--text-theme)' }}>
            No fake reviews. Only real experiences and factual data shared by our community of verified travelers.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;