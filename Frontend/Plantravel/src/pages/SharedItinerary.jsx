/**
 * @file SharedItinerary.jsx
 * @description Public read-only view of a shared trip itinerary.
 * Accessible without authentication via `/share/:id`.
 * Fetches from the `/api/public-trip/:id/` endpoint which only
 * returns trips marked `is_public = true`.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  MapPin, Calendar, Users, DollarSign, Sun, Sunset, Moon,
  ChevronDown, ChevronUp, Compass, Utensils, Coffee, TreePine,
  Tent, Landmark, ShoppingBag, Loader2, AlertTriangle, CheckCircle
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────

/** Returns a time-of-day icon matching the activity slot */
const getTimeIcon = (time = '') => {
  const t = time.toLowerCase();
  if (t === 'morning')   return <Sun className="text-orange-400" size={18} />;
  if (t === 'afternoon') return <Sunset className="text-pink-400" size={18} />;
  return <Moon className="text-indigo-400" size={18} />;
};

/** Returns a badge class based on activity type */
const getActivityBadge = (type = '') => {
  const styles = {
    restaurant:  'bg-emerald-100 text-emerald-700',
    cafe:        'bg-amber-100   text-amber-700',
    indoor:      'bg-violet-100  text-violet-700',
    nature:      'bg-green-100   text-green-700',
    adventure:   'bg-sky-100     text-sky-700',
    cultural:    'bg-rose-100    text-rose-700',
    tourist_spot:'bg-blue-100    text-blue-700',
    shopping:    'bg-purple-100  text-purple-700',
  };
  return styles[type?.toLowerCase()] || 'bg-gray-100 text-gray-600';
};

/** Returns a lucide icon matching the activity type */
const getActivityIcon = (type = '') => {
  const t = type.toLowerCase();
  if (t === 'restaurant') return <Utensils size={13} />;
  if (t === 'cafe')       return <Coffee size={13} />;
  if (t === 'indoor')     return <Landmark size={13} />;
  if (t === 'nature')     return <TreePine size={13} />;
  if (t === 'adventure')  return <Tent size={13} />;
  if (t === 'cultural')   return <Landmark size={13} />;
  if (t === 'shopping')   return <ShoppingBag size={13} />;
  return <Compass size={13} />;
};

// ── Activity Card ────────────────────────────────────────────────

/**
 * Read-only version of the activity card shown on the shared itinerary.
 * @param {{ item: object }} props
 */
