import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import MapSearchBox from '../../components/Map/MapSearchBox';
import DateRangePicker from '../../components/Calendar/DateRangePicker';

const CalendarPlanner = () => {
  const navigate = useNavigate();
  const { tripData, setTripData } = useTrip();

  const handleSelectLocation = (location) => {
    setTripData({ ...tripData, destination: location.name });
  };

  const handleDateChange = (ranges) => {
    setTripData({
      ...tripData,
      start_date: ranges.startDate,
      end_date: ranges.endDate
    });
  };

  const canProceed = tripData.destination && tripData.start_date && tripData.end_date;

  return (
    <div className="p-8 md:p-16 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Step indicator */}
        <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)]">
          Step 1 of 3 — Destination & Dates
        </span>

        <h1 className="text-5xl font-black tracking-tight mb-3" style={{ color: 'var(--text-theme)' }}>
          Start Your Escape
        </h1>
        <p className="opacity-60 font-bold mb-12">
          Define your destination and travel window. Then we'll tune the AI to your vibe.
        </p>

        <div className="space-y-8">
          {/* Map Input */}
          <div className="bg-[var(--card-theme)] p-8 rounded-[3rem] border border-[var(--primary)]/10 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Where would you like to explore?</h2>
            <MapSearchBox destination={tripData.destination} onSelect={handleSelectLocation} />
          </div>

          {/* Calendar Grid Input */}
          <div className="bg-[var(--card-theme)] p-8 rounded-[3rem] border border-[var(--primary)]/10 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Select your travel dates</h2>
            <DateRangePicker
              startDate={tripData.start_date}
              endDate={tripData.end_date}
              onChange={handleDateChange}
            />
          </div>

          {/* Proceed — now goes to /vibe */}
          <motion.button
            whileHover={{ scale: canProceed ? 1.02 : 1 }}
            whileTap={{ scale: canProceed ? 0.98 : 1 }}
            onClick={() => canProceed && navigate('/vibe')}
            disabled={!canProceed}
            className="w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 text-white transition-all shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canProceed
                ? 'linear-gradient(135deg, var(--primary), #7c3aed)'
                : 'rgba(0,0,0,0.15)'
            }}
          >
            {canProceed ? 'Choose Your Vibe' : 'Select destination & dates first'}
            {canProceed && <ArrowRight size={22} />}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default CalendarPlanner;