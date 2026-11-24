import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  FolderOpen,
  Trash2,
  ExternalLink,
  Layers,
  X,
  Clock,
  HardDrive,
  CheckCircle2,
  Pencil,
  Check,
  Globe,
  Monitor,
  Smartphone,
  LayoutGrid,
} from 'lucide-react';
import { AppItem, ProjectPlatform, inferAppPlatform } from './AppDrawer';
import { useI18n } from '../i18n/I18nContext';

export interface ProjectsCenterViewProps {
  apps: AppItem[];
  activeAppId: number;
  onSelectApp: (id: number) => void;
  onOpenProject?: (id: number) => void;
  onCreateApp: () => void;
  onCreateNamedApp?: (name: string, platform?: ProjectPlatform) => Promise<void> | void;
  onDeleteApp: (id: number) => void;
  onRenameApp?: (id: number, newName: string) => void;
  onOpenTemplates?: () => void;
  onOpenInFileManager?: (path: string) => void;
  busy?: boolean;
  error?: string;
}

export const ProjectsCenterView: React.FC<ProjectsCenterViewProps> = ({
  apps,
  activeAppId,
  onSelectApp,
  onOpenProject,
  onCreateApp,
  onCreateNamedApp,
  onDeleteApp,
  onRenameApp,
  onOpenTemplates,
  onOpenInFileManager,
  busy = false,
  error,
}) => {
  const { t } = useI18n();
  const [platformFilter, setPlatformFilter] = useState<ProjectPlatform | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPlatform, setNewProjectPlatform] = useState<ProjectPlatform>('web');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  // 按照平台形态（Web、Desktop、App）与搜索关键字联合过滤
  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return apps.filter((app) => {
      const appPlatform = app.platform ?? inferAppPlatform(app);
      if (platformFilter !== 'all' && appPlatform !== platformFilter) {
        return false;
      }
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        (app.path && app.path.toLowerCase().includes(q))
      );
    });
  }, [apps, platformFilter, searchQuery]);

  // 各平台形态工程数量统计
  const counts = useMemo(() => {
    const all = apps.length;
    let web = 0;
    let desktop = 0;
    let app = 0;
    apps.forEach((a) => {
      const p = a.platform ?? inferAppPlatform(a);
      if (p === 'desktop') desktop++;
      else if (p === 'app') app++;
      else web++;
    });
    return { all, web, desktop, app };
  }, [apps]);

  const handleOpen = (appId: number) => {
    onSelectApp(appId);
    onOpenProject?.(appId);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name || busy) return;

    if (onCreateNamedApp) {
      await onCreateNamedApp(name, newProjectPlatform);
    } else {
      onCreateApp();
    }
    setNewProjectName('');
    setIsCreating(false);
  };

  const renderPlatformBadge = (platform: ProjectPlatform, appId: number) => {
    switch (platform) {
      case 'desktop':
        return (
          <span
            data-testid={`project-platform-badge-${appId}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shrink-0"
          >
            <Monitor className="w-3 h-3" />
            <span>{t('projectsPage.platformDesktop')}</span>
          </span>
        );
      case 'app':
        return (
          <span
            data-testid={`project-platform-badge-${appId}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0"
          >
            <Smartphone className="w-3 h-3" />
            <span>{t('projectsPage.platformApp')}</span>
          </span>
        );
      case 'web':
      default:
        return (
          <span
            data-testid={`project-platform-badge-${appId}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0"
          >
            <Globe className="w-3 h-3" />
            <span>{t('projectsPage.platformWeb')}</span>
          </span>
        );
    }
  };

  const handleDelete = (id: number) => {
    onDeleteApp(id);
    setDeletingId(null);
  };

  const handleStartRename = (app: AppItem) => {
    setEditingId(app.id);
    setEditingName(app.name);
  };

  const handleSaveRename = (id: number) => {
    const trimmed = editingName.trim();
    if (trimmed && onRenameApp) {
      onRenameApp(id, trimmed);
    }
    setEditingId(null);
  };

  const formatCreationDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      data-testid="projects-center-view"
      className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 p-6 sm:p-8 transition-colors select-none"
    >
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* 顶部标题栏与操作栏 */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
                  {t('projectsPage.title')}
                </h1>
                <span className="rounded-full bg-slate-200/80 dark:bg-zinc-800 px-2 py-0.5 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                  {apps.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {t('projectsPage.subtitle')}
              </p>
            </div>
          </div>

          {/* 搜索与全局操作 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 实时搜索过滤框 */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-testid="project-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('projectsPage.searchPlaceholder')}
                className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 新建工程按钮 */}
            <button
              type="button"
              data-testid="new-project-btn"
              aria-label="New project - New app"
              onClick={() => setIsCreating((prev) => !prev)}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('projectsPage.newProject')}</span>
            </button>

            {/* 从模版浏览 */}
            {onOpenTemplates && (
              <button
                type="button"
                data-testid="browse-templates-btn"
                onClick={onOpenTemplates}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium shadow-2xs transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('projectsPage.browseTemplates')}</span>
              </button>
            )}
          </div>
        </header>

        {/* 平台分类选项卡：全部、Web 应用、桌面端应用、移动端 App */}
        <div
          role="tablist"
          aria-label="Project platform categories"
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            role="tab"
            data-testid="project-filter-all"
            aria-selected={platformFilter === 'all'}
            onClick={() => setPlatformFilter('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              platformFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('projectsPage.tabAll')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                platformFilter === 'all'
                  ? 'bg-blue-700/80 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            data-testid="project-filter-web"
            aria-selected={platformFilter === 'web'}
            onClick={() => setPlatformFilter('web')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              platformFilter === 'web'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('projectsPage.tabWeb')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                platformFilter === 'web'
                  ? 'bg-blue-700/80 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}
            >
              {counts.web}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            data-testid="project-filter-desktop"
            aria-selected={platformFilter === 'desktop'}
            onClick={() => setPlatformFilter('desktop')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              platformFilter === 'desktop'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{t('projectsPage.tabDesktop')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                platformFilter === 'desktop'
                  ? 'bg-purple-700/80 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}
            >
              {counts.desktop}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            data-testid="project-filter-app"
            aria-selected={platformFilter === 'app'}
            onClick={() => setPlatformFilter('app')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              platformFilter === 'app'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t('projectsPage.tabApp')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                platformFilter === 'app'
                  ? 'bg-emerald-700/80 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}
            >
              {counts.app}
            </span>
          </button>
        </div>

        {/* 错误提示条 */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-600 dark:text-rose-400"
          >
            {error}
          </div>
        )}

        {/* 新建项目卡片表单 */}
        {isCreating && (
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-700/60 shadow-md transition-all">
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="new-project-input"
                  className="text-xs font-semibold text-slate-700 dark:text-zinc-300"
                >
                  {t('projectsPage.projectNameLabel')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  id="new-project-input"
                  data-testid="new-project-name-input"
                  aria-label="Project name"
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t('projectsPage.projectNamePlaceholder')}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                {/* 应用形态选择器 */}
                <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 self-start sm:self-auto select-none">
                  <button
                    type="button"
                    data-testid="new-project-platform-web"
                    onClick={() => setNewProjectPlatform('web')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      newProjectPlatform === 'web'
                        ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Web</span>
                  </button>
                  <button
                    type="button"
                    data-testid="new-project-platform-desktop"
                    onClick={() => setNewProjectPlatform('desktop')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      newProjectPlatform === 'desktop'
                        ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-2xs font-semibold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    data-testid="new-project-platform-app"
                    onClick={() => setNewProjectPlatform('app')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      newProjectPlatform === 'app'
                        ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>App</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    data-testid="submit-create-project-btn"
                    aria-label="Create project"
                    disabled={busy || !newProjectName.trim()}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {t('projectsPage.createProject')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    {t('projectsPage.cancel')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 工程卡片列表 */}
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => {
              const isActive = app.id === activeAppId;
              const isConfirmingDelete = deletingId === app.id;
              const isEditing = editingId === app.id;

              return (
                <div
                  key={app.id}
                  data-testid={`project-card-${app.id}`}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-white dark:bg-zinc-900 shadow-md ring-1 ring-blue-500/30'
                      : 'border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-zinc-700 shadow-2xs'
                  }`}
                >
                  <div>
                    {/* 卡片头部：图标、名称（或内联编辑）与激活标记 */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 group-hover:bg-blue-50 dark:group-hover:bg-zinc-750 group-hover:text-blue-600 transition-colors'
                          }`}
                        >
                          <FolderKanban className="w-4 h-4" />
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1 mr-2">
                            <input
                              data-testid={`rename-input-${app.id}`}
                              type="text"
                              autoFocus
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(app.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-blue-400 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none"
                            />
                            <button
                              type="button"
                              data-testid={`save-rename-btn-${app.id}`}
                              onClick={() => handleSaveRename(app.id)}
                              className="p-1 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h2 className="font-semibold text-sm text-slate-900 dark:text-zinc-100 truncate">
                              {app.name}
                            </h2>
                            {onRenameApp && (
                              <button
                                type="button"
                                data-testid={`rename-project-btn-${app.id}`}
                                onClick={() => handleStartRename(app)}
                                title={t('projectsPage.renameProject')}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-opacity rounded"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {renderPlatformBadge(app.platform ?? inferAppPlatform(app), app.id)}
                        {isActive && (
                          <span
                            data-testid={`active-badge-${app.id}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0"
                          >
                            <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span>{t('projectsPage.activeBadge')}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 路径信息 */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-3 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950/80 border border-slate-100 dark:border-zinc-850">
                      <HardDrive className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{app.path}</span>
                    </div>

                    {/* 创建时间 */}
                    {app.createdAt && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500 mt-2.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {t('projectsPage.createdTime')}: {formatCreationDate(app.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 底部操作栏 */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        data-testid={`open-project-btn-${app.id}`}
                        onClick={() => handleOpen(app.id)}
                        disabled={busy}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{t('projectsPage.openProject')}</span>
                      </button>

                      {onOpenInFileManager && app.path && (
                        <button
                          type="button"
                          data-testid={`reveal-folder-btn-${app.id}`}
                          onClick={() => onOpenInFileManager(app.path)}
                          title={t('projectsPage.revealInFinder')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* 删除操作 */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 animate-fadeIn">
                        <button
                          type="button"
                          onClick={() => handleDelete(app.id)}
                          className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-medium transition-colors"
                        >
                          {t('common.confirm')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 rounded-md text-slate-500 dark:text-zinc-400 text-[11px] hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid={`delete-project-btn-${app.id}`}
                        onClick={() => handleDelete(app.id)}
                        title={t('projectsPage.deleteProject')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 空状态 */
          <div
            data-testid="empty-projects-state"
            className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xs transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-200">
              {t('projectsPage.emptyTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
              {t('projectsPage.emptyDesc')}
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('projectsPage.newProject')}</span>
              </button>
              {onOpenTemplates && (
                <button
                  type="button"
                  onClick={onOpenTemplates}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium transition-all"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('projectsPage.browseTemplates')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsCenterView;
