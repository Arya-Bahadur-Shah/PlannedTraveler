import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Main Choice: 'standard' or 'seasonal'
  const [themeType, setThemeType] = useState(localStorage.getItem('themeType') || 'standard');
  // Sub Choice: 'light'/'dark' OR 'basanta'/'grishma'/'sharad'/'hemanta'
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem('activeTheme') || 'light');

  const themes = {
    // STANDARD MODES
    light: { primary: '#2563EB', bg: '#FAF9F6', text: '#1F2937', card: '#FFFFFF88' },
    dark: { primary: '#3B82F6', bg: '#0F172A', text: '#F8FAFC', card: '#1E293B88' },
    
    // SEASONAL MODES (From your images)
    basanta: { primary: '#98A170', accent: '#FEA948', bg: '#FAF9F0', text: '#4D3920', card: '#FFFFFF88' },
    grishma: { primary: '#8B597B', accent: '#EFA3A0', bg: '#FFEEDB', text: '#493129', card: '#FFFFFF66' },
    sharad: { primary: '#A05432', accent: '#9F9A60', bg: '#E6D7C4', text: '#4D3920', card: '#FFFFFF77' },
    hemanta: { primary: '#525871', accent: '#CD9FA0', bg: '#F2F4F7', text: '#525871', card: '#FFFFFF55' },
  };

  useEffect(() => {
    localStorage.setItem('themeType', themeType);
    localStorage.setItem('activeTheme', activeTheme);
  }, [themeType, activeTheme]);

  const currentTheme = themes[activeTheme];

  return (
    <ThemeContext.Provider value={{ themeType, setThemeType, activeTheme, setActiveTheme, currentTheme }}>
      <div style={{ 
        backgroundColor: currentTheme.bg, 
        color: currentTheme.text, 
        minHeight: '100vh', 
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);