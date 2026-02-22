import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeType, setThemeType] = useState(localStorage.getItem('themeType') || 'seasonal');
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem('activeTheme') || 'basanta');

  const themes = {
    basanta: { primary: '#98A170', bg: '#FAF9F0', text: '#4D3920', card: '#FFFFFFDD' },
    grishma: { primary: '#8B597B', bg: '#FFEEDB', text: '#493129', card: '#FFFFFFCC' },
    sharad: { primary: '#A05432', bg: '#E6D7C4', text: '#4D3920', card: '#FFFFFFDD' },
    hemanta: { primary: '#525871', bg: '#F2F4F7', text: '#525871', card: '#FFFFFFBB' },
    light: { primary: '#2563EB', bg: '#FAF9F6', text: '#1F2937', card: '#FFFFFFDD' },
    dark: { primary: '#3B82F6', bg: '#0F172A', text: '#F8FAFC', card: '#1E293BCC' }
  };

  // Logic to handle auto-seasonal detection
  useEffect(() => {
    if (themeType === 'seasonal') {
      const month = new Date().getMonth() + 1;
      if (month >= 3 && month <= 5) setActiveTheme('basanta');
      else if (month >= 6 && month <= 8) setActiveTheme('grishma');
      else if (month >= 9 && month <= 11) setActiveTheme('sharad');
      else setActiveTheme('hemanta');
    }
  }, [themeType]);

  useEffect(() => {
    const theme = themes[activeTheme];
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--bg-theme', theme.bg);
    root.style.setProperty('--text-theme', theme.text);
    root.style.setProperty('--card-theme', theme.card);
    
    localStorage.setItem('themeType', themeType);
    localStorage.setItem('activeTheme', activeTheme);
  }, [activeTheme, themeType]);

  return (
    <ThemeContext.Provider value={{ 
      themeType, setThemeType, 
      activeTheme, setActiveTheme, 
      currentTheme: themes[activeTheme] 
    }}>
      <div className="min-h-screen transition-colors duration-1000" style={{ backgroundColor: 'var(--bg-theme)', color: 'var(--text-theme)' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);