import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Star, Sparkles } from 'lucide-react';
import type { PluginItem, InstalledPlugin, PluginConfig } from '../types/plugin';
import { PluginCard } from './PluginCard';
import { AddPluginModal, type PluginDraft } from './AddPluginModal';
import { PluginDetails } from './PluginDetails';
import { useI18n } from '../i18n/I18nContext';
import { pluginBridge } from '../services/wailsBridge';
import { DEFAULT_CATALOG_CATEGORIES } from '../config/plugins';

export interface ComponentCenterViewProps {
  onGoBack?: () => void;
  initialInstalledPlugins?: PluginItem[];
  projects?: { id: number; name: string }[];
}

export const ComponentCenterView: React.FC<ComponentCenterViewProps> = ({
  onGoBack,
  initialInstalledPlugins = [],
  projects = [],
}) => {
  const { t } = useI18n();
  const [installedPlugins, setInstalledPlugins] = useState<PluginItem[]>(initialInstalledPlugins);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [records, setRecords] = useState<InstalledPlugin[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [initialConfig, setInitialConfig] = useState<PluginConfig>();
  const [toolCounts, setToolCounts] = useState<Record<number, number>>({});
  const [loadError, setLoadError] = useState('');
  const api = pluginBridge();

  useEffect(() => {
    let active = true;
    if (api) void api.ListPlugins().then((items) => { if (active) setRecords(items ?? []); }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : String(error));
    });
    return () => { active = false; };
  }, [api]);

  function upsert(record: InstalledPlugin) {
    setRecords((previous) => previous.some((item) => item.id === record.id)
      ? previous.map((item) => item.id === record.id ? record : item)
      : [...previous, record]);
  }

  const selected = records.find((record) => record.id === selectedId);
  const displayedPlugins: PluginItem[] = api ? records.map((record) => ({
    id: String(record.id), name: record.name, description: record.description, domain: record.endpoint,
    badge: record.transport === 'http' ? 'HTTP' : 'STDIO', category: 'custom', isInstalled: true,
    enabled: record.enabled, toolsCount: record.enabled ? toolCounts[record.id] ?? 0 : 0,
  })) : installedPlugins;

  // 计算已启用插件数和工具数
  const totalPlugins = displayedPlugins.length;
  const totalTools = displayedPlugins.reduce((acc, p) => acc + p.toolsCount, 0);

  // 判断是否已安装特定插件
  const installedIds = useMemo(() => {
    return new Set(api ? records.map((record) => record.catalogId) : installedPlugins.map((p) => p.id));
  }, [api, records, installedPlugins]);

  // 从目录添加插件
  const handleAddPlugin = (plugin: PluginItem) => {
    if (api) {
      setInitialConfig({ id: 0, name: plugin.name, endpoint: plugin.endpoint ?? '',
        description: plugin.description, transport: plugin.transport ?? 'http', args: plugin.args,
        enabled: true, catalogId: plugin.id });
      setIsAddModalOpen(true);
      return;
    }
    if (!installedIds.has(plugin.id)) {
      setInstalledPlugins((prev) => [
        ...prev,
        { ...plugin, isInstalled: true, enabled: true },
      ]);
    }
  };

  // 移除已安装插件
  const handleRemovePlugin = (pluginId: string) => {
    setInstalledPlugins((prev) => prev.filter((p) => p.id !== pluginId));
  };

  // 添加自定义插件
  const handleAddCustomPlugin = ({ transport, args, ...customPlugin }: PluginDraft) => {
    if (api) {
      return api.SavePlugin({ ...initialConfig, id: initialConfig?.id ?? 0, name: customPlugin.name,
        description: customPlugin.description, transport, endpoint: customPlugin.domain, args,
        enabled: initialConfig?.enabled ?? true }).then((record) => {
        upsert(record);
        setSelectedId(record.id);
        setToolCounts((current) => ({ ...current, [record.id]: 0 }));
      });
    }
    const newPlugin: PluginItem = {
      ...customPlugin,
      id: `custom-${Date.now()}`,
      isInstalled: true,
      enabled: true,
    };
    setInstalledPlugins((prev) => [...prev, newPlugin]);
  };

  // 目录根据搜索词过滤
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return DEFAULT_CATALOG_CATEGORIES.map((cat) => ({
        ...cat,
        plugins: cat.plugins.map((p) => ({
          ...p,
          isInstalled: installedIds.has(p.id),
        })),
      }));
    }

    return DEFAULT_CATALOG_CATEGORIES.map((cat) => {
      const matchedPlugins = cat.plugins.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q)
        );
      });
      return {
        ...cat,
        plugins: matchedPlugins.map((p) => ({
          ...p,
          isInstalled: installedIds.has(p.id),
        })),
      };
    }).filter((cat) => cat.plugins.length > 0);
  }, [searchQuery, installedIds]);

  return (
    <div
      data-testid="component-center-view"
      className="flex-1 h-full overflow-y-auto bg-slate-50/70 dark:bg-zinc-950 p-8 flex flex-col transition-colors selection:bg-blue-100 dark:selection:bg-blue-950"
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-8 pb-12">
        {/* 顶部导航与操作条 */}
        <div className="flex flex-col gap-6">
          {onGoBack && (
            <div>
              <button
                type="button"
                onClick={onGoBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('pluginsPage.goBack')}</span>
              </button>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                {t('pluginsPage.title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {t('pluginsPage.subtitle')}
              </p>
            </div>

            <button
              type="button"
              data-testid="btn-open-add-plugin"
              onClick={() => { setInitialConfig(undefined); setIsAddModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('pluginsPage.addPlugin')}</span>
            </button>
          </div>

          {/* 插件统计与状态 */}
          <div className="flex flex-col gap-2">
            {loadError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p>}
            <div className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              {t('pluginsPage.statusSummary', { plugins: totalPlugins, tools: totalTools })}
            </div>

            {totalPlugins === 0 ? (
              <div className="text-xs text-slate-400 dark:text-zinc-500 py-3">
                {t('pluginsPage.emptyInstalled')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {displayedPlugins.map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    onConfigure={api ? () => setSelectedId(Number(plugin.id)) : undefined}
                    onRemove={api ? undefined : handleRemovePlugin}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 目录浏览区域（Add from catalog） */}
        <section className="flex flex-col gap-6 pt-4 border-t border-slate-200/80 dark:border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {t('pluginsPage.catalogTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {t('pluginsPage.catalogSubtitle')}
              </p>
            </div>

            {/* 搜索框 */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('pluginsPage.searchPlaceholder')}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* 分类列表与卡片 */}
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800">
                {t('pluginsPage.noResults', { query: searchQuery })}
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    {category.id === 'featured' ? (
                      <Star className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>
                      {category.id === 'developer'
                        ? t('pluginsPage.catDeveloper')
                        : category.id === 'project-tooling'
                          ? t('pluginsPage.catProjectTooling')
                          : category.id === 'featured'
                            ? t('pluginsPage.catFeatured')
                            : category.id === 'ai_media'
                              ? t('pluginsPage.catAiMedia')
                              : category.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.plugins.map((plugin) => (
                      <PluginCard
                        key={plugin.id}
                        plugin={plugin}
                        onAdd={handleAddPlugin}
                        onRemove={api ? undefined : handleRemovePlugin}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 自定义添加插件弹窗 */}
      <AddPluginModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initial={initialConfig}
        onSubmit={handleAddCustomPlugin}
      />
      {selected && !isAddModalOpen && <PluginDetails key={selected.id} plugin={selected} projects={projects}
        onClose={() => setSelectedId(undefined)} onEdit={() => { setInitialConfig(selected); setIsAddModalOpen(true); }}
        onUpdate={upsert} onDelete={() => { setRecords((items) => items.filter((item) => item.id !== selected.id)); setSelectedId(undefined); }}
        onToolCount={(count) => setToolCounts((current) => ({ ...current, [selected.id]: count }))} />}
    </div>
  );
};
