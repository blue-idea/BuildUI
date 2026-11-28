import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  FolderOpen,
  Trash2,
  ExternalLink,
  Download,
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
  Camera,
  Loader2,
} from 'lucide-react';
import { AppItem, ProjectPlatform, inferAppPlatform } from './AppDrawer';
import { useI18n } from '../i18n/I18nContext';
import {
  MACOS_CONTROLS,
  MACOS_FLAT_CARD,
  MACOS_FLAT_GRID,
  MACOS_FLAT_PAGE,
  MACOS_SEGMENTED,
} from '../config/macosFlatUi';

export interface ProjectsCenterViewProps {
  apps: AppItem[];
  activeAppId: number;
  onSelectApp?: (id: number) => void;
  onOpenProject?: (id: number) => void;
  onNewProject: () => void;
  onDeleteApp: (id: number) => void;
  onRenameApp?: (id: number, newName: string) => void;
  onExportProject?: (app: AppItem) => void;
  onCaptureScreenshot?: (app: AppItem) => Promise<void> | void;
  capturingAppId?: number | null;
  onOpenInFileManager?: (path: string) => void;
  busy?: boolean;
  error?: string;
}

// 为无真实截图的工程卡片分配克制的 Apple 系微缩主色点缀
const PROJECT_PREVIEW_ACCENTS = ['#0071e3', '#0284c7', '#0d9488', '#475569'] as const;

/**
 * 纯展示子组件：渲染工程卡片顶部截图预览区
 * 优先展示真实工程截图（thumbnailUrl）；缺失时展示匹配目标平台的 macOS 扁平微缩界面预览。
 */
