import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NavLink } from 'react-router-dom';
import { 
  Compass, Calendar, Wallet, LogOut, ShieldCheck, 
  Users, LayoutDashboard, BookOpen, Sparkles, Sun, Moon 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { currentTheme, themeType, setThemeType, setActiveTheme, activeTheme } = useTheme();

  const links = user?.role === 'USER' ? [
    { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', path: '/dashboard' },
    { icon: <BookOpen size={20}/>, label: 'Feed', path: '/blogs' },
    { icon: <Calendar size={20}/>, label: 'Planner', path: '/planner' },
    { icon: <Wallet size={20}/>, label: 'Budget', path: '/budget' },
  ] : [
    { icon: <ShieldCheck size={20}/>, label: 'Command', path: '/dashboard' },
    { icon: <Users size={20}/>, label: 'Users', path: '/admin/users' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 flex flex-col py-8 z-50 transition-all duration-500 border-r"
      style={{ backgroundColor: `${currentTheme.bg}EE`, backdropFilter: 'blur(20px)', borderColor: 'var(--primary)' }}>
      
      {/* Brand */}
      <div className="flex items-center justify-center mb-10 px-4">
        <div className="p-3 rounded-2xl bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20">
          <Compass size={28} />
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link, i) => (
          <NavLink key={i} to={link.path}
            style={({ isActive }) => ({ color: isActive ? 'white' : 'var(--text-theme)', backgroundColor: isActive ? 'var(--primary)' : 'transparent' })}
            className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl transition-all font-black text-[10px] uppercase tracking-[0.15em] ${!isActive && 'hover:bg-[var(--primary)]/10'}`}>
            {link.icon} <span className="hidden md:block">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Aura Control (The Theme Switcher) */}
      <div className="px-4 mb-6 space-y-2">
        <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] ml-2 mb-2 hidden md:block">Aura Control</p>
        
        <div className="bg-black/5 p-1.5 rounded-2xl flex flex-col md:flex-row gap-1">
          {/* Seasonal Toggle */}
          <button 
            onClick={() => setThemeType('seasonal')}
            className={`flex-1 flex items-center justify-center p-2.5 rounded-xl transition-all ${themeType === 'seasonal' ? 'bg-[var(--primary)] text-white shadow-md' : 'opacity-40 hover:opacity-100'}`}
            title="Seasonal Mode"
          >
            <Sparkles size={16} />
          </button>

          {/* Light Mode */}
          <button 
            onClick={() => { setThemeType('standard'); setActiveTheme('light'); }}
            className={`flex-1 flex items-center justify-center p-2.5 rounded-xl transition-all ${themeType === 'standard' && activeTheme === 'light' ? 'bg-white text-blue-600 shadow-md' : 'opacity-40 hover:opacity-100'}`}
            title="Light Mode"
          >
            <Sun size={16} />
          </button>

          {/* Dark Mode */}
          <button 
            onClick={() => { setThemeType('standard'); setActiveTheme('dark'); }}
            className={`flex-1 flex items-center justify-center p-2.5 rounded-xl transition-all ${themeType === 'standard' && activeTheme === 'dark' ? 'bg-slate-800 text-white shadow-md' : 'opacity-40 hover:opacity-100'}`}
            title="Dark Mode"
          >
            <Moon size={16} />
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4">
        <button onClick={logout} className="w-full flex items-center gap-4 p-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest">
          <LogOut size={20} /> <span className="hidden md:block">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;