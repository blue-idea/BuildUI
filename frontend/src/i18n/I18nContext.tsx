import React, { createContext, useContext, useState } from 'react';
import { Locale, I18nDictionary } from './types';
import { en } from './locales/en';
import { zh } from './locales/zh';

const LOCALE_STORAGE_KEY = 'blot_locale';

const dictionaries: Record<Locale, I18nDictionary> = {
  en,
  zh,
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string;
  dict: I18nDictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

const interpolate = (
  raw: string,
  params?: Record<string, string | number>
): string => {
  if (!params) return raw;
  let result = raw;
  for (const [key, val] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
  }
  return result;
};

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, initialLocale }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    if (typeof window !== 'undefined') {
      const persisted = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (persisted === 'en' || persisted === 'zh') {
        return persisted;
      }
      // 首次加载且无本地持久化记录时，根据系统语言环境自适应选择
      if (typeof navigator !== 'undefined' && navigator.language) {
        const sysLang = navigator.language.toLowerCase();
        if (sysLang.startsWith('zh')) {
          return 'zh';
        }
      }
    }
    return 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
  };

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'zh' : 'en');
  };

  const currentDict = dictionaries[locale] || dictionaries.en;

  const t = (
    path: string,
    paramsOrFallback?: Record<string, string | number> | string,
    fallback?: string
  ): string => {
    const params = typeof paramsOrFallback === 'object' && paramsOrFallback !== null ? paramsOrFallback : undefined;
    const fb = typeof paramsOrFallback === 'string' ? paramsOrFallback : fallback;

    const keys = path.split('.');
    let current: any = currentDict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English dictionary if not found in current dict
        let fallbackDict: any = dictionaries.en;
        for (const fbKey of keys) {
          if (fallbackDict && typeof fallbackDict === 'object' && fbKey in fallbackDict) {
            fallbackDict = fallbackDict[fbKey];
          } else {
            fallbackDict = undefined;
            break;
          }
        }
        const resolvedFallback = typeof fallbackDict === 'string' ? fallbackDict : (fb || path);
        return interpolate(resolvedFallback, params);
      }
    }
    const resolved = typeof current === 'string' ? current : (fb || path);
    return interpolate(resolved, params);
  };

  const value: I18nContextValue = {
    locale,
    setLocale,
    toggleLocale,
    t,
    dict: currentDict,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

const defaultContextValue: I18nContextValue = {
  locale: 'en',
  setLocale: () => {},
  toggleLocale: () => {},
  t: (
    path: string,
    paramsOrFallback?: Record<string, string | number> | string,
    fallback?: string
  ): string => {
    const params = typeof paramsOrFallback === 'object' && paramsOrFallback !== null ? paramsOrFallback : undefined;
    const fb = typeof paramsOrFallback === 'string' ? paramsOrFallback : fallback;

    const keys = path.split('.');
    let current: any = dictionaries.en;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return interpolate(fb || path, params);
      }
    }
    const resolved = typeof current === 'string' ? current : (fb || path);
    return interpolate(resolved, params);
  },
  dict: dictionaries.en,
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    return defaultContextValue;
  }
  return context;
};
