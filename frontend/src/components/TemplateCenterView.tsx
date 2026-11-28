import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Atom,
  Check,
  Globe,
  LayoutGrid,
  LayoutTemplate,
  Monitor,
  Search,
  Smartphone,
  Triangle,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import type { ProjectPlatform } from './AppDrawer';
import type { AppTemplate } from './TemplateModal';
import { useI18n } from '../i18n/I18nContext';
import {
  DEFAULT_PROJECT_TEMPLATE,
  getOfficialProjectTemplates,
  isProjectTemplateCompatible,
} from '../config/projectTemplates';
import {
  MACOS_CONTROLS,
  MACOS_FLAT_CARD,
  MACOS_FLAT_GRID,
  MACOS_FLAT_PAGE,
  MACOS_SEGMENTED,
} from '../config/macosFlatUi';

export type PlatformFilter = 'all' | ProjectPlatform;

export interface TemplateCenterViewProps {
  templates: AppTemplate[];
  onSelectTemplate: (templateId: string) => void | Promise<void>;
  onCreateProject?: (name: string, templateId: string, platform: ProjectPlatform) => Promise<void>;
  selectedTemplateId?: string;
  busy?: boolean;
  initialPlatform?: PlatformFilter;
}

const filters = [
  { id: 'all', label: 'templatesPage.tabAll', icon: LayoutGrid },
  { id: 'web', label: 'templatesPage.tabWeb', icon: Globe },
  { id: 'desktop', label: 'templatesPage.tabDesktop', icon: Monitor },
  { id: 'app', label: 'templatesPage.tabApp', icon: Smartphone },
] as const;

const platformLabels = { web: 'Web', desktop: 'Desktop', app: 'App' } as const;

/**
 * 纯展示子组件：渲染起步模版顶部的 macOS 扁平微缩架构预览画布
 */
