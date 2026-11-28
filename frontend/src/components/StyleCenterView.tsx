import React, { useState, useEffect } from 'react';
import { ThemePreset } from './ThemeSelector';
import { StyleExtractor } from './StyleExtractor';
import { ExtractedStyle } from '../types/style';
import { Palette, Sparkles, Check, Trash2, Layers, Globe, Smartphone, Monitor } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  MACOS_CONTROLS,
  MACOS_FLAT_CARD,
  MACOS_FLAT_GRID,
  MACOS_FLAT_PAGE,
  MACOS_SEGMENTED,
} from '../config/macosFlatUi';

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

/**
 * 纯展示颜色亮度判断：当预设未显式提供 surface/text/border 时，根据背景色自动推算协调的扁平微缩配色
 */
function isDarkHexColor(color?: string): boolean {
  if (!color) return false;
  const hex = color.trim().replace('#', '');
  if (hex.length !== 3 && hex.length !== 6) return false;
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
  // ITU-R BT.709 相对亮度公式
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 132;
}

/**
 * 纯展示子组件：基于预设色板与平台形态渲染精简 macOS 扁平化微缩界面预览画布
 */
const StyleMiniPreview: React.FC<{
  preset: ThemePreset;
  appType: 'web' | 'app' | 'desktop';
}> = ({ preset, appType }) => {
  const darkBg = isDarkHexColor(preset.background);
  const surface = preset.surface || (darkBg ? 'rgba(255, 255, 255, 0.08)' : '#ffffff');
  const text = preset.text || (darkBg ? 'rgba(255, 255, 255, 0.9)' : '#1d1d1f');
  const border = preset.border || (darkBg ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.09)');
  const insetFill = darkBg ? 'rgba(255, 255, 255, 0.05)' : preset.background;

  return (
    <div
      data-testid={`style-card-preview-${preset.id}`}
      className="relative h-[clamp(6.75rem,8.5vw,7.75rem)] w-full overflow-hidden border-b border-black/[0.06] dark:border-white/[0.07] px-3.5 pt-8 pb-0 flex items-end justify-center select-none"
      style={{ backgroundColor: preset.background }}
    >
      {appType === 'app' ? (
        /* 移动端 App 扁平微缩画框（底部贴边展示台效果） */
        <div
          className="w-[54%] max-w-[148px] h-full rounded-t-[13px] border-t border-x px-2.5 pt-2 pb-2 flex flex-col justify-between"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-8 h-[3px] rounded-full opacity-35"
              style={{ backgroundColor: text }}
            />
            <div className="w-full flex items-center justify-between gap-1 pt-0.5">
              <div
                className="h-1.5 w-11 rounded-full opacity-75"
                style={{ backgroundColor: text }}
              />
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: preset.primary }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div
              className="h-3.5 w-full rounded-[5px] border"
              style={{ backgroundColor: insetFill, borderColor: border }}
            />
            <div
              className="h-2.5 w-full rounded-[5px]"
              style={{ backgroundColor: preset.primary }}
            />
          </div>
        </div>
      ) : appType === 'desktop' ? (
        /* 桌面端 macOS 扁平窗口微缩骨架 */
        <div
          className="w-full h-full rounded-t-[10px] border-t border-x overflow-hidden flex flex-col"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <div
            className="h-4 px-2 flex items-center justify-between border-b shrink-0"
            style={{ backgroundColor: insetFill, borderColor: border }}
          >
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f57]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#febc2e]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#28c840]" />
            </div>
            <div
              className="h-1 w-10 rounded-full opacity-25"
              style={{ backgroundColor: text }}
            />
          </div>
          <div className="flex flex-1 min-h-0">
            <div
              className="w-[28%] border-r p-1.5 flex flex-col gap-1"
              style={{ backgroundColor: insetFill, borderColor: border }}
            >
              <div
                className="h-1.5 w-full rounded-[3px]"
                style={{ backgroundColor: preset.primary }}
              />
              <div
                className="h-1.5 w-4/5 rounded-[3px] opacity-25"
                style={{ backgroundColor: text }}
              />
              <div
                className="h-1.5 w-3/5 rounded-[3px] opacity-18"
                style={{ backgroundColor: text }}
              />
            </div>
            <div className="flex-1 p-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div
                  className="h-1.5 w-1/2 rounded-full opacity-75"
                  style={{ backgroundColor: text }}
                />
                <div
                  className="h-1 w-3/4 rounded-full opacity-28"
                  style={{ backgroundColor: text }}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div
                  className="h-3 flex-1 rounded-[4px] border"
                  style={{ backgroundColor: insetFill, borderColor: border }}
                />
                <div
                  className="h-3 w-8 rounded-[4px] shrink-0"
                  style={{ backgroundColor: preset.primary }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Web 应用扁平页面微缩骨架 */
        <div
          className="w-full h-full rounded-t-[10px] border-t border-x overflow-hidden flex flex-col"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <div
            className="h-4 px-2 flex items-center justify-between border-b shrink-0"
            style={{ borderColor: border }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-[3px]"
                style={{ backgroundColor: preset.primary }}
              />
              <span
                className="h-1 w-8 rounded-full opacity-40"
                style={{ backgroundColor: text }}
              />
            </div>
            <div className="flex items-center gap-1">
              <span
                className="h-1 w-4 rounded-full opacity-25"
                style={{ backgroundColor: text }}
              />
              <span
                className="h-1 w-4 rounded-full opacity-25"
                style={{ backgroundColor: text }}
              />
            </div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-12 gap-1.5 items-center">
            <div className="col-span-7 flex flex-col gap-1.5">
              <div
                className="h-1.5 w-4/5 rounded-full opacity-80"
                style={{ backgroundColor: text }}
              />
              <div
                className="h-1 w-full rounded-full opacity-28"
                style={{ backgroundColor: text }}
              />
              <div
                className="h-2.5 w-10 rounded-[4px] mt-0.5"
                style={{ backgroundColor: preset.primary }}
              />
            </div>
            <div
              className="col-span-5 h-full rounded-[6px] border p-1.5 flex flex-col justify-between"
              style={{ backgroundColor: insetFill, borderColor: border }}
            >
              <div
                className="h-1 w-2/3 rounded-full opacity-45"
                style={{ backgroundColor: text }}
              />
              <div
                className="h-2 w-full rounded-[3px] opacity-35"
                style={{ backgroundColor: preset.primary }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

  const displayedTemplates = templates.filter((preset) => {
    if (selectedFilter === 'all') return true;
    const presetAppType = preset.appType || (preset.id === 'macos' ? 'desktop' : 'web');
    return presetAppType === selectedFilter;
  });

  return (
    <div data-testid="style-center-view" className={MACOS_FLAT_PAGE.root}>
      <div data-testid="style-center-container" className={MACOS_FLAT_PAGE.container}>
        {/* 顶部 macOS 扁平工具栏与双 Tab 分段控制器 */}
        <header className={MACOS_FLAT_PAGE.header}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={MACOS_FLAT_PAGE.headerIconBox}>
              <Palette className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <h1 className={MACOS_FLAT_PAGE.title}>{t('stylePage.title')}</h1>
              <p className={MACOS_FLAT_PAGE.subtitle}>{t('stylePage.subtitle')}</p>
            </div>
          </div>

          {/* 双 Tab 分段控制器 */}
          <div className={MACOS_SEGMENTED.track}>
            <button
              type="button"
              data-testid="style-tab-templates"
              onClick={() => setActiveTab('templates')}
              className={`${MACOS_SEGMENTED.itemBase} ${
                activeTab === 'templates'
                  ? MACOS_SEGMENTED.itemActive
                  : MACOS_SEGMENTED.itemInactive
              }`}
            >
              <Layers
                className={`w-3.5 h-3.5 ${
                  activeTab === 'templates' ? 'text-[#0071e3] dark:text-[#0a84ff]' : ''
                }`}
              />
              <span>{t('stylePage.tabTemplates')}</span>
            </button>

            <button
              type="button"
              data-testid="style-tab-extractor"
              onClick={() => setActiveTab('extractor')}
              className={`${MACOS_SEGMENTED.itemBase} ${
                activeTab === 'extractor'
                  ? MACOS_SEGMENTED.itemActive
                  : MACOS_SEGMENTED.itemInactive
              }`}
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  activeTab === 'extractor' ? 'text-[#0071e3] dark:text-[#0a84ff]' : ''
                }`}
              />
              <span>{t('stylePage.tabExtractor')}</span>
            </button>
          </div>
        </header>

        {/* Tab 内容展示 */}
        {activeTab === 'templates' ? (
          <div className="flex flex-col gap-[clamp(0.875rem,1.4vw,1.25rem)]">
            {/* 二级筛选工具条：左侧计数说明，右侧平台分段控制器 */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-[12.5px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {t('stylePage.availableCount', { count: displayedTemplates.length })}
                </span>
                <span className="text-[11.5px] text-[#86868b] dark:text-[#8e8e93]">
                  {t('stylePage.clickToApply')}
                </span>
              </div>

              {/* 应用形态分类分段控制器 */}
              <div className={MACOS_SEGMENTED.track}>
                <button
                  type="button"
                  data-testid="style-filter-all"
                  onClick={() => setSelectedFilter('all')}
                  className={`${MACOS_SEGMENTED.itemBase} py-1 px-2.5 ${
                    selectedFilter === 'all'
                      ? MACOS_SEGMENTED.itemActive
                      : MACOS_SEGMENTED.itemInactive
                  }`}
                >
                  {t('stylePage.filterAll')}
                </button>
                <button
                  type="button"
                  data-testid="style-filter-web"
                  onClick={() => setSelectedFilter('web')}
                  className={`${MACOS_SEGMENTED.itemBase} py-1 px-2.5 ${
                    selectedFilter === 'web'
                      ? MACOS_SEGMENTED.itemActive
                      : MACOS_SEGMENTED.itemInactive
                  }`}
                >
                  <Globe
                    className={`w-3 h-3 ${
                      selectedFilter === 'web' ? 'text-[#0071e3] dark:text-[#0a84ff]' : ''
                    }`}
                  />
                  <span>{t('stylePage.appTypeWeb')}</span>
                </button>
                <button
                  type="button"
                  data-testid="style-filter-app"
                  onClick={() => setSelectedFilter('app')}
                  className={`${MACOS_SEGMENTED.itemBase} py-1 px-2.5 ${
                    selectedFilter === 'app'
                      ? MACOS_SEGMENTED.itemActive
                      : MACOS_SEGMENTED.itemInactive
                  }`}
                >
                  <Smartphone
                    className={`w-3 h-3 ${
                      selectedFilter === 'app' ? 'text-[#0071e3] dark:text-[#0a84ff]' : ''
                    }`}
                  />
                  <span>{t('stylePage.appTypeApp')}</span>
                </button>
                <button
                  type="button"
                  data-testid="style-filter-desktop"
                  onClick={() => setSelectedFilter('desktop')}
                  className={`${MACOS_SEGMENTED.itemBase} py-1 px-2.5 ${
                    selectedFilter === 'desktop'
                      ? MACOS_SEGMENTED.itemActive
                      : MACOS_SEGMENTED.itemInactive
                  }`}
                >
                  <Monitor
                    className={`w-3 h-3 ${
                      selectedFilter === 'desktop' ? 'text-[#0071e3] dark:text-[#0a84ff]' : ''
                    }`}
                  />
                  <span>{t('stylePage.appTypeDesktop')}</span>
                </button>
              </div>
            </div>

            {displayedTemplates.length === 0 ? (
              <div
                data-testid="style-templates-empty-state"
                className={MACOS_FLAT_CARD.emptyState}
              >
                <div className="w-11 h-11 rounded-xl bg-black/[0.045] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#86868b] dark:text-[#8e8e93]">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {t('stylePage.emptyTitle')}
                </h3>
                <p className="text-[12px] text-[#6e6e73] dark:text-[#98989d] max-w-sm">
                  {t('stylePage.emptyDesc')}
                </p>
                {onRestoreDefaultPresets && (
                  <button
                    type="button"
                    data-testid="restore-default-presets-btn"
                    onClick={onRestoreDefaultPresets}
                    className={`${MACOS_CONTROLS.primaryButton} mt-1`}
                  >
                    {t('stylePage.btnRestoreDefaults')}
                  </button>
                )}
              </div>
            ) : (
              <div data-testid="style-templates-grid" className={MACOS_FLAT_GRID.cards}>
                {displayedTemplates.map((preset) => {
                  const isActive = activeThemeId === preset.id;
                  const presetAppType =
                    preset.appType || (preset.id === 'macos' ? 'desktop' : 'web');

                  return (
                    <div
                      key={preset.id}
                      data-testid={`style-template-card-${preset.id}`}
                      onClick={() => onSelectTheme(preset.id)}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-[border-color,background-color] duration-150 cursor-pointer ${
                        isActive
                          ? MACOS_FLAT_CARD.interactiveActive
                          : MACOS_FLAT_CARD.interactiveIdle
                      }`}
                    >
                      {/* 顶部微型扁平界面预览区 + 顶部安全区操作浮层（零遮挡微缩窗口） */}
                      <div className="relative">
                        <StyleMiniPreview preset={preset} appType={presetAppType} />

                        <div className="absolute inset-x-2.5 top-2 flex items-center justify-between gap-2 pointer-events-none">
                          <div>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071e3] dark:bg-[#0a84ff] text-white">
                                <Check className="w-2.5 h-2.5 stroke-[2.75]" />
                                <span>{t('stylePage.badgeActive')}</span>
                              </span>
                            )}
                          </div>

                          {/* 每一项均渲染删除按钮 */}
                          <button
                            type="button"
                            data-testid={`delete-template-btn-${preset.id}`}
                            onClick={(e) => handleDeleteTemplate(preset.id, e)}
                            className="pointer-events-auto w-5 h-5 rounded-[6px] bg-white/85 dark:bg-[#1c1c1e]/85 border border-black/[0.1] dark:border-white/[0.15] text-[#6e6e73] dark:text-[#aeaeb2] hover:text-[#ff3b30] dark:hover:text-[#ff453a] hover:border-[#ff3b30]/40 dark:hover:border-[#ff453a]/40 hover:bg-white dark:hover:bg-[#2c2c2e] flex items-center justify-center transition-colors opacity-75 group-hover:opacity-100 cursor-pointer"
                            title={t('stylePage.btnDeleteTemplate')}
                            aria-label={`Delete ${preset.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* 卡片主体信息区 */}
                      <div className="px-4 py-3.5 flex flex-col flex-1 justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full ring-1 ring-black/15 dark:ring-white/20 shrink-0"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                                {preset.name}
                              </h3>
                            </div>

                            {/* 应用形态扁平中性微徽章 */}
                            <span
                              data-testid={`template-app-type-badge-${preset.id}`}
                              className={MACOS_CONTROLS.neutralBadge}
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
                            <p className="text-[12px] text-[#6e6e73] dark:text-[#98989d] mt-1.5 line-clamp-2 leading-[1.45]">
                              {preset.description}
                            </p>
                          )}
                        </div>

                        {/* 底部扁平化色板令牌条 */}
                        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.07]">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-4 h-4 rounded-[5px] ring-1 ring-inset ring-black/15 dark:ring-white/15 shrink-0"
                              style={{ backgroundColor: preset.primary }}
                              title={t('stylePage.palettePrimary')}
                            />
                            <div
                              className="w-4 h-4 rounded-[5px] ring-1 ring-inset ring-black/15 dark:ring-white/15 shrink-0"
                              style={{ backgroundColor: preset.background }}
                              title={t('stylePage.paletteBackground')}
                            />
                            {preset.surface && (
                              <div
                                className="w-4 h-4 rounded-[5px] ring-1 ring-inset ring-black/15 dark:ring-white/15 shrink-0"
                                style={{ backgroundColor: preset.surface }}
                                title={t('stylePage.paletteSurface')}
                              />
                            )}
                            {preset.text && (
                              <div
                                className="w-4 h-4 rounded-[5px] ring-1 ring-inset ring-black/15 dark:ring-white/15 shrink-0"
                                style={{ backgroundColor: preset.text }}
                                title={t('stylePage.paletteText')}
                              />
                            )}
                            {preset.border && (
                              <div
                                className="w-4 h-4 rounded-[5px] ring-1 ring-inset ring-black/15 dark:ring-white/15 shrink-0"
                                style={{ backgroundColor: preset.border }}
                                title={t('stylePage.paletteBorder')}
                              />
                            )}
                          </div>

                          <span className="font-mono text-[10.5px] uppercase tracking-wide text-[#86868b] dark:text-[#8e8e93] shrink-0">
                            {preset.primary}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
