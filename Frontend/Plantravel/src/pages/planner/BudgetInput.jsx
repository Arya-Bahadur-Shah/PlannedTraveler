import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import api from '../../services/api';

const VIBE_EMOJI = {
  trendy: '🔥', vibey: '✨', aesthetic_cafe: '☕',
  nature: '🌿', adventure: '🏔️', cultural: '🏛️', foodie: '🍜', beach: '🚣'
};

const BudgetInput = () => {
  const navigate = useNavigate();
  const { tripData, setTripData } = useTrip();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!tripData.destination || !tripData.start_date || !tripData.end_date || !tripData.budget) {
      setError('Please fill in all details — destination, dates, and budget are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload = {
        destination: tripData.destination,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        budget: tripData.budget,
        group_size: tripData.group_size || 'Solo Explorer',
        travel_vibes: tripData.travel_vibes || [],
      };
      const res = await api.post('trips/generate-itinerary/', payload);

      if (res.data.itinerary) {
        navigate('/itinerary-editor', {
          state: {
            itinerary: res.data.itinerary,
            weather_available: res.data.weather_available,
            trip_id: res.data.trip_id,
          }
        });
      } else {
        setError('The AI returned an empty itinerary. Please try again.');
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Error generating itinerary. Please check your setup.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto">
      {/* Step indicator */}
      <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)]">
        Step 3 of 3 — Set Your Budget
      </span>

      <h1 className="text-5xl font-black tracking-tight mb-3" style={{ color: 'var(--text-theme)' }}>
        Travel Resources
      </h1>
      <p className="opacity-60 font-bold mb-10">
        Set your total trip budget and let the AI craft a perfectly scoped itinerary.
      </p>

      {/* Trip Summary Card */}
      <div className="bg-[var(--card-theme)] p-6 rounded-3xl border border-[var(--primary)]/10 shadow-md mb-6">
        <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-3">Your Trip At a Glance</p>
        <div className="flex flex-wrap gap-3">
          <span className="px-4 py-2 bg-[var(--primary)]/10 rounded-2xl text-sm font-black text-[var(--primary)]">
            📍 {tripData.destination || 'No destination'}
          </span>
          {tripData.start_date && (
            <span className="px-4 py-2 bg-[var(--primary)]/10 rounded-2xl text-sm font-bold text-[var(--primary)]">
              📅 {new Date(tripData.start_date).toLocaleDateString()} → {new Date(tripData.end_date).toLocaleDateString()}
            </span>
          )}
          <span className="px-4 py-2 bg-[var(--primary)]/10 rounded-2xl text-sm font-bold text-[var(--primary)]">
            👥 {tripData.group_size}
          </span>
          {/* Vibe Tags */}
          {(tripData.travel_vibes || []).map(v => (
            <span key={v} className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700">
              {VIBE_EMOJI[v] || '🎯'} {v.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Budget Input */}
      <div className="bg-[var(--card-theme)] p-10 rounded-[3rem] border border-[var(--primary)]/10 shadow-xl">
        <label className="block text-sm font-black uppercase tracking-widest opacity-40 mb-4">
          Total Estimated Budget (NPR)
        </label>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl font-black opacity-50">Rs.</span>
          <input
            type="number"
            placeholder="50,000"
            value={tripData.budget}
            onChange={e => setTripData({ ...tripData, budget: e.target.value })}
            className="text-6xl font-black bg-transparent outline-none w-full border-b-4 border-[var(--primary)]"
          />
        </div>

        {/* Quick-pick budget buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[15000, 30000, 50000, 100000, 200000].map(b => (
            <button
              key={b}
              onClick={() => setTripData({ ...tripData, budget: String(b) })}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                String(tripData.budget) === String(b)
                  ? 'bg-[var(--primary)] text-white shadow-lg'
                  : 'bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20'
              }`}
            >
              Rs. {b.toLocaleString()}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl text-sm font-bold text-red-600">
            ⚠️ {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          onClick={handleGenerate}
          className="w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 text-white shadow-2xl transition-all disabled:opacity-60 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, var(--primary), #7c3aed)' }}
        >
          {loading ? (
            <><Loader2 className="animate-spin" /> Initializing AI Core…</>
          ) : (
            <><Sparkles /> Generate AI Itinerary</>
          )}
        </motion.button>

        {loading && (
          <p className="text-center text-xs opacity-40 font-bold mt-4">
            ⏳ The AI is crafting your personalized itinerary with real locations, weather, and restaurants…
          </p>
        )}
      </div>
    </div>
  );
};

export default BudgetInput;