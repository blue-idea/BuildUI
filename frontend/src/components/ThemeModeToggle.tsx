import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useMacOSTheme } from '../context/ThemeContext';

export interface ThemeModeToggleProps {
  className?: string;
}

export const ThemeModeToggle: React.FC<ThemeModeToggleProps> = ({ className = '' }) => {
  const { toggleTheme, isDark } = useMacOSTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`inline-flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" />
      )}
    </button>
  );
};