const ProjectThumbnailPreview: React.FC<{
  app: AppItem;
  platform: ProjectPlatform;
  altText: string;
}> = ({ app, platform, altText }) => {
  const accent = PROJECT_PREVIEW_ACCENTS[Math.abs(app.id) % PROJECT_PREVIEW_ACCENTS.length];
  const shortSlug = (app.path || app.name).split(/[\\/]/).filter(Boolean).pop() || app.name;

  if (app.thumbnailUrl) {
    return (
      <div
        data-testid={`project-card-preview-${app.id}`}
        className="relative h-[clamp(7.25rem,9vw,8.5rem)] w-full overflow-hidden border-b border-black/[0.06] dark:border-white/[0.07] bg-[#eceef2] dark:bg-[#161618] select-none"
      >
        <img
          src={app.thumbnailUrl}
          alt={altText}
          className="w-full h-full object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      data-testid={`project-card-preview-${app.id}`}
      className="relative h-[clamp(7.25rem,9vw,8.5rem)] w-full overflow-hidden border-b border-black/[0.06] dark:border-white/[0.07] bg-[#eceef2] dark:bg-[#161618] px-3.5 pt-8 pb-0 flex items-end justify-center select-none"
    >
      {platform === 'app' ? (
        /* 移动端 App 扁平微缩截图预览 */
        <div className="w-[54%] max-w-[152px] h-full rounded-t-[14px] border-t border-x border-black/[0.09] dark:border-white/[0.11] bg-white dark:bg-[#1f1f22] px-2.5 pt-2 pb-2 flex flex-col justify-between">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-[3px] rounded-full bg-black/20 dark:bg-white/25" />
            <div className="w-full flex items-center justify-between gap-1 pt-0.5">
              <div className="h-1.5 w-12 rounded-full bg-black/65 dark:bg-white/75" />
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: accent }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1">
              <div className="h-4 rounded-[5px] bg-[#f5f5f7] dark:bg-[#2a2a2e] border border-black/[0.06] dark:border-white/[0.07]" />
              <div
                className="h-4 rounded-[5px] opacity-20"
                style={{ backgroundColor: accent }}
              />
            </div>
            <div
              className="h-2.5 w-full rounded-[5px]"
              style={{ backgroundColor: accent }}
            />
          </div>
        </div>
      ) : platform === 'desktop' ? (
        /* 桌面客户端 macOS 扁平微缩截图预览 */
        <div className="w-full h-full rounded-t-[10px] border-t border-x border-black/[0.09] dark:border-white/[0.11] bg-white dark:bg-[#1f1f22] overflow-hidden flex flex-col">
          <div className="h-4.5 px-2 py-1 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f7f7f9] dark:bg-[#26262a] shrink-0">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f57]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#febc2e]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="h-1 w-12 rounded-full bg-black/20 dark:bg-white/25" />
            <span className="w-3" />
          </div>
          <div className="flex flex-1 min-h-0">
            <div className="w-[27%] border-r border-black/[0.06] dark:border-white/[0.07] bg-[#f7f7f9]/80 dark:bg-[#232327] p-1.5 flex flex-col gap-1">
              <div
                className="h-1.5 w-full rounded-[3px]"
                style={{ backgroundColor: accent }}
              />
              <div className="h-1.5 w-4/5 rounded-[3px] bg-black/15 dark:bg-white/20" />
              <div className="h-1.5 w-3/5 rounded-[3px] bg-black/10 dark:bg-white/12" />
            </div>
            <div className="flex-1 p-2 flex flex-col justify-between gap-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-5 rounded-[5px] bg-[#f5f5f7] dark:bg-[#2a2a2e] border border-black/[0.05] dark:border-white/[0.06]" />
                <div className="h-5 rounded-[5px] bg-[#f5f5f7] dark:bg-[#2a2a2e] border border-black/[0.05] dark:border-white/[0.06]" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="h-2 flex-1 rounded-full bg-black/10 dark:bg-white/15" />
                <div
                  className="h-2.5 w-9 rounded-[4px] shrink-0"
                  style={{ backgroundColor: accent }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Web 应用扁平微缩截图预览 */
        <div className="w-full h-full rounded-t-[10px] border-t border-x border-black/[0.09] dark:border-white/[0.11] bg-white dark:bg-[#1f1f22] overflow-hidden flex flex-col">
          <div className="h-4.5 px-2 py-1 flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f7f7f9] dark:bg-[#26262a] shrink-0">
            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-[3px]"
                style={{ backgroundColor: accent }}
              />
              <span className="h-1 w-6 rounded-full bg-black/25 dark:bg-white/30" />
            </div>
            <span className="px-1.5 py-[1px] rounded-[4px] bg-black/[0.05] dark:bg-white/[0.08] font-mono text-[8px] text-[#86868b] dark:text-[#98989d] truncate max-w-[116px]">
              /{shortSlug}
            </span>
          </div>
          <div className="flex-1 p-2 grid grid-cols-12 gap-1.5 items-center">
            <div className="col-span-7 flex flex-col gap-1.5">
              <div className="h-1.5 w-4/5 rounded-full bg-black/65 dark:bg-white/75" />
              <div className="h-1 w-full rounded-full bg-black/18 dark:bg-white/22" />
              <div className="flex items-center gap-1 pt-0.5">
                <div
                  className="h-2.5 w-10 rounded-[4px]"
                  style={{ backgroundColor: accent }}
                />
                <div className="h-2.5 w-7 rounded-[4px] bg-black/[0.07] dark:bg-white/[0.1]" />
              </div>
            </div>
            <div className="col-span-5 h-full rounded-[6px] border border-black/[0.06] dark:border-white/[0.07] bg-[#f5f5f7] dark:bg-[#26262a] p-1.5 flex items-end gap-1">
              <div className="flex-1 h-[45%] rounded-[2px] bg-black/15 dark:bg-white/20" />
              <div
                className="flex-1 h-[78%] rounded-[2px] opacity-85"
                style={{ backgroundColor: accent }}
              />
              <div className="flex-1 h-[60%] rounded-[2px] bg-black/20 dark:bg-white/25" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProjectsCenterView: React.FC<ProjectsCenterViewProps> = ({
  apps,
  activeAppId,
  onSelectApp,
  onOpenProject,
  onNewProject,
  onDeleteApp,
  onRenameApp,
  onExportProject,
  onCaptureScreenshot,
  capturingAppId = null,
  onOpenInFileManager,
  busy = false,
  error,
}) => {
  const { t } = useI18n();
  const [platformFilter, setPlatformFilter] = useState<ProjectPlatform | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
    onSelectApp?.(appId);
    onOpenProject?.(appId);
  };

  const renderPlatformBadge = (platform: ProjectPlatform, appId: number) => {
    switch (platform) {
      case 'desktop':
        return (
          <span
            data-testid={`project-platform-badge-${appId}`}
            className={MACOS_CONTROLS.previewOverlayBadge}
          >
            <Monitor className="w-2.5 h-2.5" />
            <span>{t('projectsPage.platformDesktop')}</span>
          </span>
        );
      case 'app':
        return (
          <span
            data-testid={`project-platform-badge-${appId}`}
            className={MACOS_CONTROLS.previewOverlayBadge}
          >
            <Smartphone className="w-2.5 h-2.5" />
            <span>{t('projectsPage.platformApp')}</span>
          </span>
        );
      case 'web':
      default:
        return (
          <span
            data-testid={`project-platform-badge-${appId}`}
            className={MACOS_CONTROLS.previewOverlayBadge}
          >
            <Globe className="w-2.5 h-2.5" />
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

  const filterTabs = [
    { id: 'all' as const, testId: 'project-filter-all', label: t('projectsPage.tabAll'), count: counts.all, icon: LayoutGrid },
    { id: 'web' as const, testId: 'project-filter-web', label: t('projectsPage.tabWeb'), count: counts.web, icon: Globe },
    { id: 'desktop' as const, testId: 'project-filter-desktop', label: t('projectsPage.tabDesktop'), count: counts.desktop, icon: Monitor },
    { id: 'app' as const, testId: 'project-filter-app', label: t('projectsPage.tabApp'), count: counts.app, icon: Smartphone },
  ];

  return (
    <div data-testid="projects-center-view" className={`${MACOS_FLAT_PAGE.root} select-none`}>
      <div data-testid="projects-center-container" className={MACOS_FLAT_PAGE.container}>
        {/* 顶部标题栏与操作栏 */}
        <header className={MACOS_FLAT_PAGE.header}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={MACOS_FLAT_PAGE.headerIconBox}>
              <FolderKanban className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={MACOS_FLAT_PAGE.title}>{t('projectsPage.title')}</h1>
                <span className={MACOS_CONTROLS.neutralBadge}>{apps.length}</span>
              </div>
              <p className={MACOS_FLAT_PAGE.subtitle}>{t('projectsPage.subtitle')}</p>
            </div>
          </div>

          {/* 搜索与全局操作 */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* 实时搜索过滤框 */}
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                data-testid="project-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('projectsPage.searchPlaceholder')}
                className={MACOS_CONTROLS.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 新建工程按钮 */}
            <button
              type="button"
              data-testid="new-project-btn"
              onClick={onNewProject}
              className={`${MACOS_CONTROLS.primaryButton} h-9 shrink-0`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('projectsPage.newProject')}</span>
            </button>
          </div>
        </header>

        {/* 平台分类 macOS 分段控制器：全部、Web 应用、桌面客户端、移动端 App */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Project platform categories"
            className={MACOS_SEGMENTED.track}
          >
            {filterTabs.map(({ id, testId, label, count, icon: Icon }) => {
              const isSelected = platformFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  data-testid={testId}
                  aria-selected={isSelected}
                  onClick={() => setPlatformFilter(id)}
                  className={`${MACOS_SEGMENTED.itemBase} py-1 px-2.5 ${
                    isSelected ? MACOS_SEGMENTED.itemActive : MACOS_SEGMENTED.itemInactive
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-[#0071e3] dark:text-[#0a84ff]' : ''
                    }`}
                  />
                  <span>{label}</span>
                  <span className={MACOS_SEGMENTED.countBadge}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 错误提示条 */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200/80 dark:border-rose-800/60 text-[12px] text-rose-700 dark:text-rose-300"
          >
            {error}
          </div>
        )}

        {/* 工程卡片流式自适应网格 */}
        {filteredApps.length > 0 ? (
          <div data-testid="projects-grid" className={MACOS_FLAT_GRID.cards}>
            {filteredApps.map((app) => {
              const isActive = app.id === activeAppId;
              const isConfirmingDelete = deletingId === app.id;
              const isEditing = editingId === app.id;
              const platform = app.platform ?? inferAppPlatform(app);

              return (
                <div
                  key={app.id}
                  data-testid={`project-card-${app.id}`}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-[border-color,background-color] duration-150 ${
                    isActive
                      ? MACOS_FLAT_CARD.interactiveActive
                      : MACOS_FLAT_CARD.interactiveIdle
                  }`}
                >
                  {/* 顶部工程预览截图区 + 顶部安全区徽章（零遮挡） */}
                  <div className="relative">
                    <ProjectThumbnailPreview
                      app={app}
                      platform={platform}
                      altText={t('projectsPage.previewAlt', { name: app.name })}
                    />

                    <div className="absolute inset-x-2.5 top-2 flex items-center justify-between gap-2 pointer-events-none">
                      <div>
                        {isActive && (
                          <span
                            data-testid={`active-badge-${app.id}`}
                            className={MACOS_CONTROLS.activePill}
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{t('projectsPage.activeBadge')}</span>
                          </span>
                        )}
                      </div>

                      {renderPlatformBadge(platform, app.id)}
                    </div>

                    {/* 右下角工程截图捕获/替换按钮（与顶部徽章零遮挡） */}
                    {onCaptureScreenshot && (
                      <button
                        type="button"
                        data-testid={`capture-project-screenshot-btn-${app.id}`}
                        onClick={() => void onCaptureScreenshot(app)}
                        disabled={busy || capturingAppId !== null}
                        title={
                          app.thumbnailUrl
                            ? t('projectsPage.refreshScreenshot')
                            : t('projectsPage.captureScreenshot')
                        }
                        aria-label={t('projectsPage.captureScreenshotAria', { name: app.name })}
                        className={`absolute right-2 bottom-2 z-10 ${MACOS_CONTROLS.previewActionPill}`}
                      >
                        {capturingAppId === app.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#0071e3] dark:text-[#0a84ff]" />
                        ) : (
                          <Camera className="w-3 h-3" />
                        )}
                        <span>
                          {capturingAppId === app.id
                            ? t('projectsPage.capturingScreenshot')
                            : app.thumbnailUrl
                              ? t('projectsPage.refreshScreenshot')
                              : t('projectsPage.captureScreenshot')}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* 卡片主体信息区 */}
                  <div className="px-4 py-3.5 flex flex-col flex-1 justify-between gap-3">
                    <div className="min-w-0">
                      {/* 卡片名称（支持内联重命名） */}
                      <div className="flex items-center justify-between gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1">
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
                              className="w-full text-[12.5px] font-medium px-2 py-1 rounded-[7px] border border-[#0071e3] dark:border-[#0a84ff] bg-[#f5f5f7] dark:bg-[#141416] text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none"
                            />
                            <button
                              type="button"
                              data-testid={`save-rename-btn-${app.id}`}
                              onClick={() => handleSaveRename(app.id)}
                              className="p-1.5 rounded-[7px] bg-[#0071e3] dark:bg-[#0a84ff] text-white hover:opacity-90 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-[7px] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <h2 className="font-semibold text-[13.5px] tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                              {app.name}
                            </h2>
                            {onRenameApp && (
                              <button
                                type="button"
                                data-testid={`rename-project-btn-${app.id}`}
                                onClick={() => handleStartRename(app)}
                                title={t('projectsPage.renameProject')}
                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-opacity rounded-[6px] cursor-pointer shrink-0"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 路径信息 */}
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6e6e73] dark:text-[#98989d] font-mono mt-2 px-2.5 py-1.5 rounded-[8px] bg-[#f5f5f7] dark:bg-[#141416] border border-black/[0.05] dark:border-white/[0.06]">
                        <HardDrive className="w-3 h-3 text-[#86868b] shrink-0" />
                        <span className="truncate">{app.path}</span>
                      </div>

                      {/* 创建时间 */}
                      {app.createdAt && (
                        <div className="flex items-center gap-1 text-[11px] text-[#86868b] dark:text-[#8e8e93] mt-2">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>
                            {t('projectsPage.createdTime')}: {formatCreationDate(app.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 底部扁平操作栏：打开工程 + 导出 + 打开目录 + 删除 */}
                    <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        data-testid={`open-project-btn-${app.id}`}
                        onClick={() => handleOpen(app.id)}
                        disabled={busy}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                          isActive
                            ? 'bg-[#0071e3] hover:bg-[#0077ed] dark:bg-[#0a84ff] dark:hover:bg-[#2894ff] text-white'
                            : 'bg-black/[0.045] dark:bg-white/[0.07] hover:bg-[#0071e3]/10 dark:hover:bg-[#0a84ff]/15 text-[#1d1d1f] dark:text-[#f5f5f7] hover:text-[#0071e3] dark:hover:text-[#0a84ff]'
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{t('projectsPage.openProject')}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {/* 导出按钮 */}
                        <button
                          type="button"
                          data-testid={`export-project-btn-${app.id}`}
                          onClick={() => onExportProject?.(app)}
                          disabled={busy}
                          title={t('projectsPage.exportProject')}
                          aria-label={`${t('projectsPage.exportProject')} ${app.name}`}
                          className={MACOS_CONTROLS.iconButton}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t('projectsPage.exportProject')}</span>
                        </button>

                        {onOpenInFileManager && app.path && (
                          <button
                            type="button"
                            data-testid={`reveal-folder-btn-${app.id}`}
                            onClick={() => onOpenInFileManager(app.path)}
                            title={t('projectsPage.revealInFinder')}
                            className="p-1.5 rounded-[8px] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 删除操作 */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(app.id)}
                              className="px-2 py-1 rounded-[7px] bg-[#ff3b30] hover:opacity-90 text-white text-[11px] font-medium transition-opacity cursor-pointer"
                            >
                              {t('common.confirm')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 rounded-[7px] text-[#6e6e73] dark:text-[#98989d] text-[11px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
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
                            className="p-1.5 rounded-[8px] text-[#86868b] hover:text-[#ff3b30] dark:hover:text-[#ff453a] hover:bg-[#ff3b30]/10 dark:hover:bg-[#ff453a]/15 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 空状态 */
          <div data-testid="empty-projects-state" className={MACOS_FLAT_CARD.emptyState}>
            <div className="w-11 h-11 rounded-xl bg-[#0071e3]/10 dark:bg-[#0a84ff]/15 border border-[#0071e3]/15 dark:border-[#0a84ff]/20 text-[#0071e3] dark:text-[#0a84ff] flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="text-[14px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              {t('projectsPage.emptyTitle')}
            </h3>
            <p className="text-[12px] text-[#6e6e73] dark:text-[#98989d] max-w-sm">
              {t('projectsPage.emptyDesc')}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={onNewProject}
                className={MACOS_CONTROLS.primaryButton}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('projectsPage.newProject')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsCenterView;
