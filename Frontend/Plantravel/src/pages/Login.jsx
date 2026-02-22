import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthError from '../components/AuthError';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ArrowRight, Loader2, Compass } from 'lucide-react';
import BackgroundVideo from '../components/BackgroundVideo';

const Login = () => {
  const { currentTheme } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creds, setCreds] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
     try {
      await login(creds.username, creds.password);
      navigate('/dashboard');
    } catch (err) {
      // Django returns 401 for bad credentials
      if (err.status === 401) {
        setError("Passport check failed. Username or Secret Key is incorrect.");
      } else {
        setError("Network error. The server is unreachable.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <BackgroundVideo />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-[450px] w-full p-12 rounded-[4rem] shadow-2xl border border-white/20 backdrop-blur-xl"
        style={{ backgroundColor: currentTheme.card }}>
        
        <div className="text-center mb-10">
          <div className="inline-flex p-5 rounded-3xl mb-4 bg-black/5" style={{ color: currentTheme.primary }}>
            <Compass size={48} />
          </div>
          <h2 className="text-4xl font-black tracking-tighter" style={{ color: currentTheme.text }}>PlannedTraveler</h2>
          <p className="opacity-50 font-medium">Verify your itinerary credentials</p>
        </div>
        <p className="mt-4 text-center">
        <Link to="/forgot-password" style={{ color: 'var(--primary)' }} className="text-xs font-bold opacity-50 hover:opacity-100">
          Forgot your Secret Key?
        </Link>
        </p>
        <AuthError message={error} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Username" required className="w-full p-5 rounded-2xl bg-black/5 outline-none border border-transparent focus:border-white/50"
            onChange={e => setCreds({...creds, username: e.target.value})} />
          <input type="password" placeholder="Secret Key" required className="w-full p-5 rounded-2xl bg-black/5 outline-none border border-transparent focus:border-white/50"
            onChange={e => setCreds({...creds, password: e.target.value})} />
          
          <button className="w-full py-5 rounded-3xl text-white font-black text-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-3"
            style={{ backgroundColor: currentTheme.primary }}>
            {loading ? <Loader2 className="animate-spin" /> : <>Explore <ArrowRight /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;