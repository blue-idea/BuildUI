import React, { useState } from 'react';
import { PluginItem } from '../types/plugin';
import { Check } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { PluginIcon } from './PluginIcon';
import { PluginEnabledSwitch } from './PluginEnabledSwitch';
import { openExternalUrl } from '../services/wailsBridge';

export interface PluginCardProps {
  plugin: PluginItem;
  onAdd?: (plugin: PluginItem) => void;
  onRemove?: (pluginId: string) => void;
  onConfigure?: () => void;
  onToggleEnabled?: (enabled: boolean) => void | Promise<void>;
  actionsDisabled?: boolean;
}

export const PluginCard: React.FC<PluginCardProps> = ({ plugin, onAdd, onRemove, onConfigure, onToggleEnabled, actionsDisabled }) => {
  const { t } = useI18n();
  const isInstalled = Boolean(plugin.isInstalled);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const disabled = isSaving || actionsDisabled;

  async function toggleEnabled(enabled: boolean) {
    if (!onToggleEnabled || disabled) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await onToggleEnabled(enabled);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      data-testid={`plugin-card-${plugin.id}`}
      className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800 flex flex-col justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs group"
    >
      <div className="flex items-start gap-3.5">
        <PluginIcon plugin={plugin} />

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

      {saveError && <p role="alert" className="break-words text-xs text-red-700 dark:text-red-300">{saveError}</p>}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
        <span className="min-w-0 truncate text-[11px] text-slate-400 dark:text-zinc-500">
          {plugin.domain}
        </span>

        {isInstalled ? (
          <div className="flex shrink-0 items-center gap-3">
            {onToggleEnabled ? (
              <PluginEnabledSwitch
                enabled={Boolean(plugin.enabled)}
                disabled={disabled}
                pluginName={plugin.name}
                onChange={(enabled) => { void toggleEnabled(enabled); }}
              />
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3 h-3" />
                {t('pluginsPage.btnAdded')}
              </span>
            )}
            {onConfigure && <button type="button" onClick={onConfigure} disabled={disabled} className="font-medium text-blue-700 hover:underline disabled:opacity-50 dark:text-blue-400">{t('pluginsPage.btnConfigure')}</button>}
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
        ) : plugin.migrationUrl ? (
          <a
            href={plugin.migrationUrl}
            onClick={(event) => {
              event.preventDefault();
              openExternalUrl(event.currentTarget.href);
            }}
            className="shrink-0 font-medium text-blue-700 hover:underline dark:text-blue-400"
          >
            Migration guide
          </a>
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
