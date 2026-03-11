import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ThemeConfig } from '../../types.js';

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  toggleMode: () => void;
  updatePrimaryColor: (color: string) => void;
  updateSecondaryColor: (color: string) => void;
  updateAccentColor: (color: string) => void;
  resetTheme: () => void;
}

const defaultTheme: ThemeConfig = {
  mode: 'dark',
  primaryColor: '#a8c7fa',
  secondaryColor: '#d1e8ff',
  accentColor: '#64b5f6',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'phantom-mock-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);

  // 从 localStorage 加载主题
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      try {
        setThemeState(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse stored theme:', e);
      }
    }
  }, []);

  // 保存主题到 localStorage
  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newTheme));
  };

  const toggleMode = () => {
    const newTheme: ThemeConfig = {
      ...theme,
      mode: theme.mode === 'dark' ? 'light' : 'dark',
    };
    setTheme(newTheme);
  };

  const updatePrimaryColor = (color: string) => {
    setTheme({ ...theme, primaryColor: color });
  };

  const updateSecondaryColor = (color: string) => {
    setTheme({ ...theme, secondaryColor: color });
  };

  const updateAccentColor = (color: string) => {
    setTheme({ ...theme, accentColor: color });
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleMode,
        updatePrimaryColor,
        updateSecondaryColor,
        updateAccentColor,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
