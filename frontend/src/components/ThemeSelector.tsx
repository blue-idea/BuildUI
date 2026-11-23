import React, { useState } from 'react';
import type { StyleAppType } from '../types/style';

export interface ThemePreset {
  id: string;
  name: string;
  appType?: StyleAppType;
  description?: string;
  primary: string;
  background: string;
  surface?: string;
  text?: string;
  border?: string;
  stylePrompt?: string;
  tags?: string[];
  borderRadius?: string;
  typography?: string;
}

export interface ThemeSelectorProps {
  presets: ThemePreset[];
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  presets,
  activeThemeId,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentTheme = presets.find((p) => p.id === activeThemeId) || presets[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select theme"
        className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 px-2.5 py-1 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-colors shadow-2xs"
      >
        <span
          className="h-2 w-2 rounded-full shadow-sm"
          style={{ backgroundColor: currentTheme?.primary || '#3b82f6' }}
        />
        <span className="font-medium text-slate-800 dark:text-zinc-200">
          {currentTheme?.name || 'Theme'}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl z-50 transition-colors select-none">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Presets
          </div>
          {presets.map((preset) => {
            const isSelected = preset.id === activeThemeId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onSelectTheme(preset.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span>{preset.name}</span>
                </div>
                {isSelected && <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
