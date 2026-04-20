import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Sunset, Moon, Map as MapIcon, CloudRain, Cloud, CloudSnow,
  Utensils, Coffee, TreePine, Tent, Landmark, ShoppingBag,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Compass, Edit3, Trash2, Save, X, Share2, Link, CheckCheck
} from 'lucide-react';
import api from '../../services/api';
import { useLocation, useNavigate } from 'react-router-dom';

// ── Helpers ───────────────────────────────────────────────────

const getTimeIcon = (time = '') => {
  const t = time.toLowerCase();
  if (t === 'morning') return <Sun className="text-orange-400" size={20} />;
  if (t === 'afternoon') return <Sunset className="text-pink-400" size={20} />;
  return <Moon className="text-indigo-400" size={20} />;
};

const getActivityIcon = (type = '') => {
  const t = type.toLowerCase();
  if (t === 'restaurant') return <Utensils size={16} className="text-emerald-500" />;
  if (t === 'cafe') return <Coffee size={16} className="text-amber-500" />;
  if (t === 'indoor') return <Landmark size={16} className="text-violet-500" />;
  if (t === 'nature') return <TreePine size={16} className="text-green-500" />;
  if (t === 'adventure') return <Tent size={16} className="text-sky-500" />;
  if (t === 'cultural') return <Landmark size={16} className="text-rose-500" />;
  if (t === 'shopping') return <ShoppingBag size={16} className="text-purple-500" />;
  return <Compass size={16} className="text-blue-500" />;
};

const getActivityBadge = (type = '') => {
  const styles = {
    restaurant: 'bg-emerald-100 text-emerald-700',
    cafe: 'bg-amber-100   text-amber-700',
    indoor: 'bg-violet-100  text-violet-700',
    nature: 'bg-green-100   text-green-700',
    adventure: 'bg-sky-100     text-sky-700',
    cultural: 'bg-rose-100    text-rose-700',
    tourist_spot: 'bg-blue-100    text-blue-700',
    shopping: 'bg-purple-100  text-purple-700',
  };
  return styles[type?.toLowerCase()] || 'bg-gray-100 text-gray-600';
};

const WeatherIcon = ({ condition = '', size = 20 }) => {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower'))
    return <CloudRain size={size} className="text-blue-400" />;
  if (c.includes('snow')) return <CloudSnow size={size} className="text-cyan-300" />;
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog'))
    return <Cloud size={size} className="text-gray-400" />;
  if (c.includes('thunder')) return <AlertTriangle size={size} className="text-yellow-400" />;
  return <Sun size={size} className="text-orange-400" />;
};

