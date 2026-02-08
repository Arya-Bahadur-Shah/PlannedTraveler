import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Lock, Compass, Sun, Moon, Sparkles, Layout } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const { currentTheme, themeType, setThemeType, activeTheme, setActiveTheme } = useTheme();
  
  const handleTypeSwitch = (type) => {
    setThemeType(type);
    setActiveTheme(type === 'standard' ? 'light' : 'basanta');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Premium Mode Switcher */}
      <div className="absolute top-8 flex flex-col items-center gap-4">
        <div className="bg-white/30 backdrop-blur-xl p-1.5 rounded-2xl border border-white/40 shadow-2xl flex gap-2">
          <button 
            onClick={() => handleTypeSwitch('standard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${themeType === 'standard' ? 'bg-white shadow-md scale-100' : 'opacity-50 scale-95'}`}
          >
            <Layout size={18} /> <span className="text-sm font-bold">Default</span>
          </button>
          <button 
            onClick={() => handleTypeSwitch('seasonal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${themeType === 'seasonal' ? 'bg-white shadow-md scale-100' : 'opacity-50 scale-95'}`}
          >
            <Sparkles size={18} /> <span className="text-sm font-bold">Seasonal</span>
          </button>
        </div>

        {/* Sub-Options (Animated based on choice) */}
        <AnimatePresence mode="wait">
          {themeType === 'standard' ? (
            <motion.div key="std" initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="flex gap-4">
              <button onClick={() => setActiveTheme('light')} className={`p-2 rounded-full border-2 transition-all ${activeTheme === 'light' ? 'border-blue-500 bg-white' : 'border-transparent'}`}><Sun size={20}/></button>
              <button onClick={() => setActiveTheme('dark')} className={`p-2 rounded-full border-2 transition-all ${activeTheme === 'dark' ? 'border-blue-500 bg-gray-800 text-white' : 'border-transparent'}`}><Moon size={20}/></button>
            </motion.div>
          ) : (
            <motion.div key="sea" initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="flex gap-3">
              {['basanta', 'grishma', 'sharad', 'hemanta'].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setActiveTheme(s)}
                  className={`w-8 h-8 rounded-full border-2 border-white transition-all ${activeTheme === s ? 'scale-125 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                  style={{ backgroundColor: s === 'basanta' ? '#98A170' : s === 'grishma' ? '#8B597B' : s === 'sharad' ? '#A05432' : '#525871' }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Registration Card (Responsive to Theme) */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] backdrop-blur-3xl border border-white/40 mt-16"
        style={{ backgroundColor: currentTheme.card }}
      >
        <div className="text-center mb-10">
          <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
             className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-inner"
             style={{ backgroundColor: `${currentTheme.primary}15`, color: currentTheme.primary }}
          >
            <Compass size={40} />
          </motion.div>
          <h2 className="text-4xl font-bold tracking-tight" style={{ color: currentTheme.text }}>PlannedTraveler</h2>
          <p className="mt-2 text-lg opacity-50 italic capitalize font-medium">
            {themeType === 'seasonal' ? `${activeTheme} Experience` : `${activeTheme} Theme`}
          </p>
        </div>

        <form className="space-y-5">
          <div className="relative group">
            <User className="absolute left-4 top-4 opacity-30" size={20} />
            <input type="text" placeholder="Username" className="w-full pl-12 pr-6 py-4 rounded-2xl outline-none transition-all shadow-inner border border-transparent focus:border-white/50"
              style={{ backgroundColor: themeType === 'standard' && activeTheme === 'dark' ? '#ffffff10' : '#00000008', color: currentTheme.text }}
            />
          </div>
          <div className="relative group">
            <Mail className="absolute left-4 top-4 opacity-30" size={20} />
            <input type="email" placeholder="Email" className="w-full pl-12 pr-6 py-4 rounded-2xl outline-none transition-all shadow-inner border border-transparent focus:border-white/50"
              style={{ backgroundColor: themeType === 'standard' && activeTheme === 'dark' ? '#ffffff10' : '#00000008', color: currentTheme.text }}
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-4 opacity-30" size={20} />
            <input type="password" placeholder="Password" className="w-full pl-12 pr-6 py-4 rounded-2xl outline-none transition-all shadow-inner border border-transparent focus:border-white/50"
              style={{ backgroundColor: themeType === 'standard' && activeTheme === 'dark' ? '#ffffff10' : '#00000008', color: currentTheme.text }}
            />
          </div>

          <button className="w-full py-5 rounded-2xl text-white text-lg font-bold shadow-xl transition-all hover:brightness-110 active:scale-95 transform"
            style={{ backgroundColor: currentTheme.primary }}>
            Start Journey
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;