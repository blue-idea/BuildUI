import { useI18n } from '../i18n/I18nContext';

interface PluginEnabledSwitchProps {
  enabled: boolean;
  disabled?: boolean;
  pluginName?: string;
  onChange: (enabled: boolean) => void;
}

export function PluginEnabledSwitch({ enabled, disabled, pluginName, onChange }: PluginEnabledSwitchProps) {
  const { t } = useI18n();
  const label = t('pluginsPage.detailsSwitchAria');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={pluginName ? `${label} ${pluginName}` : label}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className="group/switch inline-flex min-h-7 shrink-0 items-center gap-2 rounded-md text-xs font-medium text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:text-zinc-300"
    >
      <span aria-hidden="true" className="relative h-5 w-9 rounded-full bg-slate-400 transition-colors group-aria-checked/switch:bg-blue-600 motion-reduce:transition-none dark:bg-zinc-600">
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform group-aria-checked/switch:translate-x-4 motion-reduce:transition-none" />
      </span>
      <span>{t(enabled ? 'pluginsPage.detailsEnabled' : 'pluginsPage.detailsDisabled')}</span>
    </button>
  );
}
