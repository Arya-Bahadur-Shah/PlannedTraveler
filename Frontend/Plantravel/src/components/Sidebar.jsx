import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NavLink, Link } from 'react-router-dom';
import { 
  Compass, Calendar, Wallet, LogOut, ShieldCheck, 
  Users, LayoutDashboard, BookOpen, Sparkles, Sun, Moon, User
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { currentTheme, themeType, setThemeType, setActiveTheme, activeTheme } = useTheme();

  const travelerLinks = [
    { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', path: '/dashboard' },
    { icon: <BookOpen size={20}/>, label: 'Feed', path: '/blogs' },
    { icon: <Calendar size={20}/>, label: 'Planner', path: '/planner' },
    { icon: <Wallet size={20}/>, label: 'Budget', path: '/budget' },
  ];

  const adminLinks = [
    { icon: <ShieldCheck size={20}/>, label: 'Command', path: '/dashboard' },
    { icon: <Users size={20}/>, label: 'Directory', path: '/admin/users' },
  ];

  const links = user?.role === 'USER' ? travelerLinks : adminLinks;

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 flex flex-col py-8 z-50 transition-all duration-500 border-r"
      style={{ backgroundColor: `${currentTheme.bg}EE`, backdropFilter: 'blur(20px)', borderColor: 'var(--primary)' }}>
      
      {/* 1. Profile / Avatar Section (New Update) */}
      <Link to="/profile" className="flex flex-col items-center mb-10 px-4 group">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
          {user?.profile_picture ? <img src={user.profile_picture} className="rounded-2xl" /> : <User size={32} />}
        </div>
        <p className="hidden md:block mt-3 font-black text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
          {user?.username || "Explorer"}
        </p>
      </Link>

      {/* 2. Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link, i) => (
          <NavLink key={i} to={link.path}
            style={({ isActive }) => ({ color: isActive ? 'white' : 'var(--text-theme)', backgroundColor: isActive ? 'var(--primary)' : 'transparent' })}
            className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl transition-all font-black text-[10px] uppercase tracking-[0.15em] ${!isActive && 'hover:bg-[var(--primary)]/10'}`}>
            {link.icon} <span className="hidden md:block">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 3. Aura Control */}
      <div className="px-4 mb-6 space-y-2">
        <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] ml-2 hidden md:block">Aura Control</p>
        <div className="bg-black/5 p-1 rounded-2xl flex flex-col md:flex-row gap-1">
          <button onClick={() => setThemeType('seasonal')} className={`flex-1 flex items-center justify-center p-2 rounded-xl transition-all ${themeType === 'seasonal' ? 'bg-[var(--primary)] text-white shadow-md' : 'opacity-40'}`} title="Seasonal Mode"><Sparkles size={14} /></button>
          <button onClick={() => { setThemeType('standard'); setActiveTheme('light'); }} className={`flex-1 flex items-center justify-center p-2 rounded-xl transition-all ${themeType === 'standard' && activeTheme === 'light' ? 'bg-white text-blue-600 shadow-md' : 'opacity-40'}`} title="Light Mode"><Sun size={14} /></button>
          <button onClick={() => { setThemeType('standard'); setActiveTheme('dark'); }} className={`flex-1 flex items-center justify-center p-2 rounded-xl transition-all ${themeType === 'standard' && activeTheme === 'dark' ? 'bg-slate-800 text-white shadow-md' : 'opacity-40'}`} title="Dark Mode"><Moon size={14} /></button>
        </div>
      </div>

      {/* 4. Logout */}
      <div className="px-4">
        <button onClick={logout} className="w-full flex items-center gap-4 p-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest">
          <LogOut size={20} /> <span className="hidden md:block">Exit Passport</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;