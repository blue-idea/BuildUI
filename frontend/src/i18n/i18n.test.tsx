import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { en } from './locales/en';
import { zh } from './locales/zh';
import { I18nProvider, useI18n } from './I18nContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

describe('TASK-026: i18n Localization Engine and Dictionaries', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have 100% key parity between en and zh dictionaries', () => {
    const getKeys = (obj: Record<string, any>, prefix = ''): string[] => {
      let keys: string[] = [];
      for (const k of Object.keys(obj)) {
        const val = obj[k];
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof val === 'object' && val !== null) {
          keys = keys.concat(getKeys(val, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    };

    const enKeys = getKeys(en).sort();
    const zhKeys = getKeys(zh).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  const TestConsumer = () => {
    const { locale, setLocale, t } = useI18n();
    return (
      <div>
        <span data-testid="current-locale">{locale}</span>
        <span data-testid="translated-home">{t('dock.home')}</span>
        <span data-testid="fallback">{t('non.existent.key', 'FallbackText')}</span>
        <button onClick={() => setLocale('zh')}>SetZH</button>
        <button onClick={() => setLocale('en')}>SetEN</button>
      </div>
    );
  };

  it('should initialize with en locale and switch to zh on demand', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId('current-locale').textContent).toBe('en');
    expect(screen.getByTestId('translated-home').textContent).toBe('Home');
    expect(screen.getByTestId('fallback').textContent).toBe('FallbackText');

    // Switch to zh
    fireEvent.click(screen.getByRole('button', { name: 'SetZH' }));

    expect(screen.getByTestId('current-locale').textContent).toBe('zh');
    expect(screen.getByTestId('translated-home').textContent).toBe('主页');
    expect(localStorage.getItem('blot_locale')).toBe('zh');

    // Switch back to en
    fireEvent.click(screen.getByRole('button', { name: 'SetEN' }));
    expect(screen.getByTestId('current-locale').textContent).toBe('en');
    expect(screen.getByTestId('translated-home').textContent).toBe('Home');
    expect(localStorage.getItem('blot_locale')).toBe('en');
  });

  it('should load persisted locale from localStorage', () => {
    localStorage.setItem('blot_locale', 'zh');

    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId('current-locale').textContent).toBe('zh');
    expect(screen.getByTestId('translated-home').textContent).toBe('主页');
  });

  it('LanguageSwitcher component switches locale when clicked', () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
        <TestConsumer />
      </I18nProvider>
    );

    const switchBtn = screen.getByRole('button', { name: /switch to chinese|switch to english|language/i });
    expect(switchBtn).toBeDefined();

    fireEvent.click(switchBtn);
    expect(screen.getByTestId('current-locale').textContent).toBe('zh');

    fireEvent.click(switchBtn);
    expect(screen.getByTestId('current-locale').textContent).toBe('en');
  });
});
