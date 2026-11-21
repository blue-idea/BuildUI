import React from 'react';
import { Sparkles, X, Command, Settings, Clock, Download, FolderGit2, TestTube2 } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeModeToggle } from './ThemeModeToggle';
import { ThemeSelector, ThemePreset } from './ThemeSelector';
import { useI18n } from '../i18n/I18nContext';

export interface MacOSWindowHeaderProps {
  appName?: string;
  onManageApp?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSettings?: () => void;
  onOpenVersions?: () => void;
  onOpenExport?: () => void;
  onSelectDirectory?: () => void;
  onMockBlueprint?: () => void;
  onCloseTab?: () => void;
  workspaceDir?: string;
  themePresets?: ThemePreset[];
  activeThemeId?: string;
  onSelectTheme?: (id: string) => void;
}

export const MacOSWindowHeader: React.FC<MacOSWindowHeaderProps> = ({
  appName,
  onManageApp,
  onOpenCommandPalette,
  onOpenSettings,
  onOpenVersions,
  onOpenExport,
  onSelectDirectory,
  onMockBlueprint,
  onCloseTab,
  workspaceDir = '/workspace',
  themePresets,
  activeThemeId,
  onSelectTheme,
}) => {
  const { t } = useI18n();

  return (
    <header className="h-11 w-full bg-slate-100/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between px-3 select-none z-30 transition-colors">
      {/* 左侧：交通灯 + Blot-UI 标识 + Wails 徽章 + Manage app + 项目标签页 */}
      <div className="flex items-center gap-2">
        {/* macOS 经典红黄绿交通灯 */}
        <div className="flex items-center gap-2 pl-1 pr-1.5">
          <button
            type="button"
            data-testid="traffic-light-close"
            aria-label="Close"
            className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:brightness-90 transition-all flex items-center justify-center group"
          />
          <button
            type="button"
            data-testid="traffic-light-min"
            aria-label="Minimize"
            className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:brightness-90 transition-all flex items-center justify-center group"
          />
          <button
            type="button"
            data-testid="traffic-light-zoom"
            aria-label="Zoom"
            className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:brightness-90 transition-all flex items-center justify-center group"
          />
        </div>

        {/* 品牌标识与技术栈标签 */}
        <div className="flex items-center gap-1.5 mr-1">
          <span className="font-semibold text-xs tracking-tight text-slate-700 dark:text-zinc-200">
            Blot-UI
          </span>
          <span className="rounded bg-slate-200/80 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
            Wails v2 + React 19
          </span>
        </div>

        {/* Manage app 按钮 */}
        <button
          type="button"
          onClick={onManageApp}
          aria-label="Manage app - Open applications drawer"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{t('common.manageApp')}</span>
        </button>

        {/* 项目标签页 Tab */}
        {appName ? (
          <div
            data-testid="project-tab"
            onClick={onCloseTab}
            title={onCloseTab ? t('common.closeProject') : undefined}
            className={`flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-800 text-xs font-medium text-slate-800 dark:text-zinc-200 rounded-t-lg border-t border-l border-r border-slate-200 dark:border-zinc-700 shadow-2xs group transition-all ${
              onCloseTab ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-750' : 'cursor-default'
            }`}
          >
            <span className="truncate max-w-[160px]">{appName}</span>
            {onCloseTab && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab();
                }}
                data-testid="close-project-tab"
                aria-label={t('common.closeProject')}
                title={t('common.closeProject')}
                className="text-slate-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* 右侧：工作区路径 + 辅助导航 + 语言 + 主题 + Pro 徽章 */}
      <div className="flex items-center gap-1.5">
        {/* 工作区路径选择 */}
        {onSelectDirectory && (
          <button
            type="button"
            onClick={onSelectDirectory}
            aria-label="Select workspace directory"
            title={workspaceDir}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">{t('header.workspace')}</span>
            <span className="max-w-[120px] truncate">{workspaceDir}</span>
          </button>
        )}

        {/* 模版 / 时光机 / 设置快捷入口 */}
        {onOpenVersions && (
          <button
            type="button"
            onClick={onOpenVersions}
            aria-label="Open version time machine"
            title={t('modals.versionTitle')}
            className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 rounded-md hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        )}

        {onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            aria-label="Open export modal"
            title={t('modals.exportTitle')}
            className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 rounded-md hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title={t('modals.settingsTitle')}
            className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 rounded-md hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {onMockBlueprint && (
          <button
            type="button"
            onClick={onMockBlueprint}
            aria-label="Mock blueprint"
            title="Mock Blueprint"
            className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 rounded-md hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <TestTube2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 主题预设选择器 */}
        {themePresets && activeThemeId && onSelectTheme && (
          <ThemeSelector
            presets={themePresets}
            activeThemeId={activeThemeId}
            onSelectTheme={onSelectTheme}
          />
        )}

        {/* 快捷键提示 */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label="Open command palette"
            title="Open Command Palette (Ctrl+K)"
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </button>
        )}

        {/* 语言切换 */}
        <LanguageSwitcher />

        {/* 主题明暗双模切换 */}
        <ThemeModeToggle />
      </div>
    </header>
  );
};
