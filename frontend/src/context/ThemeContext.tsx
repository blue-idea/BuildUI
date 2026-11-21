import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, MacOSThemeColors, macosTokens, applyThemeToElement } from '../theme/macos';

const THEME_STORAGE_KEY = 'blot_theme_mode';

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  tokens: MacOSThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialMode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (initialMode) return initialMode;
    if (typeof window !== 'undefined') {
      const persisted = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (persisted === 'light' || persisted === 'dark') {
        return persisted;
      }
    }
    return 'light';
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    applyThemeToElement(root, themeMode);
  }, [themeMode]);

  const value: ThemeContextValue = {
    themeMode,
    setThemeMode,
    toggleTheme,
    isDark: themeMode === 'dark',
    tokens: macosTokens[themeMode],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useMacOSTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useMacOSTheme must be used within a ThemeProvider');
  }
  return context;
};
