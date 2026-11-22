import React from 'react';
import { PluginItem } from '../types/plugin';
import { Check } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface PluginCardProps {
  plugin: PluginItem;
  onAdd?: (plugin: PluginItem) => void;
  onRemove?: (pluginId: string) => void;
}

/**
 * 渲染品牌专属图标或优雅首字母徽标
 */
const renderBrandIcon = (plugin: PluginItem) => {
  switch (plugin.id) {
    case 'stripe':
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          <div className="w-4 h-4 border-2 border-white rounded-xs transform -rotate-12" />
        </div>
      );
    case 'vercel':
      return (
        <div className="w-10 h-10 rounded-xl bg-black dark:bg-zinc-800 text-white flex items-center justify-center shadow-xs shrink-0">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L2 22h20L12 2z" />
          </svg>
        </div>
      );
    case 'huggingface':
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center text-xl shadow-xs shrink-0 select-none">
          🤗
        </div>
      );
    case 'heygen':
      return (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-xs shrink-0">
          <span className="text-xs font-black">HG</span>
        </div>
      );
    case 'higgsfield':
      return (
        <div className="w-10 h-10 rounded-xl bg-lime-400 text-zinc-900 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
          HF
        </div>
      );
    case 'roboflow':
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          <div className="w-4 h-4 border-2 border-dashed border-white rounded-full" />
        </div>
      );
    case 'braintrust':
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
          BT
        </div>
      );
    default:
      return (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0"
          style={{ backgroundColor: plugin.iconBg || '#6366f1' }}
        >
          {plugin.iconText || plugin.name.slice(0, 2).toUpperCase()}
        </div>
      );
  }
};

export const PluginCard: React.FC<PluginCardProps> = ({ plugin, onAdd, onRemove }) => {
  const { t } = useI18n();
  const isInstalled = Boolean(plugin.isInstalled);

  return (
    <div
      data-testid={`plugin-card-${plugin.id}`}
      className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800 flex flex-col justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs group"
    >
      <div className="flex items-start gap-3.5">
        {renderBrandIcon(plugin)}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
              {plugin.name}
            </h4>
            {plugin.badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800">
                {plugin.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {plugin.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
        <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1">
          {plugin.domain}
        </span>

        {isInstalled ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              <Check className="w-3 h-3" />
              {t('pluginsPage.btnAdded')}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(plugin.id)}
                className="text-[11px] text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
              >
                {t('pluginsPage.btnRemove')}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAdd?.(plugin)}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs active:scale-98"
          >
            {t('pluginsPage.btnAdd')}
          </button>
        )}
      </div>
    </div>
  );
};
