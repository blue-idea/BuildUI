import React, { useState, useMemo } from 'react';
import {
  Globe,
  Monitor,
  Smartphone,
  Search,
  X,
  LayoutGrid,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { AppTemplate } from './TemplateModal';
import { useI18n } from '../i18n/I18nContext';

export type PlatformFilter = 'all' | 'web' | 'desktop' | 'app';

export interface TemplateCenterViewProps {
  templates: AppTemplate[];
  onSelectTemplate: (templateId: string) => void;
  initialPlatform?: PlatformFilter;
}

export const TemplateCenterView: React.FC<TemplateCenterViewProps> = ({
  templates,
  onSelectTemplate,
  initialPlatform = 'all',
}) => {
  const { t } = useI18n();
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(initialPlatform);
  const [searchQuery, setSearchQuery] = useState('');

  // 按照 web、desktop、app 分类与关键字实时过滤
  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      // 1. 平台过滤
      const itemPlatform = item.platform ?? 'web';
      if (platformFilter !== 'all' && itemPlatform !== platformFilter) {
        return false;
      }

      // 2. 搜索关键字过滤
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [templates, platformFilter, searchQuery]);

  // 各分类模版计数
  const counts = useMemo(() => {
    const all = templates.length;
    const web = templates.filter((t) => (t.platform ?? 'web') === 'web').length;
    const desktop = templates.filter((t) => t.platform === 'desktop').length;
    const app = templates.filter((t) => t.platform === 'app').length;
    return { all, web, desktop, app };
  }, [templates]);

  const platformBadge = (platform?: 'web' | 'desktop' | 'app') => {
    switch (platform) {
      case 'desktop':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
            <Monitor className="w-3 h-3" />
            <span>Desktop</span>
          </span>
        );
      case 'app':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <Smartphone className="w-3 h-3" />
            <span>App</span>
          </span>
        );
      case 'web':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
            <Globe className="w-3 h-3" />
            <span>Web</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 p-6 sm:p-8 transition-colors select-none">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* 顶部标题栏与搜索框 */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
                {t('templatesPage.title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {t('templatesPage.subtitle')}
              </p>
            </div>
          </div>

          {/* 实时搜索过滤框 */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="template-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('templatesPage.searchPlaceholder')}
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
        </header>

        {/* 3 大分类选项卡：全部、Web 应用、桌面端应用、移动端 App */}
        <div
          role="tablist"
          aria-label="Template platform categories"
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            role="tab"
            data-testid="platform-tab-all"
            aria-selected={platformFilter === 'all'}
            onClick={() => setPlatformFilter('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              platformFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('templatesPage.tabAll')}</span>
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
            data-testid="platform-tab-web"
            aria-selected={platformFilter === 'web'}
            onClick={() => setPlatformFilter('web')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              platformFilter === 'web'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('templatesPage.tabWeb')}</span>
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
            data-testid="platform-tab-desktop"
            aria-selected={platformFilter === 'desktop'}
            onClick={() => setPlatformFilter('desktop')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              platformFilter === 'desktop'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{t('templatesPage.tabDesktop')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                platformFilter === 'desktop'
                  ? 'bg-blue-700/80 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}
            >
              {counts.desktop}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            data-testid="platform-tab-app"
            aria-selected={platformFilter === 'app'}
            onClick={() => setPlatformFilter('app')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              platformFilter === 'app'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t('templatesPage.tabApp')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                platformFilter === 'app'
                  ? 'bg-blue-700/80 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}
            >
              {counts.app}
            </span>
          </button>
        </div>

        {/* 模版卡片网格列表 */}
        {filteredTemplates.length === 0 ? (
          <div
            data-testid="template-empty-state"
            className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800"
          >
            <span className="text-3xl">🔍</span>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t('templatesPage.noResults')}
            </p>
            <button
              type="button"
              data-testid="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setPlatformFilter('all');
              }}
              className="text-xs px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors font-medium"
            >
              {t('templatesPage.clearSearch')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTemplates.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition-all hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xl shadow-2xs">
                      {item.icon}
                    </div>
                    {platformBadge(item.platform)}
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* 标签列表 */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-800 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 底部使用模版按钮 */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-2">
                  <button
                    type="button"
                    data-testid={`use-template-${item.id}`}
                    onClick={() => onSelectTemplate(item.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs hover:shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>{t('templatesPage.useTemplate')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
