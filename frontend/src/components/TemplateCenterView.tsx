import React, { useEffect, useId, useRef, useState } from 'react';
import { Atom, Check, ExternalLink, Globe, Layers, LayoutGrid, Monitor, Search, Smartphone, Triangle, X } from 'lucide-react';
import clsx from 'clsx';
import type { AppTemplate } from './TemplateModal';
import { useI18n } from '../i18n/I18nContext';
import { openExternalUrl } from '../services/wailsBridge';

export type PlatformFilter = 'all' | 'web' | 'desktop' | 'app';

export interface TemplateCenterViewProps {
  templates: AppTemplate[];
  onSelectTemplate: (templateId: string, acceptCommunity?: boolean) => void | Promise<void>;
  onCreateProject?: (name: string, templateId: string) => Promise<void>;
  selectedTemplateId?: string;
  acceptedCommunityCode?: boolean;
  communityStatus?: 'loading' | 'unavailable';
  onRetryCommunity?: () => void;
  busy?: boolean;
  initialPlatform?: PlatformFilter;
}

const filters = [
  { id: 'all', label: 'templatesPage.tabAll', icon: LayoutGrid },
  { id: 'web', label: 'templatesPage.tabWeb', icon: Globe },
  { id: 'desktop', label: 'templatesPage.tabDesktop', icon: Monitor },
  { id: 'app', label: 'templatesPage.tabApp', icon: Smartphone },
] as const;

const sections = [
  { id: 'official', label: 'templatesPage.official' },
  { id: 'community', label: 'templatesPage.community' },
  { id: 'example', label: 'templatesPage.examples' },
] as const;

const platformLabels = { web: 'Web', desktop: 'Desktop', app: 'App' } as const;
const primaryButton = 'rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50';
const secondaryButton = 'rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800';

type Action = { kind: 'consent' | 'create'; template: AppTemplate };

