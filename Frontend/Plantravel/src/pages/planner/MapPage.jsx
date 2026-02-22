import React from 'react';
import { MapPin, Navigation, Info } from 'lucide-react';

const MapPage = () => {
  return (
    <div className="h-screen w-full p-8 flex gap-8">
      {/* Map Placeholder */}
      <div className="flex-1 bg-slate-200 rounded-[3rem] relative overflow-hidden shadow-inner border-4 border-white">
        <div className="absolute inset-0 flex items-center justify-center flex-col opacity-20">
          <Navigation size={64} className="animate-bounce" />
          <p className="font-black uppercase tracking-[1em]">Map Engine Loading</p>
        </div>
        
        {/* Mock Markers */}
        <div className="absolute top-1/3 left-1/2 p-2 bg-white rounded-full shadow-xl">
           <MapPin className="text-[var(--primary)]" fill="var(--primary)"/>
        </div>
      </div>

      {/* Map Sidebar */}
      <div className="w-80 space-y-6">
        <div className="p-8 rounded-[2.5rem] bg-[var(--card-theme)] shadow-lg">
          <h3 className="font-black text-xl mb-4">Route Info</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <span className="text-xs font-bold opacity-40 uppercase">Distance</span>
                <span className="font-black">12.4 km</span>
             </div>
             <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <span className="text-xs font-bold opacity-40 uppercase">Next Stop</span>
                <span className="font-black">Peace Pagoda</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;