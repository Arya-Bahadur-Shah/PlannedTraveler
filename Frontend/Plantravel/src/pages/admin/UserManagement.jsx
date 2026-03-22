import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, Trash2 } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('users/').then(res => setUsers(res.data));
  }, []);

  const deleteUser = async (id) => {
    if(window.confirm("Delete this user permanently?")) {
      await api.delete(`users/${id}/`);
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="p-8 md:p-12 min-h-screen" style={{ backgroundColor: 'var(--bg-theme)', color: 'var(--text-theme)' }}>
      <div className="flex items-center gap-4 mb-12">
         <div className="p-3 rounded-2xl bg-[var(--primary)] text-white shadow-lg"><Users size={24} /></div>
         <h2 className="text-4xl font-black tracking-tight">Explorer Directory</h2>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-[var(--primary)]/10 shadow-xl bg-[var(--card-theme)]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-black/5 uppercase text-[10px] font-black tracking-widest opacity-40">
            <tr>
              <th className="p-6">Explorer</th>
              <th className="p-6">Email</th>
              <th className="p-6">Role</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {users.map((u) => (
              <tr key={u.id} className="border-t border-black/5 hover:bg-[var(--primary)]/5 transition-colors">
                <td className="p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[var(--primary)]">
                    {u.username[0].toUpperCase()}
                  </div>
                  {u.username}
                </td>
                <td className="p-6 opacity-60 text-sm">{u.email || 'N/A'}</td>
                <td className="p-6 text-xs font-black uppercase tracking-widest text-[var(--primary)]">{u.role}</td>
                <td className="p-6 text-right">
                  <button onClick={() => deleteUser(u.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default UserManagement;