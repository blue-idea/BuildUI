import React from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { locale, toggleLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={locale === 'en' ? 'Switch to Chinese' : 'Switch to English'}
      title={locale === 'en' ? 'Switch to Chinese' : 'Switch to English'}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none ${className}`}
    >
      <Languages className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
      <span>{locale === 'en' ? 'EN' : '中'}</span>
    </button>
  );
};
