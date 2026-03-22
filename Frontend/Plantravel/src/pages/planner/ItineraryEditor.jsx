import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Sunset, Moon, Map as MapIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const ItineraryEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const itinerary = location.state?.itinerary || { days: [] };

  const getIcon = (time) => {
    if (time.toLowerCase() === 'morning') return <Sun className="text-orange-400"/>;
    if (time.toLowerCase() === 'afternoon') return <Sunset className="text-pink-400"/>;
    return <Moon className="text-indigo-400"/>;
  };

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto">
      <header className="flex justify-between items-end mb-16">
        <div>
          <h1 className="text-5xl font-black tracking-tighter">Your Itinerary</h1>
          <p className="font-bold opacity-50">Customized by AI for your {itinerary.days.length} day trip.</p>
        </div>
        <button onClick={() => navigate('/map', { state: { itinerary } })} className="px-6 py-3 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform">
          <MapIcon size={16}/> View Interactive Map
        </button>
      </header>

      {itinerary.days.map((d, i) => (
        <motion.div key={i} className="mb-12">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center">0{d.day_number}</span>
            Day {d.day_number}
          </h3>
          
          <div className="space-y-4 ml-6 border-l-2 border-[var(--primary)]/20 pl-10">
            {d.activities.map((item, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-[var(--card-theme)] border border-[var(--primary)]/5 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                <div className="flex gap-6 items-center">
                  <div className="opacity-60">{getIcon(item.time_of_day)}</div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">{item.time_of_day}</p>
                    <p className="font-bold text-lg">{item.title}</p>
                    <p className="text-sm opacity-60 mt-1 max-w-xl">{item.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-md">
                      Est. {item.estimated_cost}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ItineraryEditor;