const ActivityCard = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-5 rounded-3xl border border-black/5 bg-white shadow-sm">
      <div className="flex gap-4 items-start">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 border border-black/5">
          {getTimeIcon(item.time_of_day)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {item.time_of_day && (
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">
                {item.time_of_day}
              </span>
            )}
            {item.activity_type && (
              <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getActivityBadge(item.activity_type)}`}>
                {getActivityIcon(item.activity_type)}
                {item.activity_type.replace('_', ' ')}
              </span>
            )}
          </div>
          <h4 className="font-black text-base mb-1 leading-tight">{item.title}</h4>
          <p className={`text-sm opacity-60 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {item.description}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg">
              Est. Rs. {String(item.estimated_cost || '').replace(/[^0-9.]/g, '') || '0'}
            </span>
            {item.description?.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs font-bold opacity-40 hover:opacity-80 transition-opacity"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {expanded ? 'Less' : 'More'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────

/**
 * SharedItinerary — A fully public, read-only display of an AI-generated trip.
 * The URL parameter `id` maps to a Trip with `is_public = true` on the backend.
 * No authentication is required to view this page.
 */
const SharedItinerary = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── State ──
  const [data, setData] = useState(null);     // Fetched trip payload
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(null); // Active day filter (null = show all)

  // ── Fetch public trip data on mount ──
  useEffect(() => {
    axios.get(`http://localhost:8000/api/public-trip/${id}/`)
      .then(res => setData(res.data))
      .catch(() => setError('This itinerary is not publicly available or the link is invalid.'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-violet-500" size={48} />
        <p className="font-black text-xl opacity-60">Loading shared itinerary…</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="max-w-md w-full mx-auto text-center p-10 bg-white rounded-3xl shadow-xl">
        <AlertTriangle className="mx-auto mb-4 text-orange-400" size={48} />
        <h2 className="text-2xl font-black mb-2">Itinerary Unavailable</h2>
        <p className="opacity-60 font-bold mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-violet-600 text-white font-black hover:bg-violet-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );

  const days = data?.days || [];
  const filteredDays = activeDay === null ? days : days.filter(d => d.day_number === activeDay);

  return (
    <div className="min-h-screen" style={{ background: '#f8f7f4' }}>
      {/* ── Banner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-white/20">
            🔗 Shared Itinerary
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">
            {data.destination}
          </h1>
          {/* Trip meta info chips */}
          <div className="flex flex-wrap gap-4 mt-4 opacity-80">
            <span className="flex items-center gap-2 font-bold text-sm">
              <Calendar size={16} />
              {data.start_date} → {data.end_date}
            </span>
            <span className="flex items-center gap-2 font-bold text-sm">
              <Users size={16} />
              {data.group_size}
            </span>
            <span className="flex items-center gap-2 font-bold text-sm">
              <MapPin size={16} />
              {data.total_days}-day trip
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ── Read-Only Banner ─── */}
        <div className="mb-8 px-5 py-3 rounded-2xl flex items-center gap-3 bg-violet-50 border border-violet-200 text-violet-700 font-bold text-sm">
          <CheckCircle size={18} />
          This is a read-only shared itinerary. Create your own at PlannedTraveler!
          <button onClick={() => navigate('/')} className="ml-auto underline hover:no-underline text-violet-600">
            Join Free →
          </button>
        </div>

        {/* ── Day Filter Tabs for long trips ─── */}
        {days.length > 4 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            <button
              onClick={() => setActiveDay(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-black transition-all ${activeDay === null ? 'bg-violet-600 text-white shadow' : 'opacity-40 hover:opacity-70'}`}
            >
              All Days
            </button>
            {days.map(d => (
              <button
                key={d.day_number}
                onClick={() => setActiveDay(d.day_number === activeDay ? null : d.day_number)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-black transition-all ${activeDay === d.day_number ? 'bg-violet-600 text-white shadow' : 'opacity-40 hover:opacity-70'}`}
              >
                Day {d.day_number}
              </button>
            ))}
          </div>
        )}

        {/* ── Activity Days ─── */}
        <div className="space-y-14">
          <AnimatePresence>
            {filteredDays.map((d, i) => (
              <motion.section
                key={d.day_number}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {/* Day header */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-14 h-14 rounded-2xl font-black text-xl text-white flex items-center justify-center shadow-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                    {String(d.day_number).padStart(2, '0')}
                  </span>
                  <h3 className="text-2xl font-black">Day {d.day_number}</h3>
                </div>

                {/* Timeline */}
                <div className="space-y-4 ml-4 border-l-2 border-violet-200 pl-8">
                  {(d.activities || []).map((act, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      {idx === 0 || act.time_of_day !== d.activities[idx - 1]?.time_of_day ? (
                        <div className="flex items-center gap-2 mb-3 mt-2">
                          {getTimeIcon(act.time_of_day)}
                          <span className="text-xs font-black uppercase tracking-widest opacity-50">
                            {act.time_of_day}
                          </span>
                        </div>
                      ) : null}
                      <ActivityCard item={act} />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>

        {/* ── CTA footer ─── */}
        <div className="mt-20 p-10 rounded-3xl text-center bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-2xl">
          <h3 className="text-3xl font-black mb-2">Love this itinerary?</h3>
          <p className="opacity-80 font-bold mb-6">Create your own AI-powered travel plans for free on PlannedTraveler.</p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 rounded-2xl bg-white text-violet-700 font-black hover:bg-violet-50 transition-colors shadow-lg"
          >
            Start Planning for Free →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedItinerary;
