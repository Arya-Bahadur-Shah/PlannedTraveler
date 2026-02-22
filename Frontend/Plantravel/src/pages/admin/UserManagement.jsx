import React from 'react';
import { ShieldCheck, UserMinus, MoreHorizontal, Users } from 'lucide-react';

const UserManagement = () => {
  const users = [
    { name: 'Arya Shah', role: 'Super Admin', status: 'Active', trips: 14 },
    { name: 'Sita Ram', role: 'Traveler', status: 'Active', trips: 5 },
    { name: 'John Explorer', role: 'Traveler', status: 'Suspended', trips: 1 }
  ];

  return (
    <div className="p-8 md:p-12">
      <div className="flex items-center gap-4 mb-12">
         <div className="p-3 rounded-2xl bg-[var(--primary)] text-white shadow-lg">
            <Users size={24} />
         </div>
         <h2 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-theme)' }}>
            Explorer Directory
         </h2>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-[var(--primary)]/10 shadow-xl" style={{ backgroundColor: 'var(--card-theme)' }}>
        <table className="w-full text-left border-collapse">
          <thead className="bg-black/5 uppercase text-[10px] font-black tracking-widest opacity-40">
            <tr>
              <th className="p-6">Explorer</th>
              <th className="p-6">Role</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-bold" style={{ color: 'var(--text-theme)' }}>
            {users.map((u, i) => (
              <tr key={i} className="border-t border-black/5 hover:bg-[var(--primary)]/5 transition-colors">
                <td className="p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: 'var(--primary)' }}>
                    {u.name[0]}
                  </div>
                  {u.name}
                </td>
                <td className="p-6 opacity-60 text-sm">{u.role}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <button className="p-2 opacity-30 hover:opacity-100 transition-opacity"><MoreHorizontal/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// THIS IS THE LINE THAT WAS LIKELY MISSING:
export default UserManagement;