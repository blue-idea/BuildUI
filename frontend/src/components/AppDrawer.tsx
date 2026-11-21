import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

export interface AppItem {
  id: number;
  name: string;
  path: string;
  createdAt?: string;
}

export interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppItem[];
  activeAppId: number;
  onSelectApp: (id: number) => void;
  onCreateApp: () => void;
  onCreateNamedApp?: (name: string) => Promise<void>;
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
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm">
      {/* 侧边滑出抽屉 */}
      <div className="flex h-full w-80 flex-col border-r border-slate-800 bg-slate-900 shadow-2xl text-slate-100">
        {/* 顶部标题栏 */}
        <div className="flex h-12 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <h2 className="text-sm font-semibold text-white">{t('modals.appsTitle')}</h2>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
              {apps.length}
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close applications drawer"
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 头部操作：新建应用与模版中心 */}
        <div className="p-3 border-b border-slate-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCreateNamedApp ? setNewProjectName('') : onCreateApp()}
            disabled={busy}
            aria-label={t('modals.newApp')}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            <span>+</span>
            <span>{t('modals.newApp')}</span>
          </button>
          {onOpenTemplates && (
            <button
              type="button"
              onClick={onOpenTemplates}
              aria-label={t('modals.browseTemplates')}
              className="flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <span>✨</span>
              <span>{t('modals.browseTemplates')}</span>
            </button>
          )}
        </div>

        {newProjectName !== null && onCreateNamedApp && (
          <form className="px-3 py-2 space-y-2" onSubmit={(event) => {
            event.preventDefault();
            const name = newProjectName.trim();
            if (name && !busy) void onCreateNamedApp(name);
          }}>
            <label className="block text-xs" htmlFor="new-project-name">Project name</label>
            <input id="new-project-name" autoFocus value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs" />
            <button type="submit" disabled={busy || !newProjectName.trim()}
              className="rounded bg-blue-600 px-3 py-2 text-xs disabled:opacity-50">Create project</button>
          </form>
        )}
        {error && <p role="alert" className="px-3 py-2 text-xs text-red-300">{error}</p>}
        {/* 应用列表滚动区 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {apps.map((app) => {
            const isActive = app.id === activeAppId;
            return (
              <div
                key={app.id}
                onClick={() => { if (!busy) onSelectApp(app.id); }}
                className={`group relative flex cursor-pointer flex-col rounded-lg border p-3 text-xs transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-950/30 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-100 truncate">{app.name}</span>
                  {isActive ? (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-500/30">
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
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-[11px] transition-opacity"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <span className="mt-1 font-mono text-[10px] text-slate-500 truncate">{app.path}</span>
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
