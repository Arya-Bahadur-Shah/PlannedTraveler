import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Compass } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const { currentTheme, season } = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      alert("Registration Successful! Please login.");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data ? Object.values(err.response.data)[0] : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Registration Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-2xl border border-white/40"
        style={{ backgroundColor: currentTheme.card }}
      >
        <div className="text-center mb-10">
          <motion.div 
             animate={{ y: [0, -10, 0] }}
             transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
             className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-sm"
             style={{ backgroundColor: `${currentTheme.primary}22`, color: currentTheme.primary }}
          >
            <Compass size={44} strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-4xl font-extrabold tracking-tight" style={{ color: currentTheme.text }}>
            Join the Journey
          </h2>
          <p className="mt-3 text-lg opacity-60 font-medium italic">
            Experience the {season} of travel
          </p>
        </div>

        {error && (
          <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-red-500 text-sm text-center mb-6 font-semibold bg-red-50 p-2 rounded-lg">
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <User className="absolute left-4 top-4 opacity-30 group-focus-within:opacity-100 transition-opacity" size={22} />
            <input 
              type="text" placeholder="Username" required
              className="w-full pl-12 pr-6 py-4 rounded-2xl outline-none transition-all border border-transparent shadow-sm hover:bg-white/50 focus:bg-white focus:ring-2"
              style={{ backgroundColor: '#00000008', color: currentTheme.text, focusRingColor: currentTheme.primary }}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-4 opacity-30 group-focus-within:opacity-100 transition-opacity" size={22} />
            <input 
              type="email" placeholder="Email" required
              className="w-full pl-12 pr-6 py-4 rounded-2xl outline-none transition-all border border-transparent shadow-sm hover:bg-white/50 focus:bg-white focus:ring-2"
              style={{ backgroundColor: '#00000008', color: currentTheme.text, focusRingColor: currentTheme.primary }}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-4 opacity-30 group-focus-within:opacity-100 transition-opacity" size={22} />
            <input 
              type="password" placeholder="Password" required
              className="w-full pl-12 pr-6 py-4 rounded-2xl outline-none transition-all border border-transparent shadow-sm hover:bg-white/50 focus:bg-white focus:ring-2"
              style={{ backgroundColor: '#00000008', color: currentTheme.text, focusRingColor: currentTheme.primary }}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-5 rounded-2xl text-white text-lg font-bold shadow-xl transition-all hover:brightness-110 active:scale-95 transform"
            style={{ backgroundColor: currentTheme.primary }}
          >
            Create Account
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-sm opacity-50 font-medium">
            Already a traveler? {' '}
            <Link to="/login" className="font-bold underline underline-offset-4" style={{ color: currentTheme.primary }}>
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;