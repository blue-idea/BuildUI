import { Plug } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { InstalledPlugin, PluginAutomation } from '../types/plugin';

interface HomePluginPickerProps {
  selection: PluginAutomation;
  plugins: InstalledPlugin[] | null;
  loadError: boolean;
  onChange: (selection: PluginAutomation) => void;
}

export function HomePluginPicker({ selection, plugins, loadError, onChange }: HomePluginPickerProps) {
  const { t } = useI18n();

  return (
    <section aria-label="Plugin automation" className="mt-2 space-y-2">
      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
        <Plug aria-hidden="true" className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
        <span>{t('pluginsPage.autoUsePlugins')}</span>
        <input
          type="checkbox"
          role="switch"
          checked={selection.enabled}
          onChange={(event) => onChange({ ...selection, enabled: event.target.checked })}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-4 w-7 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-blue-600 peer-checked:after:translate-x-3 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 dark:bg-zinc-700 dark:peer-focus-visible:ring-offset-zinc-900"
        />
      </label>
      {selection.enabled && (
        plugins?.length ? (
          <div role="group" aria-label="Enabled plugins" className="flex max-h-28 flex-wrap gap-2 overflow-y-auto p-0.5">
            {plugins.map(({ id, name }) => {
              const checked = selection.pluginIds.includes(id);
              return (
                <label
                  key={id}
                  className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:has-[:checked]:border-blue-500 dark:has-[:checked]:bg-blue-950/30"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange({
                      enabled: selection.enabled,
                      pluginIds: checked ? selection.pluginIds.filter((pluginId) => pluginId !== id) : [...selection.pluginIds, id],
                    })}
                    className="h-3.5 w-3.5 shrink-0 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  />
                  <span className="truncate">{name}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p role="status" className="text-xs text-slate-600 dark:text-zinc-400">
            {loadError ? t('pluginsPage.loadPluginsError') : plugins ? t('pluginsPage.noPluginsEnabledHint') : t('pluginsPage.loadingPlugins')}
          </p>
        )
      )}
    </section>
  );
}
