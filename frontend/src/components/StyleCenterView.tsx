import React, { useState } from 'react';
import { ThemePreset } from './ThemeSelector';
import { StyleExtractor } from './StyleExtractor';
import { ExtractedStyle } from '../types/style';
import { Palette, Sparkles, Check, Trash2, Layers } from 'lucide-react';

export interface StyleCenterViewProps {
  presets: ThemePreset[];
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
  onAddCustomPreset?: (preset: ThemePreset) => void;
  onDeleteCustomPreset?: (presetId: string) => void;
}

export const StyleCenterView: React.FC<StyleCenterViewProps> = ({
  presets: initialPresets,
  activeThemeId,
  onSelectTheme,
  onAddCustomPreset,
  onDeleteCustomPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'extractor'>('templates');
  const [templates, setTemplates] = useState<ThemePreset[]>(initialPresets);

  // 处理提取器保存的新风格模版
  const handleSaveExtractedStyle = (extracted: ExtractedStyle) => {
    const newPreset: ThemePreset = {
      id: extracted.id,
      name: extracted.name,
      description: `Extracted from ${extracted.referenceSource}`,
      primary: extracted.palette.primary,
      background: extracted.palette.background,
      surface: extracted.palette.surface,
      text: extracted.palette.text,
      border: extracted.palette.border,
    };

    setTemplates((prev) => [newPreset, ...prev]);
    onAddCustomPreset?.(newPreset);
    onSelectTheme(newPreset.id);
  };

  // 处理删除模版
  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    onDeleteCustomPreset?.(id);
    if (activeThemeId === id && templates.length > 1) {
      const nextActive = templates.find((t) => t.id !== id);
      if (nextActive) onSelectTheme(nextActive.id);
    }
  };

  return (
    <div
      data-testid="style-center-view"
      className="flex-1 h-full overflow-y-auto bg-slate-50/70 dark:bg-zinc-950 p-8 flex flex-col transition-colors selection:bg-blue-100 dark:selection:bg-blue-950"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 pb-12">
        {/* 顶部标题与双 Tab 导航 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
              <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Design & Style Center</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Manage application color tokens, visual styles, and extract designs from reference products.
            </p>
          </div>

          {/* 双 Tab 切换胶囊 */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 select-none">
            <button
              type="button"
              data-testid="style-tab-templates"
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Style Templates</span>
            </button>

            <button
              type="button"
              data-testid="style-tab-extractor"
              onClick={() => setActiveTab('extractor')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'extractor'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Reference Extractor</span>
            </button>
          </div>
        </div>

        {/* Tab 内容展示 */}
        {activeTab === 'templates' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Available Templates ({templates.length})
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                Click any template card to apply as global application theme
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {templates.map((preset) => {
                const isActive = activeThemeId === preset.id;
                const isCustom = preset.id.startsWith('style-');

                return (
                  <div
                    key={preset.id}
                    onClick={() => onSelectTheme(preset.id)}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between gap-4 transition-all cursor-pointer group ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500 shadow-xs'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                          {preset.name}
                          {isActive && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              <Check className="w-2.5 h-2.5" />
                              Active
                            </span>
                          )}
                        </span>
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-2xs"
                          style={{ backgroundColor: preset.primary }}
                        />
                      </div>

                      {preset.description && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1">
                          {preset.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-md border border-slate-200 dark:border-zinc-700"
                          style={{ backgroundColor: preset.background }}
                          title="Background"
                        />
                        <div
                          className="w-5 h-5 rounded-md"
                          style={{ backgroundColor: preset.primary }}
                          title="Primary Accent"
                        />
                      </div>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTemplate(preset.id, e)}
                          title="Delete Custom Template"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <StyleExtractor onSaveTemplate={handleSaveExtractedStyle} />
        )}
      </div>
    </div>
  );
};
