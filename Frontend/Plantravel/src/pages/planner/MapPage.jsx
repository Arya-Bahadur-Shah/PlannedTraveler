import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowLeft, Navigation, Filter, X } from 'lucide-react';

// ── Custom numbered marker factory ───────────────────────────────
const DAY_COLORS = [
  '#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6',
  '#ef4444','#8b5cf6','#06b6d4','#84cc16','#f97316',
];

const makeNumberedIcon = (num, color) => L.divIcon({
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
  html: `<div style="
    width:34px;height:34px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid white;
    box-shadow:0 4px 14px ${color}88;
    display:flex;align-items:center;justify-content:center;
    font-weight:900;font-size:13px;color:white;transform:rotate(-45deg);
  "><span style="transform:rotate(45deg)">${num}</span></div>`
});

// ── Fly-to helper ─────────────────────────────────────────────────
const FlyTo = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 14, { animate: true, duration: 1.2 });
  }, [target, map]);
  return null;
};

// ── Fit-bounds helper ─────────────────────────────────────────────
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points.map(p => [p.latitude, p.longitude]), { padding: [60, 60] });
    }
  }, [points, map]);
  return null;
};

const MapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [allActivities, setAllActivities] = useState([]);
  const [days, setDays] = useState([]);
  const [activeDay, setActiveDay] = useState(null); // null = all days
  const [flyTarget, setFlyTarget] = useState(null);
  const [activePin, setActivePin] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    if (location.state?.itinerary) {
      const itinerary = location.state.itinerary;
      const acts = [];
      itinerary.days?.forEach(day => {
        day.activities?.forEach(act => {
          if (act.latitude && act.longitude) {
            acts.push({ ...act, day: day.day_number });
          }
        });
      });
      setAllActivities(acts);
      setDays(itinerary.days?.map(d => d.day_number) || []);
    }
  }, [location]);

  const filtered = activeDay === null
    ? allActivities
    : allActivities.filter(a => a.day === activeDay);

  const polylinePoints = filtered.map(a => [a.latitude, a.longitude]);

  const handleMarkerClick = (act, idx) => {
    setActivePin(idx);
    setFlyTarget([act.latitude, act.longitude]);
  };

  const dayColor = (dayNum) => DAY_COLORS[(dayNum - 1) % DAY_COLORS.length];

  return (
    <div className="h-screen w-full flex flex-col" style={{ background: 'var(--bg-theme)' }}>
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-4 px-6 py-4 z-[1001] relative"
        style={{ background: 'var(--card-theme)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-2xl hover:scale-105 transition-all shadow-sm"
          style={{ background: 'var(--bg-theme)', color: 'var(--primary)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-xl tracking-tight">Route Map</h1>
          <p className="text-xs opacity-40 font-bold">{filtered.length} locations plotted</p>
        </div>

        {/* Day Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveDay(null)}
            className="flex-shrink-0 px-4 py-2 rounded-full font-black text-xs transition-all"
            style={activeDay === null
              ? { background: 'var(--primary)', color: 'white' }
              : { background: 'rgba(0,0,0,0.06)', color: 'var(--text-theme)' }}
          >
            All
          </button>
          {days.map(d => (
            <button
              key={d}
              onClick={() => setActiveDay(activeDay === d ? null : d)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs transition-all"
              style={activeDay === d
                ? { background: dayColor(d), color: 'white' }
                : { background: 'rgba(0,0,0,0.06)', color: 'var(--text-theme)' }}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: dayColor(d) }} />
              Day {d}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Map + Sidebar ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-80 flex-shrink-0 overflow-y-auto border-r"
          style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.06)' }}
        >
          {filtered.length === 0 ? (
            <div className="p-8 text-center opacity-40">
              <MapPin size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-black">No activities for this day</p>
            </div>
          ) : (
            <div className="p-4 space-y-2 relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[28px] top-8 bottom-8 w-0.5 opacity-10"
                style={{ background: 'var(--primary)' }} />

              {filtered.map((act, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleMarkerClick(act, i)}
                  className="relative flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: activePin === i ? `${dayColor(act.day)}18` : 'transparent',
                    borderLeft: activePin === i ? `3px solid ${dayColor(act.day)}` : '3px solid transparent'
                  }}
                >
                  {/* Numbered circle */}
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-md mt-0.5 z-10"
                    style={{ background: dayColor(act.day) }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase opacity-40 tracking-widest block">
                      Day {act.day} · {act.time_of_day}
                    </span>
                    <p className="font-black text-sm leading-tight mt-0.5 truncate">{act.title}</p>
                    {act.estimated_cost && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md mt-1 inline-block bg-emerald-100 text-emerald-700">
                        Rs. {act.estimated_cost}
                      </span>
                    )}
                  </div>
                  {activePin === i && (
                    <Navigation size={14} style={{ color: dayColor(act.day) }} className="flex-shrink-0 mt-1" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {filtered.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center opacity-30">
              <div className="text-center">
                <MapPin size={48} className="mx-auto mb-4" />
                <p className="font-black text-xl">No locations to display</p>
                <p className="font-bold mt-2">Generate an itinerary first</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={[filtered[0].latitude, filtered[0].longitude]}
              zoom={12}
              className="w-full h-full"
              style={{ zIndex: 0 }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <FitBounds points={filtered} />
              {flyTarget && <FlyTo target={flyTarget} />}

              {/* Polyline route */}
              {polylinePoints.length > 1 && (
                <Polyline
                  positions={polylinePoints}
                  pathOptions={{
                    color: activeDay ? dayColor(activeDay) : '#6366f1',
                    weight: 3,
                    opacity: 0.65,
                    dashArray: '8, 6'
                  }}
                />
              )}

              {/* Markers */}
              {filtered.map((act, i) => (
                <Marker
                  key={i}
                  position={[act.latitude, act.longitude]}
                  icon={makeNumberedIcon(i + 1, dayColor(act.day))}
                  ref={el => { markerRefs.current[i] = el; }}
                  eventHandlers={{ click: () => handleMarkerClick(act, i) }}
                >
                  <Popup className="rounded-2xl" maxWidth={260}>
                    <div className="p-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-white"
                          style={{ background: dayColor(act.day) }}
                        >
                          Day {act.day} · {act.time_of_day}
                        </span>
                      </div>
                      <h3 className="font-black text-base leading-tight mb-1">{act.title}</h3>
                      <p className="text-xs opacity-60 leading-relaxed mb-2 line-clamp-3">{act.description}</p>
                      {act.estimated_cost && (
                        <span className="text-xs font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 inline-block">
                          Est. Rs. {act.estimated_cost}
                        </span>
                      )}
                      {act.transport_tip && (
                        <p className="text-[10px] opacity-40 font-bold mt-2">🚌 {act.transport_tip}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;