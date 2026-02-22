import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import AuthError from '../components/AuthError';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const { currentTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('password-reset/', { email });
      setMsg("Instructions sent to your email.");
    } catch { setMsg("An error occurred. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-[450px] w-full p-12 rounded-[4rem] shadow-2xl border border-white/20 backdrop-blur-xl" style={{ backgroundColor: currentTheme.card }}>
        <Link to="/login" className="flex items-center gap-2 text-xs font-black uppercase opacity-40 hover:opacity-100 mb-8 transition-all">
          <ArrowLeft size={14}/> Back to Login
        </Link>
        <h2 className="text-4xl font-black tracking-tighter mb-4" style={{ color: 'var(--text-theme)' }}>Lost Path?</h2>
        <p className="opacity-50 font-medium mb-8">Enter your email to recover your exploration passport.</p>
        
        {msg && <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl mb-6 font-bold text-sm text-center">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-5 top-5 opacity-30" size={20} />
            <input type="email" placeholder="Email Address" required className="w-full pl-14 pr-6 py-5 rounded-2xl bg-black/5 outline-none" 
              onChange={e => setEmail(e.target.value)} />
          </div>
          <button disabled={loading} className="w-full py-5 rounded-3xl text-white font-black text-xl shadow-lg bg-[var(--primary)] flex justify-center items-center gap-3 active:scale-95 transition-all">
            {loading ? "Sending..." : <>Send Reset Link <Send size={18}/></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;