const WeatherBadge = ({ weather }) => {
  if (!weather) return null;
  const isBad = weather.is_bad_weather;
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold ${isBad ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-100'
      }`}>
      <WeatherIcon condition={weather.condition} size={18} />
      <span className={isBad ? 'text-blue-700' : 'text-orange-700'}>
        {weather.condition}
      </span>
      <span className="opacity-60">
        {weather.temp_min}°–{weather.temp_max}°C
      </span>
      {weather.rain_mm > 0 && (
        <span className="text-blue-600 font-black text-xs">{weather.rain_mm}mm rain</span>
      )}
      {isBad && (
        <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase tracking-wide">
          Indoor Day
        </span>
      )}
    </div>
  );
};

// ── Budget Tracker ────────────────────────────────────────────

const BudgetTracker = ({ days }) => {
  const total = days.reduce((sum, d) =>
    d.activities.reduce((s, a) => {
      const costStr = String(a.estimated_cost || '0').replace(/[^0-9.]/g, '');
      return s + (parseFloat(costStr) || 0);
    }, sum), 0
  );
  return (
    <div className="px-6 py-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600 opacity-70">Estimated Total Spend</p>
        <p className="text-3xl font-black text-emerald-700">Rs. {total.toLocaleString()}</p>
      </div>
      <CheckCircle className="text-emerald-400 ml-auto" size={28} />
    </div>
  );
};

// ── Activity Card ─────────────────────────────────────────────

const ActivityCard = ({ item, dayNumber, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(item);
  const isRestaurant = item.is_restaurant || ['restaurant', 'cafe'].includes(item.activity_type?.toLowerCase());

  const handleSave = () => {
    onUpdate(dayNumber, editForm);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      className={`p-5 rounded-3xl border transition-all group ${isRestaurant
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white/60'
          : item.indoor
            ? 'border-violet-100 bg-gradient-to-br from-violet-50/40 to-white/40'
            : 'border-[var(--primary)]/8 bg-[var(--card-theme)]'
        } shadow-sm hover:shadow-md`}
    >
      <div className="flex gap-4 items-start">
        {/* Time Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-black/5 mt-0.5">
          {getTimeIcon(item.time_of_day)}
        </div>

        <div className="flex-1 min-w-0 pr-6 relative">
          {(!isEditing) && (
            <div className="absolute top-0 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-black/5 rounded-lg text-black/40 hover:text-[var(--primary)] transition-colors"><Edit3 size={14} /></button>
              <button onClick={() => onDelete(dayNumber, item.id)} className="p-1.5 hover:bg-black/5 rounded-lg text-black/40 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3 mt-2 pr-2">
              <input
                className="w-full text-base font-black px-3 py-2 bg-black/5 rounded-lg border-2 border-transparent focus:border-[var(--primary)]/50 outline-none"
                value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              />
              <textarea
                className="w-full text-sm mt-2 font-bold px-3 py-2 bg-black/5 rounded-lg border-2 border-transparent focus:border-[var(--primary)]/50 outline-none"
                value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-50 block mb-1">Time Slot</label>
                  <input className="w-full font-bold px-3 py-1.5 bg-black/5 rounded-lg outline-none text-xs" value={editForm.time_slot} onChange={e => setEditForm({ ...editForm, time_slot: e.target.value })} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-50 block mb-1">Cost (Rs)</label>
                  <input className="w-full font-bold px-3 py-1.5 bg-black/5 rounded-lg outline-none text-xs" value={editForm.estimated_cost} onChange={e => setEditForm({ ...editForm, estimated_cost: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-2 border-t border-black/5">
                <button onClick={handleSave} className="flex-1 bg-[var(--primary)] text-white text-xs font-black py-2 rounded-lg flex items-center justify-center gap-2"><Save size={14} /> SAVE</button>
                <button onClick={() => { setIsEditing(false); setEditForm(item); }} className="flex-1 bg-black/10 text-black/60 hover:bg-black/20 text-xs font-black py-2 rounded-lg flex items-center justify-center gap-2"><X size={14} /> CANCEL</button>
              </div>
            </div>
          ) : (
            <>
              {/* Time slot + badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {item.time_slot && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">
                    {item.time_slot}
                  </span>
                )}
                {item.activity_type && (
                  <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getActivityBadge(item.activity_type)}`}>
                    {getActivityIcon(item.activity_type)}
                    {item.activity_type.replace('_', ' ')}
                  </span>
                )}
              </div>

              <h4 className="font-black text-base mb-1 group-hover:text-[var(--primary)] transition-colors leading-tight">
                {item.title}
              </h4>

              <p className={`text-sm opacity-60 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                {item.description}
              </p>

              {/* Extra details for restaurants/cafes */}
              {(item.must_try || item.cuisine_or_category) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.cuisine_or_category && (
                    <span className="text-xs font-bold opacity-50">🍽️ {item.cuisine_or_category}</span>
                  )}
                  {item.must_try && (
                    <span className="text-xs font-black text-emerald-600">⭐ Try: {item.must_try}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg">
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
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────

const ItineraryEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { itinerary = { days: [] }, weather_available } = location.state || {};
  const [activeDay, setActiveDay] = useState(null);
  const [days, setDays] = useState(itinerary.days || []);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleUpdateAct = async (dayNum, act) => {
    try {
      if (act.id) await api.patch(`activities/${act.id}/`, act);
      setDays(prev => prev.map(d => d.day_number === dayNum ? { ...d, activities: d.activities.map(a => a.id === act.id ? act : a) } : d));
    } catch (e) { console.error("Update failed", e); }
  };

  const handleDeleteAct = async (dayNum, actId) => {
    try {
      if (actId) await api.delete(`activities/${actId}/`);
      setDays(prev => prev.map(d => d.day_number === dayNum ? { ...d, activities: d.activities.filter(a => a.id !== actId) } : d));
    } catch (e) { console.error("Delete failed", e); }
  };

  /** Toggle the public sharing link. Copies URL to clipboard on enable. */
  const handleToggleShare = async () => {
    const tripId = location.state?.trip_id;
    if (!tripId) return;
    try {
      const res = await api.post(`trips/${tripId}/toggle_share/`);
      setIsPublic(res.data.is_public);
      if (res.data.is_public) {
        const shareUrl = `${window.location.origin}/share/${tripId}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) { console.error("Share toggle failed", e); }
  };

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto" style={{ background: 'var(--bg-theme)' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="inline-block mb-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)]">
              AI-Crafted Itinerary
            </span>
            <h1 className="text-5xl font-black tracking-tighter" style={{ color: 'var(--text-theme)' }}>
              {itinerary.destination || 'Your Itinerary'}
            </h1>
            <p className="font-bold opacity-50 mt-2">
              {days.length}-day trip
              {itinerary.travel_style && itinerary.travel_style !== 'Balanced' && (
                <> · Style: <span className="text-[var(--primary)]">{itinerary.travel_style}</span></>
              )}
              {weather_available && (
                <span className="ml-3 text-emerald-500">· 🌤️ Live weather included</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Share button: enables public link and copies URL */}
            {location.state?.trip_id && (
              <button
                onClick={handleToggleShare}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-all ${isPublic ? 'bg-emerald-500 text-white' : 'bg-black/5 hover:bg-black/10'
                  }`}
              >
                {copied ? <><CheckCheck size={16} /> Copied!</> : isPublic ? <><Link size={16} /> Shared</> : <><Share2 size={16} /> Share</>}
              </button>
            )}
            <button
              onClick={() => navigate('/map', { state: { itinerary } })}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white shadow-lg hover:scale-105 transition-transform"
              style={{ background: 'var(--primary)' }}
            >
              <MapIcon size={16} /> View on Map
            </button>
          </div>
        </div>

        {/* Budget tracker */}
        {days.length > 0 && (
          <div className="mt-6">
            <BudgetTracker days={days} />
          </div>
        )}
      </motion.header>

      {/* ── Empty State ─────────────────────────────────────── */}
      {days.length === 0 && (
        <div className="text-center py-24 opacity-40">
          <p className="text-3xl font-black">No itinerary data.</p>
          <p className="font-bold mt-2">Go back and generate a new one.</p>
        </div>
      )}

      {/* ── Day Tabs (for long trips) ──────────────────────── */}
      {days.length > 4 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
          <button
            onClick={() => setActiveDay(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-black transition-all ${activeDay === null ? 'bg-[var(--primary)] text-white' : 'opacity-40 hover:opacity-70'
              }`}
          >
            All Days
          </button>
          {days.map(d => (
            <button
              key={d.day_number}
              onClick={() => setActiveDay(d.day_number === activeDay ? null : d.day_number)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-black transition-all ${activeDay === d.day_number ? 'bg-[var(--primary)] text-white' : 'opacity-40 hover:opacity-70'
                }`}
            >
              Day {d.day_number}
            </button>
          ))}
        </div>
      )}

      {/* ── Days ────────────────────────────────────────────── */}
      <div className="space-y-14">
        {days
          .filter(d => activeDay === null || d.day_number === activeDay)
          .map((d, i) => (
            <motion.section
              key={d.day_number}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Day Header */}
              <div className="flex flex-wrap items-center gap-4 mb-5">
                <span className="w-14 h-14 rounded-2xl font-black text-xl text-white flex items-center justify-center shadow-lg"
                  style={{ background: 'var(--primary)' }}>
                  {String(d.day_number).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-2xl font-black">Day {d.day_number}</h3>
                  {d.date && (
                    <p className="text-sm opacity-40 font-bold">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                {/* Weather Badge */}
                {d.weather && <WeatherBadge weather={d.weather} />}
              </div>

              {/* Indoor Warning Banner */}
              {d.weather?.is_bad_weather && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 px-5 py-3 rounded-2xl flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold"
                >
                  <CloudRain size={18} />
                  Weather advisory: This day has rain/bad weather. Indoor alternatives have been prioritized.
                </motion.div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-4 ml-4 border-l-2 border-[var(--primary)]/15 pl-8">
                <AnimatePresence>
                  {(d.activities || []).map((act, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                    >
                      {/* Section label (Morning/Afternoon/Evening) */}
                      {idx === 0 || act.time_of_day !== d.activities[idx - 1]?.time_of_day ? (
                        <div className="flex items-center gap-2 mb-3 mt-1">
                          {getTimeIcon(act.time_of_day)}
                          <span className="text-xs font-black uppercase tracking-widest opacity-50">
                            {act.time_of_day}
                          </span>
                        </div>
                      ) : null}
                      <ActivityCard
                        item={act}
                        dayNumber={d.day_number}
                        onUpdate={handleUpdateAct}
                        onDelete={handleDeleteAct}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          ))}
      </div>

      {/* ── Bottom Actions ────────────────────────────────── */}
      <div className="mt-16 flex flex-wrap gap-4">
        <button
          onClick={() => navigate('/planner')}
          className="px-8 py-4 rounded-2xl font-black border-2 opacity-50 hover:opacity-80 transition-opacity"
          style={{ borderColor: 'rgba(0,0,0,0.1)' }}
        >
          ← Plan Another Trip
        </button>
        <button
          onClick={() => navigate('/map', { state: { itinerary } })}
          className="px-8 py-4 rounded-2xl font-black text-white shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          style={{ background: 'var(--primary)' }}
        >
          <MapIcon size={18} /> Open Interactive Map
        </button>
      </div>
    </div>
  );
};

export default ItineraryEditor;