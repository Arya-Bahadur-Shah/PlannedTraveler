import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeType, setThemeType] = useState(localStorage.getItem('themeType') || 'seasonal');
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'basanta');

  const themes = {
    // SPRING (From Image 4)
    basanta: { primary: '#98A170', accent: '#FEA948', bg: '#FAF9F0', text: '#4D3920', card: '#FFFFFF88' },
    // SUMMER (From Image 1)
    grishma: { primary: '#8B597B', accent: '#EFA3A0', bg: '#FFEEDB', text: '#493129', card: '#FFFFFF66' },
    // AUTUMN (From Image 2)
    sharad: { primary: '#A05432', accent: '#9F9A60', bg: '#E6D7C4', text: '#4D3920', card: '#FFFFFF77' },
    // WINTER (From Image 3)
    hemanta: { primary: '#525871', accent: '#CD9FA0', bg: '#F2F4F7', text: '#525871', card: '#FFFFFF55' },
    
    // DEFAULT MODES
    light: { primary: '#2563EB', accent: '#F59E0B', bg: '#FAF9F6', text: '#1F2937', card: '#FFFFFF' },
    dark: { primary: '#3B82F6', accent: '#60A5FA', bg: '#0F172A', text: '#F8FAFC', card: '#1E293B' }
  };

  useEffect(() => {
    localStorage.setItem('themeType', themeType);
    localStorage.setItem('themeMode', mode);
  }, [themeType, mode]);

  const currentTheme = themes[mode];

  return (
    <ThemeContext.Provider value={{ themeType, setThemeType, mode, setMode, currentTheme }}>
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