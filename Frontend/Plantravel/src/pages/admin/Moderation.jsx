import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';

const Moderation = () => {
  const [reports, setReports] = useState([
    { id: 1, post_title: "Fake News Trip", reason: "Inappropriate images", reporter: "user_99" }
  ]);

  return (
    <div className="p-12">
      <h2 className="text-4xl font-black mb-12 flex items-center gap-4">
        <ShieldAlert className="text-orange-500" /> Moderation Queue
      </h2>

      <div className="space-y-4">
        {reports.map(r => (
          <div key={r.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex justify-between items-center">
            <div>
              <p className="text-blue-400 font-bold mb-1">Flagged: {r.post_title}</p>
              <p className="text-sm opacity-60">Reason: {r.reason}</p>
              <p className="text-[10px] uppercase font-black tracking-widest mt-2 opacity-30">Reporter: {r.reporter}</p>
            </div>
            <div className="flex gap-4">
               <button className="px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold text-xs">Resolve</button>
               <button className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs">Block Post</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Moderation;