import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Search, Star, Sparkles } from 'lucide-react';
import { PluginItem, CatalogCategory } from '../types/plugin';
import { PluginCard } from './PluginCard';
import { AddPluginModal } from './AddPluginModal';

export interface ComponentCenterViewProps {
  onGoBack?: () => void;
  initialInstalledPlugins?: PluginItem[];
}

/**
 * 官方预置精选目录数据（严格还原设计图）
 */
const DEFAULT_CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'featured',
    title: 'Featured',
    icon: 'star',
    plugins: [
      {
        id: 'stripe',
        name: 'Stripe',
        badge: 'OAuth',
        description: 'Manage payments, customers, and products',
        domain: 'mcp.stripe.com',
        category: 'featured',
        toolsCount: 8,
      },
      {
        id: 'vercel',
        name: 'Vercel',
        badge: 'OAuth',
        description: 'Manage deployments and projects',
        domain: 'mcp.vercel.com',
        category: 'featured',
        toolsCount: 6,
      },
    ],
  },
  {
    id: 'ai_media',
    title: 'AI & Media',
    icon: 'sparkles',
    plugins: [
      {
        id: 'huggingface',
        name: 'Hugging Face',
        badge: 'OAuth',
        description: 'Search models, datasets, and papers',
        domain: 'huggingface.co',
        category: 'ai_media',
        toolsCount: 12,
      },
      {
        id: 'heygen',
        name: 'HeyGen',
        badge: 'OAuth',
        description: 'AI avatar videos',
        domain: 'mcp.heygen.com',
        category: 'ai_media',
        toolsCount: 4,
      },
      {
        id: 'higgsfield',
        name: 'Higgsfield',
        badge: 'OAuth',
        description: 'AI video generation',
        domain: 'mcp.higgsfield.ai',
        category: 'ai_media',
        toolsCount: 5,
      },
      {
        id: 'roboflow',
        name: 'Roboflow',
        badge: 'OAuth',
        description: 'Computer vision models',
        domain: 'mcp.roboflow.com',
        category: 'ai_media',
        toolsCount: 7,
      },
      {
        id: 'braintrust',
        name: 'Braintrust',
        badge: 'OAuth',
        description: 'LLM evals and observability',
        domain: 'api.braintrust.dev',
        category: 'ai_media',
        toolsCount: 9,
      },
    ],
  },
];

export const ComponentCenterView: React.FC<ComponentCenterViewProps> = ({
  onGoBack,
  initialInstalledPlugins = [],
}) => {
  const [installedPlugins, setInstalledPlugins] = useState<PluginItem[]>(initialInstalledPlugins);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 计算已启用插件数和工具数
  const totalPlugins = installedPlugins.length;
  const totalTools = useMemo(() => {
    return installedPlugins.reduce((acc, p) => acc + (p.toolsCount || 1), 0);
  }, [installedPlugins]);

  // 判断是否已安装特定插件
  const installedIds = useMemo(() => {
    return new Set(installedPlugins.map((p) => p.id));
  }, [installedPlugins]);

  // 从目录添加插件
  const handleAddPlugin = (plugin: PluginItem) => {
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
  const handleAddCustomPlugin = (customPlugin: Omit<PluginItem, 'id'>) => {
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
                <span>Go Back</span>
              </button>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Plugins
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Connect plugins (MCP servers) to give the AI new tools.
              </p>
            </div>

            <button
              type="button"
              data-testid="btn-open-add-plugin"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Plugin</span>
            </button>
          </div>

          {/* 插件统计与状态 */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              {totalPlugins} plugins · {totalTools} tools enabled
            </div>

            {totalPlugins === 0 ? (
              <div className="text-xs text-slate-400 dark:text-zinc-500 py-3">
                No plugins added yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {installedPlugins.map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    onRemove={handleRemovePlugin}
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
                Add from catalog
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Curated plugins that connect with minimal configuration.
              </p>
            </div>

            {/* 搜索框 */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* 分类列表与卡片 */}
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800">
                No plugins found matching &quot;{searchQuery}&quot;.
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
                    <span>{category.title}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.plugins.map((plugin) => (
                      <PluginCard
                        key={plugin.id}
                        plugin={plugin}
                        onAdd={handleAddPlugin}
                        onRemove={handleRemovePlugin}
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
        onSubmit={handleAddCustomPlugin}
      />
    </div>
  );
};
