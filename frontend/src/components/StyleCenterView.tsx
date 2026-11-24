import React, { useState, useEffect } from 'react';
import { ThemePreset } from './ThemeSelector';
import { StyleExtractor } from './StyleExtractor';
import { ExtractedStyle } from '../types/style';
import { Palette, Sparkles, Check, Trash2, Layers, Globe, Smartphone, Monitor } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface StyleCenterViewProps {
  presets: ThemePreset[];
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
  onAddCustomPreset?: (preset: ThemePreset) => void;
  onDeleteCustomPreset?: (presetId: string) => void;
  onRestoreDefaultPresets?: () => void;
  settings?: Record<string, string>;
  onOpenSettings?: () => void;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

export const StyleCenterView: React.FC<StyleCenterViewProps> = ({
  presets: initialPresets,
  activeThemeId,
  onSelectTheme,
  onAddCustomPreset,
  onDeleteCustomPreset,
  onRestoreDefaultPresets,
  settings,
  onOpenSettings,
  selectedModel,
  onSelectModel,
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'templates' | 'extractor'>('templates');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'web' | 'app' | 'desktop'>('all');
  const [templates, setTemplates] = useState<ThemePreset[]>(initialPresets);

  useEffect(() => {
    setTemplates(initialPresets);
  }, [initialPresets]);

  // 处理提取器保存的新风格模版
  const handleSaveExtractedStyle = (extracted: ExtractedStyle) => {
    const newPreset: ThemePreset = {
      id: extracted.id,
      name: extracted.name,
      appType: extracted.appType || 'web',
      description: `Extracted from ${extracted.referenceSource}`,
      primary: extracted.palette.primary,
      background: extracted.palette.background,
      surface: extracted.palette.surface,
      text: extracted.palette.text,
      border: extracted.palette.border,
      stylePrompt: extracted.stylePrompt || extracted.designPrompt,
      tags: extracted.tags,
      borderRadius: extracted.borderRadius,
      typography: extracted.typography,
    };

    setTemplates((prev) => [newPreset, ...prev]);
    onAddCustomPreset?.(newPreset);
    onSelectTheme(newPreset.id);
  };

  // 处理删除模版（每一项选项均可删除）
  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTemplates = templates.filter((t) => t.id !== id);
    setTemplates(nextTemplates);
    onDeleteCustomPreset?.(id);
    if (activeThemeId === id) {
      if (nextTemplates.length > 0) {
        onSelectTheme(nextTemplates[0].id);
      } else {
        onSelectTheme('');
      }
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
              <span>{t('stylePage.title')}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {t('stylePage.subtitle')}
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
              <span>{t('stylePage.tabTemplates')}</span>
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
              <span>{t('stylePage.tabExtractor')}</span>
            </button>
          </div>
        </div>

        {/* Tab 内容展示 */}
        {activeTab === 'templates' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  {t('stylePage.availableCount', { count: templates.filter((p) => selectedFilter === 'all' || (p.appType || (p.id === 'macos' ? 'desktop' : 'web')) === selectedFilter).length })}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                  {t('stylePage.clickToApply')}
                </span>
              </div>

              {/* 应用形态分类筛选胶囊 */}
              <div className="inline-flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 self-start sm:self-auto select-none">
                <button
                  type="button"
                  data-testid="style-filter-all"
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedFilter === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {t('stylePage.filterAll')}
                </button>
                <button
                  type="button"
                  data-testid="style-filter-web"
                  onClick={() => setSelectedFilter('web')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedFilter === 'web'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>{t('stylePage.appTypeWeb')}</span>
                </button>
                <button
                  type="button"
                  data-testid="style-filter-app"
                  onClick={() => setSelectedFilter('app')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedFilter === 'app'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>{t('stylePage.appTypeApp')}</span>
                </button>
                <button
                  type="button"
                  data-testid="style-filter-desktop"
                  onClick={() => setSelectedFilter('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedFilter === 'desktop'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>{t('stylePage.appTypeDesktop')}</span>
                </button>
              </div>
            </div>

            {(() => {
              const displayedTemplates = templates.filter((preset) => {
                if (selectedFilter === 'all') return true;
                const presetAppType = preset.appType || (preset.id === 'macos' ? 'desktop' : 'web');
                return presetAppType === selectedFilter;
              });

              if (displayedTemplates.length === 0) {
                return (
                  <div
                    data-testid="style-templates-empty-state"
                    className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                      {t('stylePage.emptyTitle')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
                      {t('stylePage.emptyDesc')}
                    </p>
                    {onRestoreDefaultPresets && (
                      <button
                        type="button"
                        data-testid="restore-default-presets-btn"
                        onClick={onRestoreDefaultPresets}
                        className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
                      >
                        {t('stylePage.btnRestoreDefaults')}
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {displayedTemplates.map((preset) => {
                    const isActive = activeThemeId === preset.id;
                    const presetAppType = preset.appType || (preset.id === 'macos' ? 'desktop' : 'web');

                    return (
                      <div
                        key={preset.id}
                        onClick={() => onSelectTheme(preset.id)}
                        className={`relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-4 group ${
                          isActive
                            ? 'border-blue-500/80 bg-white dark:bg-zinc-900 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shadow-xs shrink-0"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                                {preset.name}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isActive && (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                                  <Check className="w-3 h-3" />
                                  <span>{t('stylePage.badgeActive')}</span>
                                </span>
                              )}

                              {/* 每一项均渲染删除按钮 */}
                              <button
                                type="button"
                                data-testid={`delete-template-btn-${preset.id}`}
                                onClick={(e) => handleDeleteTemplate(preset.id, e)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors opacity-70 hover:opacity-100 group-hover:opacity-100 cursor-pointer"
                                title={t('stylePage.btnDeleteTemplate')}
                                aria-label={`Delete ${preset.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 应用形态 Badge */}
                          <div className="mt-2">
                            <span
                              data-testid={`template-app-type-badge-${preset.id}`}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                presetAppType === 'app'
                                  ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60'
                                  : presetAppType === 'desktop'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60'
                              }`}
                            >
                              {presetAppType === 'app' ? (
                                <Smartphone className="w-2.5 h-2.5" />
                              ) : presetAppType === 'desktop' ? (
                                <Monitor className="w-2.5 h-2.5" />
                              ) : (
                                <Globe className="w-2.5 h-2.5" />
                              )}
                              <span>
                                {presetAppType === 'app'
                                  ? t('stylePage.appTypeApp')
                                  : presetAppType === 'desktop'
                                  ? t('stylePage.appTypeDesktop')
                                  : t('stylePage.appTypeWeb')}
                              </span>
                            </span>
                          </div>

                          {preset.description && (
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                              {preset.description}
                            </p>
                          )}
                        </div>

                        {/* 配色微预览条 */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                          <div
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: preset.primary }}
                            title={t('stylePage.palettePrimary')}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-slate-200 dark:border-zinc-700 shrink-0"
                            style={{ backgroundColor: preset.background }}
                            title={t('stylePage.paletteBackground')}
                          />
                          {preset.surface && (
                            <div
                              className="w-4 h-4 rounded-full border border-slate-200 dark:border-zinc-700 shrink-0"
                              style={{ backgroundColor: preset.surface }}
                              title={t('stylePage.paletteSurface')}
                            />
                          )}
                          {preset.text && (
                            <div
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: preset.text }}
                              title={t('stylePage.paletteText')}
                            />
                          )}
                          {preset.border && (
                            <div
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: preset.border }}
                              title={t('stylePage.paletteBorder')}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          <StyleExtractor
            onSaveTemplate={handleSaveExtractedStyle}
            settings={settings}
            onOpenSettings={onOpenSettings}
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
          />
        )}
      </div>
    </div>
  );
};
