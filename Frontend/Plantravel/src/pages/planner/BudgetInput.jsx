import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import api from '../../services/api';

const BudgetInput = () => {
  const navigate = useNavigate();
  const { tripData, setTripData } = useTrip();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!tripData.destination || !tripData.start_date || !tripData.end_date || !tripData.budget) {
        alert("Please fill in all details (Destination, Dates, Budget).");
        return;
    }
    setLoading(true);
    try {
      const res = await api.post('trips/generate-itinerary/', tripData);
      navigate('/itinerary-editor', { state: { itinerary: res.data.itinerary } });
    } catch (err) {
      alert("Error generating itinerary. Please check the AI config.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto">
      <h1 className="text-5xl font-black tracking-tight mb-12" style={{ color: 'var(--text-theme)' }}>Travel Resources</h1>
      
      <div className="bg-[var(--card-theme)] p-10 rounded-[3rem] border border-[var(--primary)]/10">
        <label className="block text-sm font-black uppercase tracking-widest opacity-40 mb-4">Total Estimated Budget (NPR)</label>
        <div className="flex items-center gap-4 mb-10">
          <span className="text-4xl font-black">Rs.</span>
          <input type="number" placeholder="50000" 
            value={tripData.budget} onChange={e => setTripData({...tripData, budget: e.target.value})}
            className="text-6xl font-black bg-transparent outline-none w-full border-b-4 border-[var(--primary)]" />
        </div>

        <button disabled={loading} onClick={handleGenerate} className="w-full py-6 rounded-3xl bg-[var(--primary)] text-white font-black text-xl flex items-center justify-center gap-3 hover:shadow-2xl transition-all disabled:opacity-50">
          {loading ? <><Loader2 className="animate-spin"/> Initializing AI Core...</> : <>Generate AI Itinerary <Sparkles /></>}
        </button>
      </div>
    </div>
  );
};

export default BudgetInput;