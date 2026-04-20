import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthError from '../components/AuthError';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Loader2, Mail, Key } from 'lucide-react';
import BackgroundVideo from '../components/BackgroundVideo';

const Login = () => {
  const { currentTheme } = useTheme();
  const { login, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Standard Login State
  const [creds, setCreds] = useState({ username: '', password: '' });
  
  // OTP State
  const [otpMode, setOtpMode] = useState(false);
  const [otpStep, setOtpStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
     try {
      await login(creds.username, creds.password);
      navigate('/dashboard');
    } catch (err) {
      if (err.status === 401) {
        setError("Passport check failed. Username or Secret Key is incorrect.");
      } else {
        setError("Network error. The server is unreachable.");
      }
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendOtp(email);
      setOtpStep(2);
    } catch (err) {
      setError("Failed to send OTP. Ensure email is correct.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(email, otpCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <BackgroundVideo />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-[450px] w-full p-12 rounded-[4rem] shadow-2xl border border-white/20 backdrop-blur-xl relative overflow-hidden"
        style={{ backgroundColor: currentTheme.card }}>
        
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black tracking-tighter" style={{ color: currentTheme.text }}>PlannedTraveler</h2>
          <p className="opacity-50 font-medium mt-2">Verify your itinerary credentials</p>
        </div>
        
        {!otpMode && (
          <p className="mb-4 text-center">
            <Link to="/forgot-password" style={{ color: 'var(--primary)' }} className="text-xs font-bold opacity-50 hover:opacity-100">
              Forgot your Secret Key?
            </Link>
          </p>
        )}

        <AuthError message={error} />

        <AnimatePresence mode="wait">
          {!otpMode ? (
            <motion.div key="standard" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <form onSubmit={handleStandardLogin} className="space-y-4">
                <input type="text" placeholder="Username" required className="w-full p-5 rounded-2xl bg-black/5 outline-none border border-transparent focus:border-white/50"
                  onChange={e => setCreds({...creds, username: e.target.value})} />
                <input type="password" placeholder="Secret Key" required className="w-full p-5 rounded-2xl bg-black/5 outline-none border border-transparent focus:border-white/50"
                  onChange={e => setCreds({...creds, password: e.target.value})} />
                
                <button disabled={loading} className="w-full py-5 rounded-3xl text-white font-black text-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-3 disabled:opacity-70"
                  style={{ backgroundColor: currentTheme.primary }}>
                  {loading ? <Loader2 className="animate-spin" /> : <>Explore <ArrowRight /></>}
                </button>
              </form>
              
              <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-3 w-full opacity-50">
                  <div className="h-px bg-current flex-1"></div>
                  <span className="text-sm font-medium">Or continue with</span>
                  <div className="h-px bg-current flex-1"></div>
                </div>
                <button onClick={() => { setOtpMode(true); setError(null); }} className="w-full py-4 rounded-3xl bg-black/5 hover:bg-black/10 transition-colors font-bold text-sm flex items-center justify-center gap-2">
                  <Mail size={16} /> Email OTP Login
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {otpStep === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <input type="email" placeholder="Enter your Email" required className="w-full p-5 rounded-2xl bg-black/5 outline-none border border-transparent focus:border-white/50"
                    onChange={e => setEmail(e.target.value)} />
                  <button disabled={loading} className="w-full py-5 rounded-3xl text-white font-black text-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-3 disabled:opacity-70"
                    style={{ backgroundColor: currentTheme.primary }}>
                    {loading ? <Loader2 className="animate-spin" /> : <>Send OTP <ArrowRight /></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-xs font-bold text-center opacity-60">Code sent to {email}</p>
                  <input type="text" placeholder="6-digit OTP" maxLength={6} required className="w-full p-5 rounded-2xl bg-black/5 outline-none border border-transparent focus:border-white/50 text-center text-2xl tracking-widest font-black"
                    onChange={e => setOtpCode(e.target.value)} />
                  <button disabled={loading} className="w-full py-5 rounded-3xl text-white font-black text-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-3 disabled:opacity-70"
                    style={{ backgroundColor: currentTheme.primary }}>
                    {loading ? <Loader2 className="animate-spin" /> : <>Verify & Login <ArrowRight /></>}
                  </button>
                </form>
              )}

              <div className="mt-8 flex justify-center">
                <button onClick={() => { setOtpMode(false); setOtpStep(1); setError(null); }} className="text-xs font-bold opacity-50 hover:opacity-100 flex items-center gap-1">
                  <Key size={12} /> Back to standard login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default Login;