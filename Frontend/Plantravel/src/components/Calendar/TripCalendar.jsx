import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react';

const TRIP_COLORS = [
  { bg: '#6366f1', light: '#eef2ff' },
  { bg: '#ec4899', light: '#fdf2f8' },
  { bg: '#10b981', light: '#ecfdf5' },
  { bg: '#f59e0b', light: '#fffbeb' },
  { bg: '#3b82f6', light: '#eff6ff' },
  { bg: '#8b5cf6', light: '#f5f3ff' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TripCalendar = ({ trips = [] }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredTrip, setHoveredTrip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Assign colors to trips
  const tripsWithColor = useMemo(() =>
    trips.map((t, i) => ({ ...t, color: TRIP_COLORS[i % TRIP_COLORS.length] })),
    [trips]
  );

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDay + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return new Date(year, month, dayNum);
  });

  // Find trips active on a given date
  const getTripsForDate = (date) => {
    if (!date) return [];
    return tripsWithColor.filter(t => {
      if (!t.start_date || !t.end_date) return false;
      const start = new Date(t.start_date + 'T00:00:00');
      const end = new Date(t.end_date + 'T23:59:59');
      return date >= start && date <= end;
    });
  };

  const isToday = (date) => date && date.toDateString() === today.toDateString();

  const handleCellMouseEnter = (trip, e) => {
    setHoveredTrip(trip);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="rounded-[2.5rem] overflow-hidden border shadow-lg" style={{ background: 'var(--card-theme)', borderColor: 'rgba(0,0,0,0.07)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2">
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          <h3 className="font-black text-lg" style={{ color: 'var(--text-theme)' }}>Trip Calendar</h3>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-black/5 transition-colors opacity-60 hover:opacity-100">
            <ChevronLeft size={18} style={{ color: 'var(--text-theme)' }} />
          </button>
          <span className="font-black text-sm min-w-[120px] text-center" style={{ color: 'var(--text-theme)' }}>
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-black/5 transition-colors opacity-60 hover:opacity-100">
            <ChevronRight size={18} style={{ color: 'var(--text-theme)' }} />
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Day Labels */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest opacity-30 py-2" style={{ color: 'var(--text-theme)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, idx) => {
            const dayTrips = getTripsForDate(date);
            const todayCell = isToday(date);

            return (
              <div key={idx} className="relative min-h-[52px] rounded-xl p-1 transition-colors"
                style={{ background: todayCell ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                {/* Day number */}
                {date && (
                  <span className={`block text-center text-xs font-black mb-1 w-6 h-6 rounded-full flex items-center justify-center mx-auto transition-colors ${
                    todayCell ? 'text-white' : 'opacity-50'
                  }`}
                    style={{
                      background: todayCell ? 'var(--primary)' : 'transparent',
                      color: todayCell ? 'white' : 'var(--text-theme)',
                    }}>
                    {date.getDate()}
                  </span>
                )}

                {/* Trip event bars */}
                {date && dayTrips.slice(0, 2).map((trip, ti) => (
                  <motion.div
                    key={ti}
                    whileHover={{ scale: 1.05 }}
                    onMouseEnter={(e) => handleCellMouseEnter(trip, e)}
                    onMouseLeave={() => setHoveredTrip(null)}
                    className="w-full mb-0.5 rounded-md px-1 cursor-pointer truncate"
                    style={{ background: trip.color.bg, height: '14px' }}
                    title={trip.destination}
                  />
                ))}
                {date && dayTrips.length > 2 && (
                  <span className="text-[9px] font-black opacity-50 ml-1">+{dayTrips.length - 2}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {tripsWithColor.length > 0 && (
          <div className="mt-5 pt-4 border-t flex flex-wrap gap-3" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            {tripsWithColor.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.color.bg }} />
                <span className="text-[10px] font-black opacity-50 truncate max-w-[80px]" style={{ color: 'var(--text-theme)' }}>
                  {t.destination}
                </span>
              </div>
            ))}
          </div>
        )}

        {trips.length === 0 && (
          <div className="text-center py-6 opacity-30">
            <MapPin size={24} className="mx-auto mb-2" />
            <p className="text-xs font-black">No trips planned yet.</p>
            <p className="text-xs font-medium mt-1">Generate your first itinerary!</p>
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredTrip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[9999] pointer-events-none"
            style={{ top: tooltipPos.y - 80, left: tooltipPos.x + 12 }}
          >
            <div className="px-4 py-3 rounded-2xl shadow-2xl text-white text-xs font-black min-w-[160px]"
              style={{ background: hoveredTrip.color.bg }}>
              <p className="text-base mb-1">{hoveredTrip.destination}</p>
              <p className="opacity-80 font-medium">
                {hoveredTrip.start_date} → {hoveredTrip.end_date}
              </p>
              {hoveredTrip.budget && (
                <p className="opacity-70 mt-0.5 font-medium">Budget: Rs. {Number(hoveredTrip.budget).toLocaleString()}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripCalendar;
