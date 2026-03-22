import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, ArrowLeft } from 'lucide-react';

// Fix for default Leaflet marker icons not showing in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to recenter map automatically based on markers
const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center, 12);
  return null;
};

const MapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [center, setCenter] = useState([28.2096, 83.9856]); 

  useEffect(() => {
    // Get AI generated data passed from the Itinerary Editor
    if (location.state && location.state.itinerary) {
      let allActivities = [];
      location.state.itinerary.days.forEach(day => {
        day.activities.forEach(act => {
          if (act.latitude && act.longitude) {
            allActivities.push({...act, day: day.day_number});
          }
        });
      });
      setActivities(allActivities);
      
      // Center map on the first activity
      if (allActivities.length > 0) {
        setCenter([allActivities[0].latitude, allActivities[0].longitude]);
      }
    }
  }, [location]);

  return (
    <div className="h-screen w-full p-8 flex flex-col md:flex-row gap-8 relative">
      
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="absolute top-12 left-12 z-[1000] p-4 bg-white/90 backdrop-blur rounded-full shadow-xl text-[var(--primary)] hover:scale-105 transition-all">
        <ArrowLeft />
      </button>

      {/* The Actual Map */}
      <div className="flex-1 bg-slate-200 rounded-[3rem] relative overflow-hidden shadow-inner border-4 border-white z-0">
        <MapContainer center={center} zoom={12} className="w-full h-full">
          <ChangeView center={center} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          
          {activities.map((act, index) => (
            <Marker key={index} position={[act.latitude, act.longitude]}>
              <Popup className="rounded-2xl">
                <div className="p-2">
                  <span className="text-[10px] font-black uppercase text-[var(--primary)] tracking-widest">Day {act.day} • {act.time_of_day}</span>
                  <h3 className="font-bold text-lg leading-tight mt-1">{act.title}</h3>
                  <p className="text-sm opacity-70 mt-2">{act.description}</p>
                  <p className="text-xs font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md mt-3 inline-block">Est. {act.estimated_cost}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Map Sidebar */}
      <div className="w-full md:w-96 space-y-6 h-full overflow-y-auto pr-2 pb-20">
        <div className="p-8 rounded-[2.5rem] bg-[var(--card-theme)] shadow-lg">
          <h3 className="font-black text-2xl mb-2">Route Map</h3>
          <p className="opacity-50 font-bold mb-6 text-sm">Interactive overview of your AI-generated journey.</p>
          
          <div className="space-y-4 relative">
            {/* Connecting Line Design */}
            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-[var(--primary)]/20 z-0"></div>

            {activities.length > 0 ? activities.map((act, i) => (
              <div key={i} className="flex gap-4 items-start relative z-10 bg-[var(--card-theme)] p-2 rounded-xl cursor-pointer hover:bg-black/5 transition-all" onClick={() => setCenter([act.latitude, act.longitude])}>
                <div className="w-6 h-6 mt-1 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-md shadow-[var(--primary)]/30">
                  <MapPin size={12} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">Day {act.day}</span>
                  <h4 className="font-bold text-sm leading-tight">{act.title}</h4>
                </div>
              </div>
            )) : (
              <p className="opacity-40 italic font-bold text-sm">No map data available. Generate an itinerary first.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;