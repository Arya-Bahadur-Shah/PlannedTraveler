import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ShieldAlert } from 'lucide-react';

const Moderation = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = () => {
    api.get('reports/').then(res => setReports(res.data.filter(r => !r.is_resolved)));
  };

  const handleAction = async (id, action) => {
    await api.post(`reports/${id}/${action}/`);
    fetchReports();
  };

  return (
    <div className="p-12 min-h-screen" style={{ backgroundColor: 'var(--bg-theme)', color: 'var(--text-theme)' }}>
      <h2 className="text-4xl font-black mb-12 flex items-center gap-4">
        <ShieldAlert className="text-orange-500" /> Moderation Queue
      </h2>

      <div className="space-y-4">
        {reports.length === 0 && <p className="opacity-50 font-bold">Queue is clear! All good.</p>}
        {reports.map(r => (
          <div key={r.id} className="p-8 bg-[var(--card-theme)] border border-[var(--primary)]/10 rounded-[2.5rem] flex justify-between items-center shadow-md">
            <div>
              <p className="text-[var(--primary)] font-bold mb-1">Flagged Post: {r.post_title}</p>
              <p className="text-sm opacity-60">Reason: {r.reason}</p>
              <p className="text-[10px] uppercase font-black tracking-widest mt-2 opacity-40">Reporter: {r.reported_by_name}</p>
            </div>
            <div className="flex gap-4">
               <button onClick={() => handleAction(r.id, 'resolve')} className="px-6 py-3 bg-emerald-500/10 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-500/20">Dismiss/Resolve</button>
               <button onClick={() => handleAction(r.id, 'block_post')} className="px-6 py-3 bg-red-500/10 text-red-600 rounded-xl font-bold text-xs hover:bg-red-500/20">Block Post</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Moderation;