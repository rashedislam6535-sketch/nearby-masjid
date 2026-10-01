'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dim' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  const applyTheme = (mode: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.classList.remove('light', 'dim', 'dark');
    root.classList.add(mode);
  };

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('nearby_masjid_theme') || 'light') as ThemeMode;
      if (saved === 'light' || saved === 'dim' || saved === 'dark') {
        setThemeState(saved);
        applyTheme(saved);
      } else {
        applyTheme('light');
      }
    } catch {
      applyTheme('light');
    }
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    applyTheme(mode);
    try {
      localStorage.setItem('nearby_masjid_theme', mode);
    } catch {}
  };

  const toggleTheme = () => {
    const cycle: Record<ThemeMode, ThemeMode> = {
      light: 'dim',
      dim: 'dark',
      dark: 'light',
    };
    setTheme(cycle[theme]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