const TemplateMiniPreview: React.FC<{
  template: AppTemplate;
  platform: ProjectPlatform;
}> = ({ template, platform }) => {
  const isExpo = template.icon === 'Expo' || platform === 'app';
  const isDesktop = platform === 'desktop';
  const accent =
    template.icon === 'React'
      ? '#0071e3'
      : template.icon === 'Expo'
      ? '#0d9488'
      : '#1d1d1f';

  return (
    <div
      data-testid={`template-card-preview-${template.id}`}
      className="relative h-[clamp(7.25rem,9vw,8.5rem)] w-full overflow-hidden border-b border-black/[0.06] dark:border-white/[0.07] bg-[#eceef2] dark:bg-[#161618] px-3.5 pt-8 pb-0 flex items-end justify-center select-none"
    >
      {isExpo ? (
        /* 移动端原生起步模版微缩画框 */
        <div className="w-[54%] max-w-[152px] h-full rounded-t-[14px] border-t border-x border-black/[0.09] dark:border-white/[0.11] bg-white dark:bg-[#1f1f22] px-2.5 pt-2 pb-2 flex flex-col justify-between">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-[3px] rounded-full bg-black/20 dark:bg-white/25" />
            <div className="w-full flex items-center justify-between pt-0.5">
              <div className="h-1.5 w-10 rounded-full bg-black/65 dark:bg-white/75" />
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-5 w-full rounded-[6px] bg-[#f5f5f7] dark:bg-[#2a2a2e] border border-black/[0.06] dark:border-white/[0.07]" />
            <div className="flex items-center justify-around pt-0.5">
              <span
                className="w-4 h-1.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <span className="w-3 h-1.5 rounded-full bg-black/15 dark:bg-white/20" />
              <span className="w-3 h-1.5 rounded-full bg-black/15 dark:bg-white/20" />
            </div>
          </div>
        </div>
      ) : isDesktop ? (
        /* 桌面端 React 工作台起步模版微缩窗口 */
        <div className="w-full h-full rounded-t-[10px] border-t border-x border-black/[0.09] dark:border-white/[0.11] bg-white dark:bg-[#1f1f22] overflow-hidden flex flex-col">
          <div className="h-4.5 px-2 py-1 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f7f7f9] dark:bg-[#26262a] shrink-0">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f57]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#febc2e]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="font-mono text-[8px] text-[#86868b] dark:text-[#98989d]">
              {template.id}
            </span>
          </div>
          <div className="flex flex-1 min-h-0">
            <div className="w-[26%] border-r border-black/[0.06] dark:border-white/[0.07] bg-[#f7f7f9]/80 dark:bg-[#232327] p-1.5 flex flex-col gap-1">
              <div
                className="h-1.5 w-full rounded-[3px]"
                style={{ backgroundColor: accent }}
              />
              <div className="h-1.5 w-4/5 rounded-[3px] bg-black/15 dark:bg-white/20" />
              <div className="h-1.5 w-3/5 rounded-[3px] bg-black/10 dark:bg-white/15" />
            </div>
            <div className="flex-1 p-2 flex flex-col justify-between gap-1.5">
              <div className="h-2 w-1/2 rounded-full bg-black/65 dark:bg-white/75" />
              <div className="grid grid-cols-3 gap-1.5 flex-1">
                <div className="rounded-[5px] bg-[#f5f5f7] dark:bg-[#2a2a2e] border border-black/[0.05] dark:border-white/[0.06]" />
                <div className="rounded-[5px] bg-[#f5f5f7] dark:bg-[#2a2a2e] border border-black/[0.05] dark:border-white/[0.06]" />
                <div
                  className="rounded-[5px] opacity-20"
                  style={{ backgroundColor: accent }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Web 起步模版微缩页面骨架 */
        <div className="w-full h-full rounded-t-[10px] border-t border-x border-black/[0.09] dark:border-white/[0.11] bg-white dark:bg-[#1f1f22] overflow-hidden flex flex-col">
          <div className="h-4.5 px-2 py-1 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f7f7f9] dark:bg-[#26262a] shrink-0">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-[3px] dark:bg-[#0a84ff]"
                style={{ backgroundColor: accent === '#1d1d1f' ? '#0071e3' : accent }}
              />
              <span className="h-1 w-8 rounded-full bg-black/25 dark:bg-white/30" />
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1 w-4 rounded-full bg-black/15 dark:bg-white/20" />
              <span className="h-1 w-4 rounded-full bg-black/15 dark:bg-white/20" />
            </div>
          </div>
          <div className="flex-1 p-2 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 flex-1">
                <div className="h-1.5 w-3/5 rounded-full bg-black/70 dark:bg-white/80" />
                <div className="h-1 w-4/5 rounded-full bg-black/18 dark:bg-white/22" />
              </div>
              <div className="h-3 w-10 rounded-[4px] bg-[#0071e3] dark:bg-[#0a84ff] shrink-0" />
            </div>
            <div className="grid grid-cols-3 gap-1.5 flex-1">
              <div className="rounded-[5px] bg-[#f5f5f7] dark:bg-[#2a2a2e] border border-black/[0.05] dark:border-white/[0.06]" />
              <div className="rounded-[5px] bg-[#f5f5f7] dark:bg-[#2a2a2e] border border-black/[0.05] dark:border-white/[0.06]" />
              <div className="rounded-[5px] bg-[#f5f5f7] dark:bg-[#2a2a2e] border border-black/[0.05] dark:border-white/[0.06]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function CreateProjectDialog({
  template,
  onClose,
  onConfirm,
}: {
  template: AppTemplate;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const titleId = useId();
  const descriptionId = useId();
  const nameId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const supportsModal = typeof HTMLDialogElement.prototype.showModal === 'function';

  useEffect(() => {
    const element = dialog.current;
    if (supportsModal && element && !element.open) element.showModal();
  }, [supportsModal]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || !name.trim()) return;
    setPending(true);
    setError('');
    try {
      await onConfirm(name.trim());
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      open={supportsModal ? undefined : true}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#1c1c1e] p-6 text-[#1d1d1f] dark:text-[#f5f5f7] backdrop:bg-black/45"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <h2 id={titleId} className="text-[16px] font-semibold tracking-[-0.01em]">
            {t('templatesPage.createApp')}
          </h2>
          <p id={descriptionId} className="mt-1 text-[12.5px] text-[#6e6e73] dark:text-[#98989d]">
            {template.name}
          </p>
        </div>
        <div>
          <label htmlFor={nameId} className="block text-[12px] font-medium text-[#515154] dark:text-[#aeaeb2]">
            {t('templatesPage.projectName')}
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
            disabled={pending}
            className={`${MACOS_CONTROLS.input} mt-1.5`}
          />
        </div>
        {error && (
          <p role="alert" className="text-[12px] text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.07]">
          <button
            type="button"
            className={MACOS_CONTROLS.secondaryButton}
            onClick={onClose}
            disabled={pending}
          >
            {t('templatesPage.cancel')}
          </button>
          <button
            type="submit"
            className={MACOS_CONTROLS.primaryButton}
            disabled={pending || !name.trim()}
          >
            {t(pending ? 'templatesPage.working' : 'templatesPage.createProject')}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function TemplateCenterView({
  templates,
  onSelectTemplate,
  onCreateProject,
  selectedTemplateId,
  busy = false,
  initialPlatform = 'all',
}: TemplateCenterViewProps) {
  const { t } = useI18n();
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(initialPlatform);
  const [searchQuery, setSearchQuery] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const [creation, setCreation] = useState<{ template: AppTemplate; platform: ProjectPlatform } | null>(null);
  const officialTemplates = getOfficialProjectTemplates(templates);
  // 目录中的默认项回退到官方模板，历史设置仍保留在原处。
  const activeTemplateId = officialTemplates.some((template) => template.id === selectedTemplateId)
    ? selectedTemplateId
    : DEFAULT_PROJECT_TEMPLATE;
  const query = searchQuery.trim().toLowerCase();
  const templatesForPlatform = (platform: PlatformFilter) =>
    platform === 'all'
      ? officialTemplates
      : officialTemplates.filter(
          (template) =>
            template.platform === platform || isProjectTemplateCompatible(template, platform)
        );
  const filtered = templatesForPlatform(platformFilter).filter((template) =>
    [template.name, template.description, template.category, template.id, ...template.tags].some(
      (value) => value.toLowerCase().includes(query)
    )
  );

  const select = async (template: AppTemplate) => {
    setSelectionError('');
    setSelecting(true);
    try {
      await onSelectTemplate(template.id);
    } catch (cause) {
      setSelectionError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div data-testid="template-center-view" className={MACOS_FLAT_PAGE.root}>
      <div data-testid="template-center-container" className={MACOS_FLAT_PAGE.container}>
        {/* 顶部 macOS 扁平工具栏与搜索框 */}
        <header className={MACOS_FLAT_PAGE.header}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={MACOS_FLAT_PAGE.headerIconBox}>
              <LayoutTemplate className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={MACOS_FLAT_PAGE.title}>{t('templatesPage.title')}</h1>
                <span className={MACOS_CONTROLS.neutralBadge}>{officialTemplates.length}</span>
              </div>
              <p className={MACOS_FLAT_PAGE.subtitle}>{t('templatesPage.subtitle')}</p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868b] pointer-events-none"
            />
            <input
              type="search"
              aria-label={t('templatesPage.searchPlaceholder')}
              data-testid="template-search-input"
              placeholder={t('templatesPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={MACOS_CONTROLS.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label={t('templatesPage.clearSearch')}
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] p-0.5 rounded cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* 平台分类 macOS 分段控制器 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={MACOS_SEGMENTED.track} aria-label="Template platform categories">
            {filters.map(({ id, label, icon: Icon }) => {
              const selected = platformFilter === id;
              const count = templatesForPlatform(id).length;
              if (id !== 'all' && id !== platformFilter && count === 0) return null;
              return (
                <button
                  key={id}
                  type="button"
                  data-testid={'platform-tab-' + id}
                  aria-pressed={selected}
                  onClick={() => setPlatformFilter(id)}
                  className={clsx(
                    MACOS_SEGMENTED.itemBase,
                    'py-1 px-2.5',
                    selected ? MACOS_SEGMENTED.itemActive : MACOS_SEGMENTED.itemInactive
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={clsx(
                      'h-3.5 w-3.5',
                      selected && 'text-[#0071e3] dark:text-[#0a84ff]'
                    )}
                  />
                  <span>{t(label)}</span>
                  <span className={MACOS_SEGMENTED.countBadge}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectionError && (
          <p
            role="alert"
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200/80 dark:border-rose-800/60 text-[12px] text-rose-700 dark:text-rose-300"
          >
            {selectionError}
          </p>
        )}

        {filtered.length === 0 && (
          <div data-testid="template-empty-state" className={MACOS_FLAT_CARD.emptyState}>
            <div className="w-11 h-11 rounded-xl bg-black/[0.045] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#86868b] dark:text-[#8e8e93]">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <p className="text-[12.5px] text-[#6e6e73] dark:text-[#98989d]">
              {t('templatesPage.noResults')}
            </p>
            <button
              type="button"
              data-testid="clear-search-btn"
              className={MACOS_CONTROLS.secondaryButton}
              onClick={() => {
                setSearchQuery('');
                setPlatformFilter('all');
              }}
            >
              {t('templatesPage.clearSearch')}
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <section aria-label={t('templatesPage.official')} className="flex flex-col gap-3">
            <h2 className="text-[12.5px] font-semibold tracking-[-0.01em] text-[#515154] dark:text-[#aeaeb2]">
              {t('templatesPage.official')}
            </h2>
            <div data-testid="templates-grid" className={MACOS_FLAT_GRID.cards}>
              {filtered.map((item) => {
                const selected = item.id === activeTemplateId;
                const platform = platformFilter === 'all' ? item.platform ?? 'web' : platformFilter;
                const Icon =
                  item.icon === 'React' ? Atom : item.icon === 'Expo' ? Smartphone : Triangle;
                return (
                  <article
                    key={item.id}
                    data-testid={'template-card-' + item.id}
                    className={clsx(
                      'group flex flex-col overflow-hidden rounded-2xl border transition-[border-color,background-color] duration-150',
                      selected
                        ? MACOS_FLAT_CARD.interactiveActive
                        : MACOS_FLAT_CARD.interactiveIdle
                    )}
                  >
                    {/* 顶部架构微缩预览画布 + 顶部安全区徽章 */}
                    <div className="relative">
                      <TemplateMiniPreview template={item} platform={platform} />

                      <div className="absolute inset-x-2.5 top-2 flex items-center justify-between gap-2 pointer-events-none">
                        <div>
                          {selected && (
                            <span className={MACOS_CONTROLS.activePill}>
                              <Check className="h-2.5 w-2.5 stroke-[2.75]" />
                              <span>{t('templatesPage.selectedBadge')}</span>
                            </span>
                          )}
                        </div>

                        <span className={MACOS_CONTROLS.previewOverlayBadge}>
                          {platform === 'app' ? (
                            <Smartphone className="h-2.5 w-2.5" />
                          ) : platform === 'desktop' ? (
                            <Monitor className="h-2.5 w-2.5" />
                          ) : (
                            <Globe className="h-2.5 w-2.5" />
                          )}
                          <span>{platformLabels[platform]}</span>
                        </span>
                      </div>
                    </div>

                    {/* 卡片主体区 */}
                    <div className="flex flex-1 flex-col justify-between gap-3.5 px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#f5f5f7] dark:bg-[#26262a] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] shrink-0">
                            <Icon aria-hidden="true" className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                              {item.name}
                            </h3>
                            {item.category && (
                              <span className="text-[11px] text-[#86868b] dark:text-[#8e8e93]">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mt-2.5 text-[12px] leading-[1.5] text-[#6e6e73] dark:text-[#98989d] line-clamp-2">
                          {item.description}
                        </p>

                        {item.tags.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-[5px] text-[10.5px] font-medium bg-black/[0.04] dark:bg-white/[0.06] text-[#6e6e73] dark:text-[#aeaeb2]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 底部操作区 */}
                      <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-2">
                        {selected && onCreateProject ? (
                          <button
                            type="button"
                            className={`${MACOS_CONTROLS.primaryButton} py-1.5 px-3.5`}
                            disabled={busy || selecting}
                            onClick={() => setCreation({ template: item, platform })}
                          >
                            {t('templatesPage.createApp')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            data-testid={'use-template-' + item.id}
                            className={MACOS_CONTROLS.secondaryButton}
                            disabled={busy || selecting}
                            onClick={() => void select(item)}
                          >
                            {t(
                              onCreateProject
                                ? 'templatesPage.selectTemplate'
                                : 'templatesPage.useTemplate'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
      {creation && onCreateProject && (
        <CreateProjectDialog
          template={creation.template}
          onClose={() => setCreation(null)}
          onConfirm={(name) => onCreateProject(name, creation.template.id, creation.platform)}
        />
      )}
    </div>
  );
}
