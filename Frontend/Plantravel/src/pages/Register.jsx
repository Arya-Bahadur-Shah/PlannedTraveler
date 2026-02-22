import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Compass, Sparkles, Layout, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BackgroundVideo from '../components/BackgroundVideo';

const Register = () => {
  const { currentTheme, themeType, setThemeType } = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(formData.username, formData.email, formData.password);
      alert("Registration Successful! Please log in.");
      navigate('/login');
    } catch (err) {
      setError(Object.values(err)[0]); // Show the first error message from Django
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <BackgroundVideo />

      {/* Switcher */}
      <div className="mb-8 flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/40 shadow-xl z-20">
        <button onClick={() => setThemeType('standard')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${themeType === 'standard' ? 'bg-white shadow-md' : 'opacity-40'}`}>
          <Layout size={18}/> <span className="font-bold text-sm">Default</span>
        </button>
        <button onClick={() => setThemeType('seasonal')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${themeType === 'seasonal' ? 'bg-white shadow-md' : 'opacity-40'}`}>
          <Sparkles size={18}/> <span className="font-bold text-sm">Seasonal</span>
        </button>
      </div>

      <motion.div layout className="max-w-[480px] w-full p-12 rounded-[3.5rem] shadow-2xl border border-white/50 relative z-10" style={{ backgroundColor: currentTheme.card }}>
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] mb-6 bg-black/5" style={{ color: currentTheme.primary }}>
            <Compass size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter" style={{ color: currentTheme.text }}>Join PlannedTraveler</h1>
          <p className="opacity-50 font-medium">Create your exploration passport</p>
        </div>

        {error && <div className="mb-4 text-red-500 text-center font-bold text-sm">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative group">
            <User className="absolute left-5 top-5 opacity-30" size={20} />
            <input type="text" placeholder="Username" required className="w-full pl-14 pr-6 py-5 rounded-2xl bg-black/5 outline-none"
              onChange={(e) => setFormData({...formData, username: e.target.value})} />
          </div>
          <div className="relative group">
            <Mail className="absolute left-5 top-5 opacity-30" size={20} />
            <input type="email" placeholder="Email Address" required className="w-full pl-14 pr-6 py-5 rounded-2xl bg-black/5 outline-none"
              onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="relative group">
            <Lock className="absolute left-5 top-5 opacity-30" size={20} />
            <input type="password" placeholder="Password" required className="w-full pl-14 pr-6 py-5 rounded-2xl bg-black/5 outline-none"
              onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>

          <button className="w-full py-5 rounded-3xl text-white text-xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ backgroundColor: currentTheme.primary }}>
            {loading ? <Loader2 className="animate-spin" /> : <>Sign Up <ArrowRight /></>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm opacity-50 font-bold" style={{ color: currentTheme.text }}>
            Already an explorer? {' '}
            <Link to="/login" className="underline opacity-100" style={{ color: currentTheme.primary }}>
              Sign In Here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;