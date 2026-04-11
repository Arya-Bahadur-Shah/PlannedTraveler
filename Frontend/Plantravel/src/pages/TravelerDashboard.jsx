import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CloudSun, Map, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TripCalendar from '../components/Calendar/TripCalendar';
import api from '../services/api';

const TravelerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({ total_trips: 0, total_spent: 0 });

  useEffect(() => {
    api.get('profile/me/')
      .then(res => {
        setTrips(res.data.trips || []);
      })
      .catch(() => {});

    api.get('analytics/')
      .then(res => {
        setStats({ total_trips: res.data.total_trips, total_spent: res.data.total_spent });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      <header className="mb-10">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Current Status: Explorer</span>
        <h1 className="text-5xl font-black tracking-tighter mt-3" style={{ color: 'var(--text-theme)' }}>
          Welcome back,&nbsp;
          <span style={{ color: 'var(--primary)' }}>{user?.username || 'Explorer'}.</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Main action + quick stats */}
        <div className="xl:col-span-2 space-y-6">
          {/* CTA Card */}
          <motion.div
            onClick={() => navigate('/planner')}
            whileHover={{ y: -6 }}
            className="p-10 rounded-[3.5rem] shadow-xl border border-[var(--primary)]/10 cursor-pointer group flex flex-col justify-between min-h-[280px]"
            style={{ backgroundColor: 'var(--card-theme)' }}
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-6">
                <Sparkles size={28} />
              </div>
              <h2 className="text-3xl font-black mb-3">Generate AI Itinerary</h2>
              <p className="text-lg opacity-50 font-medium">
                Build a personalized day-by-day plan for your next Nepal adventure — powered by real weather data.
              </p>
            </div>
            <div className="flex items-center gap-4 font-black uppercase tracking-widest text-[var(--primary)] group-hover:gap-8 transition-all text-sm mt-6">
              Initiate AI Sequence <ArrowRight size={18} />
            </div>
          </motion.div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div whileHover={{ y: -4 }}
              className="p-6 rounded-[2rem] border shadow-md cursor-pointer"
              style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.06)' }}
              onClick={() => navigate('/analytics')}>
              <Map size={20} className="mb-3 opacity-50" style={{ color: 'var(--primary)' }} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Trips</p>
              <p className="text-3xl font-black mt-0.5">{stats.total_trips}</p>
            </motion.div>

            <motion.div whileHover={{ y: -4 }}
              className="p-6 rounded-[2rem] border shadow-md cursor-pointer"
              style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.06)' }}
              onClick={() => navigate('/analytics')}>
              <TrendingUp size={20} className="mb-3 opacity-50 text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Spent</p>
              <p className="text-2xl font-black mt-0.5 text-emerald-600">Rs. {Number(stats.total_spent).toLocaleString()}</p>
            </motion.div>

            <motion.div whileHover={{ y: -4 }}
              className="p-6 rounded-[2rem] border shadow-md"
              style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.06)' }}>
              <CloudSun size={20} className="mb-3 opacity-50" style={{ color: 'var(--primary)' }} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Local Aura</p>
              <p className="text-xl font-black mt-0.5">Clear, 22°C</p>
            </motion.div>
          </div>

          {/* Recent Trips */}
          {trips.length > 0 && (
            <div className="p-7 rounded-[2.5rem] border shadow-lg" style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.07)' }}>
              <h3 className="font-black text-lg mb-5" style={{ color: 'var(--text-theme)' }}>Recent Trips</h3>
              <div className="space-y-3">
                {trips.slice(0, 3).map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-colors hover:bg-black/3"
                    style={{ borderBottom: i < Math.min(trips.length, 3) - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                      style={{ background: 'var(--primary)' }}>
                      {t.destination?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate">{t.destination}</p>
                      <p className="text-xs opacity-40 font-medium">{t.start_date} → {t.end_date}</p>
                    </div>
                    {t.budget && (
                      <span className="text-xs font-black text-emerald-600 flex-shrink-0">
                        Rs. {Number(t.budget).toLocaleString()}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Calendar */}
        <div className="xl:col-span-1">
          <TripCalendar trips={trips} />
        </div>
      </div>
    </div>
  );
};

export default TravelerDashboard;