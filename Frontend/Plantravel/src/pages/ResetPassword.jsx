import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import AuthError from '../components/AuthError';
import { Lock, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const { uid, token } = useParams(); // Get data from the URL link
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    setError(null);

    try {
      // Call the backend endpoint we created earlier
      await api.post(`reset-confirm/${uid}/${token}/`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError("The reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-[450px] w-full p-12 rounded-[4rem] shadow-2xl border border-white/20 backdrop-blur-xl transition-all" 
        style={{ backgroundColor: currentTheme.card }}>
        
        <div className="text-center mb-10">
          <div className="inline-flex p-5 rounded-3xl mb-4 bg-black/5" style={{ color: 'var(--primary)' }}>
            <Lock size={40} />
          </div>
          <h2 className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-theme)' }}>New Secret Key</h2>
          <p className="opacity-50 font-medium">Re-establish your identity to the Aura Core.</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-6">
            <CheckCircle size={64} className="mx-auto text-emerald-500 animate-bounce" />
            <p className="font-bold text-emerald-600">Password reset successful!</p>
            <p className="text-sm opacity-50">Redirecting to login gate...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthError message={error} />
            
            <div className="relative">
              <input 
                type="password" 
                placeholder="New Password" 
                required 
                className="w-full p-5 rounded-2xl bg-black/5 outline-none border border-transparent focus:border-[var(--primary)]"
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
            
            <div className="relative">
              <input 
                type="password" 
                placeholder="Confirm Password" 
                required 
                className="w-full p-5 rounded-2xl bg-black/5 outline-none border border-transparent focus:border-[var(--primary)]"
                onChange={e => setConfirmPassword(e.target.value)} 
              />
            </div>

            <button disabled={loading} className="w-full py-5 rounded-3xl text-white font-black text-xl shadow-lg transition-all active:scale-95 flex justify-center items-center gap-3"
              style={{ backgroundColor: 'var(--primary)' }}>
              {loading ? <Loader2 className="animate-spin" /> : <>Reset Passport <ArrowRight /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;