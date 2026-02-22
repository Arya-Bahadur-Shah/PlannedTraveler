import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Sunset, Moon, Edit3, Trash2, Plus } from 'lucide-react';

const ItineraryEditor = () => {
  const days = [
    { day: 1, title: "Arrival & Lakeside Breeze", items: [
      { time: "Morning", activity: "Check-in at Lake View Lodge", icon: <Sun className="text-orange-400"/> },
      { time: "Afternoon", activity: "Boating in Fewa Lake & Tal Barahi", icon: <Sunset className="text-pink-400"/> },
      { time: "Evening", activity: "Lakeside Dinner with Folk Music", icon: <Moon className="text-indigo-400"/> },
    ]}
  ];

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto">
      <header className="flex justify-between items-end mb-16">
        <div>
          <h1 className="text-5xl font-black tracking-tighter">Your Itinerary</h1>
          <p className="font-bold opacity-50">Customized by AI for your {days.length} day trip.</p>
        </div>
        <button className="px-6 py-3 rounded-full bg-[var(--primary)] text-white font-bold text-sm flex items-center gap-2">
          <Plus size={16}/> Add Day
        </button>
      </header>

      {days.map((d, i) => (
        <motion.div key={i} className="mb-12">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center">0{d.day}</span>
            {d.title}
          </h3>
          
          <div className="space-y-4 ml-6 border-l-2 border-[var(--primary)]/20 pl-10">
            {d.items.map((item, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-[var(--card-theme)] border border-[var(--primary)]/5 flex justify-between items-center group">
                <div className="flex gap-6 items-center">
                  <div className="opacity-60">{item.icon}</div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">{item.time}</p>
                    <p className="font-bold text-lg">{item.activity}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-black/5 rounded-lg"><Edit3 size={16}/></button>
                  <button className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16}/></button>
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