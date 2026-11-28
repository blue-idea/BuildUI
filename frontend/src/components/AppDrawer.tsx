import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

export type ProjectPlatform = 'web' | 'desktop' | 'app';

export interface AppItem {
  id: number;
  name: string;
  path: string;
  createdAt?: string;
  platform?: ProjectPlatform;
  thumbnailUrl?: string;
}

/** 智能推断工程所属平台，未指定时默认安全 fallback 到 web */
export const inferAppPlatform = (app: Partial<AppItem>): ProjectPlatform => {
  if (app.platform) return app.platform;
  const combined = `${app.name || ''} ${app.path || ''}`.toLowerCase();
  if (combined.includes('desktop') || combined.includes('wails') || combined.includes('electron')) {
    return 'desktop';
  }
  if (
    combined.includes('app') ||
    combined.includes('native') ||
    combined.includes('expo') ||
    combined.includes('mobile') ||
    combined.includes('ios') ||
    combined.includes('android')
  ) {
    return 'app';
  }
  return 'web';
};

export interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppItem[];
  activeAppId: number;
  onSelectApp: (id: number) => void;
  onCreateApp: () => void;
  onCreateNamedApp?: (name: string, platform?: ProjectPlatform) => Promise<void> | void;
  busy?: boolean;
  error?: string;
  onOpenTemplates?: () => void;
  onDeleteApp: (id: number) => void;
}

export const AppDrawer: React.FC<AppDrawerProps> = ({
  isOpen,
  onClose,
  apps,
  activeAppId,
  onSelectApp,
  onCreateApp,
  onCreateNamedApp,
  busy = false,
  error,
  onOpenTemplates,
  onDeleteApp,
}) => {
  const { t } = useI18n();
  const [newProjectName, setNewProjectName] = useState<string | null>(null);
  const close = () => { setNewProjectName(null); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/35 dark:bg-black/60 backdrop-blur-sm transition-colors">
      {/* 侧边滑出抽屉（浅色/深色双模毛玻璃材质） */}
      <div className="flex h-full w-80 flex-col border-r border-slate-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl shadow-2xl text-slate-800 dark:text-zinc-100 transition-colors">
        {/* 顶部标题栏 */}
        <div className="flex h-12 items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 px-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 shadow-sm shadow-blue-500/40" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{t('modals.appsTitle')}</h2>
            <span className="rounded-full bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:text-zinc-400">
              {apps.length}
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close applications drawer"
            className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 头部操作：新建应用与模版中心 */}
        <div className="p-3 border-b border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCreateNamedApp ? setNewProjectName('') : onCreateApp()}
            disabled={busy}
            aria-label={t('modals.newApp')}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            <span>+</span>
            <span>{t('modals.newApp')}</span>
          </button>
          {onOpenTemplates && (
            <button
              type="button"
              onClick={onOpenTemplates}
              aria-label={t('modals.browseTemplates')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-zinc-700/80 bg-white/80 dark:bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>✨</span>
              <span>{t('modals.browseTemplates')}</span>
            </button>
          )}
        </div>

        {newProjectName !== null && onCreateNamedApp && (
          <form className="px-3 py-2 space-y-2 border-b border-slate-200/70 dark:border-zinc-800/70" onSubmit={(event) => {
            event.preventDefault();
            const name = newProjectName.trim();
            if (name && !busy) void onCreateNamedApp(name);
          }}>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300" htmlFor="new-project-name">Project name</label>
            <input id="new-project-name" autoFocus value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/80 p-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" />
            <button type="submit" disabled={busy || !newProjectName.trim()}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 transition-colors">Create project</button>
          </form>
        )}
        {error && <p role="alert" className="px-3 py-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        {/* 应用列表滚动区 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {apps.map((app) => {
            const isActive = app.id === activeAppId;
            return (
              <div
                key={app.id}
                onClick={() => { if (!busy) onSelectApp(app.id); }}
                className={`group relative flex cursor-pointer flex-col rounded-xl border p-3 text-xs transition-all ${
                  isActive
                    ? 'border-blue-500/80 dark:border-blue-500/60 bg-blue-50/80 dark:bg-blue-950/35 text-slate-900 dark:text-zinc-50 shadow-sm'
                    : 'border-slate-200/80 dark:border-zinc-800/80 bg-white/65 dark:bg-zinc-950/50 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/90 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{app.name}</span>
                  {isActive ? (
                    <span className="rounded-full bg-blue-500/15 dark:bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 border border-blue-500/25 dark:border-blue-500/30">
                      {t('modals.activeBadge')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Delete ${app.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteApp(app.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] transition-opacity"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <span className="mt-1 font-mono text-[10px] text-slate-500 dark:text-zinc-500 truncate">{app.path}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 遮罩点击关闭区 */}
      <div className="flex-1" onClick={close} />
    </div>
  );
};

export default AppDrawer;
