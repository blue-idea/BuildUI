import React, { useState } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  primary: string;
  background: string;
  surface?: string;
  text?: string;
  border?: string;
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
        className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
      >
        <span
          className="h-2 w-2 rounded-full shadow-sm"
          style={{ backgroundColor: currentTheme?.primary || '#3b82f6' }}
        />
        <span className="font-medium text-slate-200">
          {currentTheme?.name || 'Theme'}
        </span>
        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-lg border border-slate-700 bg-slate-900 p-1.5 shadow-xl z-50">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-600/30 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span>{preset.name}</span>
                </div>
                {isSelected && <span className="text-[11px] text-blue-400">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