function TemplateActionDialog({ action, onClose, onConfirm }: {
  action: Action;
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
  const isCreate = action.kind === 'create';
  const supportsModal = typeof HTMLDialogElement.prototype.showModal === 'function';

  useEffect(() => {
    const element = dialog.current;
    if (supportsModal && element && !element.open) element.showModal();
  }, [supportsModal]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || (isCreate && !name.trim())) return;
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
      className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/55 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <h2 id={titleId} className="text-lg font-semibold">
            {t(isCreate ? 'templatesPage.createApp' : 'templatesPage.consentTitle')}
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
            {isCreate ? action.template.name : t('templatesPage.consentDescription')}
          </p>
        </div>
        {isCreate && (
          <div>
            <label htmlFor={nameId} className="block text-sm font-medium">{t('templatesPage.projectName')}</label>
            <input
              id={nameId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
              disabled={pending}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
            />
          </div>
        )}
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryButton} onClick={onClose} disabled={pending}>{t('templatesPage.cancel')}</button>
          <button type="submit" className={primaryButton} disabled={pending || (isCreate && !name.trim())}>
            {t(pending ? 'templatesPage.working' : isCreate ? 'templatesPage.createProject' : 'templatesPage.acceptAndSelect')}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function TemplateIcon({ template }: { template: AppTemplate }) {
  if (template.source === 'official') {
    const Icon = template.icon === 'React' ? Atom : template.icon === 'Expo' ? Smartphone : Triangle;
    return <Icon aria-hidden="true" className="h-5 w-5" />;
  }
  return <span aria-hidden="true">{template.icon || <Layers className="h-5 w-5" />}</span>;
}

function TemplateThumbnail({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="grid h-36 place-items-center bg-slate-100 text-slate-400 dark:bg-zinc-800">
      <Layers aria-hidden="true" className="h-7 w-7" />
    </div>
  ) : (
    <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-36 w-full bg-slate-100 object-cover dark:bg-zinc-800" />
  );
}

export function TemplateCenterView({
  templates,
  onSelectTemplate,
  onCreateProject,
  selectedTemplateId,
  acceptedCommunityCode = false,
  communityStatus,
  onRetryCommunity,
  busy = false,
  initialPlatform = 'all',
}: TemplateCenterViewProps) {
  const { t } = useI18n();
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(initialPlatform);
  const [searchQuery, setSearchQuery] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const [action, setAction] = useState<Action | null>(null);
  const query = searchQuery.trim().toLowerCase();
  const filtered = templates.filter((template) => (
    (platformFilter === 'all' || platformFilter === (template.platform ?? 'web')) &&
    [template.name, template.description, template.category, template.id, ...template.tags]
      .some((value) => value.toLowerCase().includes(query))
  ));

  const select = async (template: AppTemplate) => {
    setSelectionError('');
    if (template.source === 'community' && !acceptedCommunityCode) {
      setAction({ kind: 'consent', template });
      return;
    }
    setSelecting(true);
    try {
      await onSelectTemplate(template.id);
    } catch (cause) {
      setSelectionError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSelecting(false);
    }
  };

  const confirm = async (name: string) => {
    if (action?.kind === 'consent') {
      await onSelectTemplate(action.template.id, true);
    } else if (action) {
      await onCreateProject?.(name, action.template.id);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 px-6 py-8 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('templatesPage.title')}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{t('templatesPage.subtitle')}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              aria-label={t('templatesPage.searchPlaceholder')}
              data-testid="template-search-input"
              placeholder={t('templatesPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button type="button" aria-label={t('templatesPage.clearSearch')} onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        <div className="flex flex-wrap gap-2" aria-label="Template platform categories">
          {filters.map(({ id, label, icon: Icon }) => {
            const selected = platformFilter === id;
            const count = id === 'all' ? templates.length : templates.filter((item) => (item.platform ?? 'web') === id).length;
            if (id !== 'all' && id !== platformFilter && count === 0) return null;
            return (
              <button
                key={id}
                type="button"
                data-testid={'platform-tab-' + id}
                aria-pressed={selected}
                onClick={() => setPlatformFilter(id)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
                  selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
                )}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                {t(label)}
                <span className="opacity-80">{count}</span>
              </button>
            );
          })}
        </div>

        {selectionError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{selectionError}</p>}
        {filtered.length === 0 && (
          <div data-testid="template-empty-state" className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-3 text-sm text-slate-600 dark:text-zinc-400">{t('templatesPage.noResults')}</p>
            <button type="button" data-testid="clear-search-btn" className={secondaryButton} onClick={() => { setSearchQuery(''); setPlatformFilter('all'); }}>
              {t('templatesPage.clearSearch')}
            </button>
          </div>
        )}

        {sections.map(({ id, label }) => {
          const items = filtered.filter((template) => (template.source ?? 'example') === id);
          const showStatus = id === 'community' && communityStatus && !query && platformFilter === 'all';
          if (!items.length && !showStatus) return null;
          return (
            <section key={id} aria-label={t(label)}>
              <h2 className="mb-3 text-base font-semibold">{t(label)}</h2>
              {showStatus && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-zinc-800 dark:text-zinc-400" role="status">
                  {t(communityStatus === 'loading' ? 'templatesPage.communityLoading' : 'templatesPage.communityUnavailable')}
                  {communityStatus === 'unavailable' && onRetryCommunity && (
                    <button type="button" className={secondaryButton} onClick={onRetryCommunity}>{t('templatesPage.retry')}</button>
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const selected = item.id === selectedTemplateId;
                  const repositoryURL = item.githubUrl;
                  return (
                    <article
                      key={item.id}
                      data-testid={'template-card-' + item.id}
                      className={clsx(
                        'flex flex-col overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900',
                        selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-zinc-800',
                      )}
                    >
                      {item.imageUrl?.startsWith('https://') && (
                        <TemplateThumbnail key={item.imageUrl} url={item.imageUrl} />
                      )}
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-xl text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">
                            <TemplateIcon template={item} />
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-zinc-400">{platformLabels[item.platform ?? 'web']}</span>
                            {selected && <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"><Check className="h-3.5 w-3.5" />{t('templatesPage.selectedBadge')}</span>}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">{item.description}</p>
                        </div>
                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                          {selected && onCreateProject ? (
                            <button type="button" className={primaryButton} disabled={busy || selecting} onClick={() => setAction({ kind: 'create', template: item })}>
                              {t('templatesPage.createApp')}
                            </button>
                          ) : (
                            <button type="button" data-testid={'use-template-' + item.id} className={secondaryButton} disabled={busy || selecting} onClick={() => void select(item)}>
                              {t(onCreateProject ? 'templatesPage.selectTemplate' : 'templatesPage.useTemplate')}
                            </button>
                          )}
                          {repositoryURL && (
                            <a href={repositoryURL} onClick={(event) => { event.preventDefault(); openExternalUrl(repositoryURL); }} className="inline-flex items-center gap-1 px-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                              {t('templatesPage.repository')}<ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {action && <TemplateActionDialog action={action} onClose={() => setAction(null)} onConfirm={confirm} />}
    </div>
  );
}
