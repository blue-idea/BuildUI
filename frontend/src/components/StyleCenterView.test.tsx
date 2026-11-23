import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StyleCenterView } from './StyleCenterView';
import { ThemePreset } from './ThemeSelector';
import { I18nProvider } from '../i18n/I18nContext';

const renderWithI18n = (ui: React.ReactElement, initialLocale = 'en' as const) => {
  return render(<I18nProvider initialLocale={initialLocale}>{ui}</I18nProvider>);
};

describe('StyleCenterView Component (TDD)', () => {
  const initialPresets: ThemePreset[] = [
    {
      id: 'macos',
      name: 'macOS Tahoe Blue',
      primary: '#007aff',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
    },
    {
      id: 'dark-minimal',
      name: 'Dark Minimalist',
      primary: '#3b82f6',
      background: '#09090b',
      surface: '#18181b',
      text: '#fafafa',
    },
    {
      id: 'ios-fintech',
      name: 'iOS Fintech App',
      appType: 'app',
      primary: '#10b981',
      background: '#051b14',
      surface: '#0f2f24',
      text: '#ffffff',
    },
  ];

  it('renders application type badges on template cards with default fallback', () => {
    renderWithI18n(
      <StyleCenterView
        presets={initialPresets}
        activeThemeId="macos"
        onSelectTheme={vi.fn()}
      />
    );

    // macos 自动默认为 Desktop 或显式 Desktop
    expect(screen.getByTestId('template-app-type-badge-macos')).toBeDefined();
    // dark-minimal 默认回退为 Web
    expect(screen.getByTestId('template-app-type-badge-dark-minimal')).toBeDefined();
    // ios-fintech 显式为 app
    expect(screen.getByTestId('template-app-type-badge-ios-fintech')).toBeDefined();
  });

  it('filters template cards when clicking platform filter pills (All, Web, App, Desktop)', () => {
    renderWithI18n(
      <StyleCenterView
        presets={initialPresets}
        activeThemeId="macos"
        onSelectTheme={vi.fn()}
      />
    );

    // 默认展示全部
    expect(screen.getByText('macOS Tahoe Blue')).toBeDefined();
    expect(screen.getByText('Dark Minimalist')).toBeDefined();
    expect(screen.getByText('iOS Fintech App')).toBeDefined();

    // 点击筛选 Mobile App
    fireEvent.click(screen.getByTestId('style-filter-app'));
    expect(screen.getByText('iOS Fintech App')).toBeDefined();
    expect(screen.queryByText('macOS Tahoe Blue')).toBeNull();
    expect(screen.queryByText('Dark Minimalist')).toBeNull();

    // 点击筛选 Desktop
    fireEvent.click(screen.getByTestId('style-filter-desktop'));
    expect(screen.getByText('macOS Tahoe Blue')).toBeDefined();
    expect(screen.queryByText('iOS Fintech App')).toBeNull();

    // 点击切回 All
    fireEvent.click(screen.getByTestId('style-filter-all'));
    expect(screen.getByText('macOS Tahoe Blue')).toBeDefined();
    expect(screen.getByText('Dark Minimalist')).toBeDefined();
    expect(screen.getByText('iOS Fintech App')).toBeDefined();
  });

  it('renders tabs for Style Templates and Reference Extractor', () => {
    renderWithI18n(
      <StyleCenterView
        presets={initialPresets}
        activeThemeId="macos"
        onSelectTheme={vi.fn()}
      />
    );

    expect(screen.getByTestId('style-tab-templates')).toBeDefined();
    expect(screen.getByTestId('style-tab-extractor')).toBeDefined();
  });

  it('switches to Reference Extractor tab when clicked', () => {
    renderWithI18n(
      <StyleCenterView
        presets={initialPresets}
        activeThemeId="macos"
        onSelectTheme={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('style-tab-extractor'));

    expect(screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Extract Style & Prompt/i })).toBeDefined();
  });

  it('adds newly extracted style into templates list upon saving and switches tab', () => {
    const handleSelectTheme = vi.fn();
    renderWithI18n(
      <StyleCenterView
        presets={initialPresets}
        activeThemeId="macos"
        onSelectTheme={handleSelectTheme}
      />
    );

    // 切换到 Extractor Tab
    fireEvent.click(screen.getByTestId('style-tab-extractor'));

    // 输入 Linear 并提取
    const brandInput = screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i);
    fireEvent.change(brandInput, { target: { value: 'Linear' } });
    fireEvent.click(screen.getByRole('button', { name: /Extract Style & Prompt/i }));

    // 点击保存模版
    const saveBtn = screen.getByRole('button', { name: /Save as Style Template/i });
    fireEvent.click(saveBtn);

    // 切回 Templates Tab 应该能看到 Linear Inspired 模版
    fireEvent.click(screen.getByTestId('style-tab-templates'));
    expect(screen.getByText('Linear Inspired')).toBeDefined();
  });
});
