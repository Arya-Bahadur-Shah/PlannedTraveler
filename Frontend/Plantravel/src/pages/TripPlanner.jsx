import React from 'react';
import { Calendar as CalendarIcon, MapPin, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';

const TripPlanner = () => {
  const navigate = useNavigate();
  const { tripData, setTripData } = useTrip();

  return (
    <div className="p-12 max-w-4xl mx-auto">
      <h1 className="text-5xl font-black tracking-tight mb-2">Initiate Trip</h1>
      <div className="space-y-8 bg-[var(--card-theme)] p-10 rounded-[3.5rem] shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" placeholder="Destination" 
            value={tripData.destination}
            onChange={(e) => setTripData({...tripData, destination: e.target.value})}
            className="w-full p-5 rounded-2xl bg-black/5 outline-none" />
          
          <select value={tripData.group_size} onChange={(e) => setTripData({...tripData, group_size: e.target.value})} className="w-full p-5 rounded-2xl bg-black/5 outline-none">
            <option>Solo Explorer</option>
            <option>Couple</option>
            <option>Family (3-5)</option>
            <option>Large Group (6+)</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="date" value={tripData.start_date} onChange={(e) => setTripData({...tripData, start_date: e.target.value})} className="w-full p-5 rounded-2xl bg-black/5 outline-none" />
          <input type="date" value={tripData.end_date} onChange={(e) => setTripData({...tripData, end_date: e.target.value})} className="w-full p-5 rounded-2xl bg-black/5 outline-none" />
        </div>
        <button onClick={() => navigate('/budget')} className="w-full py-6 bg-[var(--primary)] text-white font-black rounded-3xl mt-6">
          Proceed to Budgeting <ArrowRight />
        </button>
      </div>
    </div>
  );
};

export default TripPlanner;