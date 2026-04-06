import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import api from '../../services/api';

const VIBES = [
  {
    id: 'trendy',
    label: 'Trendy',
    emoji: '🔥',
    description: 'Hip spots, rooftop bars & Insta-worthy scenes',
    gradient: 'from-rose-500 to-orange-400',
    glow: 'shadow-orange-200',
    bg: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    id: 'vibey',
    label: 'Vibey',
    emoji: '✨',
    description: 'Soulful sunsets, bohemian energy & night markets',
    gradient: 'from-violet-500 to-purple-400',
    glow: 'shadow-purple-200',
    bg: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    id: 'aesthetic_cafe',
    label: 'Aesthetic Café',
    emoji: '☕',
    description: 'Specialty coffee, artisan bakeries & cozy interiors',
    gradient: 'from-amber-500 to-yellow-400',
    glow: 'shadow-amber-200',
    bg: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  {
    id: 'nature',
    label: 'Nature',
    emoji: '🌿',
    description: 'Hikes, waterfalls, peaks & wilderness escapes',
    gradient: 'from-emerald-500 to-green-400',
    glow: 'shadow-emerald-200',
    bg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  {
    id: 'adventure',
    label: 'Adventure',
    emoji: '🏔️',
    description: 'Paragliding, rafting, trekking & extreme thrills',
    gradient: 'from-sky-500 to-blue-400',
    glow: 'shadow-sky-200',
    bg: 'bg-sky-50',
    textColor: 'text-sky-700',
  },
  {
    id: 'cultural',
    label: 'Cultural',
    emoji: '🏛️',
    description: 'Heritage sites, temples, monasteries & local rituals',
    gradient: 'from-pink-500 to-rose-400',
    glow: 'shadow-pink-200',
    bg: 'bg-pink-50',
    textColor: 'text-pink-700',
  },
  {
    id: 'foodie',
    label: 'Foodie',
    emoji: '🍜',
    description: 'Street food tours, authentic cuisine & local flavors',
    gradient: 'from-red-500 to-pink-400',
    glow: 'shadow-red-200',
    bg: 'bg-red-50',
    textColor: 'text-red-700',
  },
  {
    id: 'beach',
    label: 'Lakeside',
    emoji: '🚣',
    description: 'Serene lakes, boat rides & waterside relaxation',
    gradient: 'from-cyan-500 to-teal-400',
    glow: 'shadow-cyan-200',
    bg: 'bg-cyan-50',
    textColor: 'text-cyan-700',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } }
};
const item = {
  hidden: { opacity: 0, y: 30, scale: 0.92 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 200, damping: 18 } }
};

const VibeSelector = () => {
  const navigate = useNavigate();
  const { tripData, setTripData } = useTrip();
  const [selected, setSelected] = useState(tripData.travel_vibes || []);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
    setShowSuggestions(false);
  };

  const fetchSuggestions = async () => {
    if (selected.length === 0) return;
    setLoadingSuggestions(true);
    try {
      const res = await api.post('trips/generate-vibe/', { travel_vibes: selected });
      setSuggestions(res.data.suggestions || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleContinue = () => {
    setTripData({ ...tripData, travel_vibes: selected });
    navigate('/budget');
  };

  return (
    <div className="min-h-screen p-8 md:p-16 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center md:text-left"
      >
        <span className="inline-block mb-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)]">
          Step 2 of 3 — Choose Your Vibe
        </span>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4" style={{ color: 'var(--text-theme)' }}>
          What's Your<br />Travel Style?
        </h1>
        <p className="opacity-50 font-bold text-lg max-w-xl">
          Pick the vibes that speak to you. Your AI itinerary will be tailored around these preferences.
          {selected.length > 0 && (
            <span className="ml-2 text-[var(--primary)]">{selected.length} selected ✓</span>
          )}
        </p>
      </motion.div>

      {/* ── Vibe Grid ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
      >
        {VIBES.map((vibe) => {
          const isSelected = selected.includes(vibe.id);
          return (
            <motion.button
              key={vibe.id}
              variants={item}
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggle(vibe.id)}
              className={`
                relative p-6 rounded-3xl text-left transition-all duration-300 border-2 group
                ${isSelected
                  ? `bg-gradient-to-br ${vibe.gradient} border-transparent shadow-2xl ${vibe.glow} text-white`
                  : `${vibe.bg} border-transparent hover:border-current ${vibe.textColor} shadow-sm`
                }
              `}
            >
              {/* Check badge */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-3 right-3 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="text-4xl mb-3 block">{vibe.emoji}</span>
              <p className={`font-black text-base mb-1 ${isSelected ? 'text-white' : ''}`}>
                {vibe.label}
              </p>
              <p className={`text-xs leading-snug font-medium ${isSelected ? 'text-white/80' : 'opacity-60'}`}>
                {vibe.description}
              </p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── AI Destination Inspiration ── */}
      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-3xl border-2 border-dashed border-[var(--primary)]/30"
          style={{ background: 'var(--card-theme)' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-black text-lg mb-1">✨ Need destination inspiration?</p>
              <p className="text-sm opacity-50 font-bold">
                Let AI suggest Nepal destinations matching your vibe.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={fetchSuggestions}
              disabled={loadingSuggestions}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-white text-sm disabled:opacity-60 shadow-lg"
              style={{ background: 'var(--primary)' }}
            >
              {loadingSuggestions ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating…</>
              ) : (
                <><Sparkles size={16} /> Suggest Destinations</>
              )}
            </motion.button>
          </div>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden"
              >
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => {
                      // Extract just the city name from "Patan, Lalitpur" → "Patan"
                      const cityName = s.name.split(',')[0].trim();
                      setTripData(prev => ({ ...prev, destination: cityName }));
                      setShowSuggestions(false);
                    }}
                    className="text-left p-4 rounded-2xl border-2 border-[var(--primary)]/15 hover:border-[var(--primary)]/50 transition-all"
                    style={{ background: 'var(--bg-theme)' }}
                  >
                    <span className="text-2xl mr-2">{s.emoji}</span>
                    <span className="font-black text-sm">{s.name}</span>
                    <p className="text-xs opacity-50 mt-1 font-medium leading-snug">{s.tagline}</p>
                    <p className="text-xs mt-2 font-bold opacity-40">{s.highlights}</p>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Skip / Continue ── */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="flex-1 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-2xl transition-all"
          style={{
            background: selected.length > 0
              ? 'linear-gradient(135deg, var(--primary), #7c3aed)'
              : 'rgba(0,0,0,0.1)'
          }}
        >
          {selected.length === 0
            ? 'Select at least one vibe'
            : `Generate ${selected.length}-vibe Itinerary`
          }
          {selected.length > 0 && <ArrowRight size={22} />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            setTripData({ ...tripData, travel_vibes: [] });
            navigate('/budget');
          }}
          className="px-8 py-6 rounded-3xl font-black text-sm opacity-40 hover:opacity-70 transition-opacity border-2"
          style={{ borderColor: 'rgba(0,0,0,0.1)' }}
        >
          Skip
        </motion.button>
      </div>
    </div>
  );
};

export default VibeSelector;
