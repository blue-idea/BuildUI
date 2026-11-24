import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StyleCenterView } from './StyleCenterView';
import { ThemePreset } from './ThemeSelector';
import { getBenchmarkThemePresets } from '../utils/styleExtractor';
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

  it('correctly renders and filters benchmark presets for classic App and Desktop styles', () => {
    const benchmarkPresets = getBenchmarkThemePresets();
    renderWithI18n(
      <StyleCenterView
        presets={benchmarkPresets}
        activeThemeId="benchmark-linear"
        onSelectTheme={vi.fn()}
      />
    );

    // 默认展示全部风格（应包含 Web、App 和 Desktop 经典预设）
    expect(screen.getByText('Linear Inspired')).toBeDefined();
    expect(screen.getByText('iOS Modern Clean Inspired')).toBeDefined();
    expect(screen.getByText('Airbnb Mobile Inspired')).toBeDefined();
    expect(screen.getByText('Windows Fluent Inspired')).toBeDefined();

    // 筛选 App（应展示经典浅色 App 风格，无任何纯黑风格）
    fireEvent.click(screen.getByTestId('style-filter-app'));
    expect(screen.getByText('iOS Modern Clean Inspired')).toBeDefined();
    expect(screen.getByText('Airbnb Mobile Inspired')).toBeDefined();
    expect(screen.getByText('Headspace Mindful Inspired')).toBeDefined();
    expect(screen.getByText('Duolingo Mobile Inspired')).toBeDefined();
    expect(screen.queryByText('Linear Inspired')).toBeNull();
    expect(screen.queryByText('Windows Fluent Inspired')).toBeNull();
    expect(screen.queryByText('Apple Health Inspired')).toBeNull();
    expect(screen.queryByText('Threads Mobile Inspired')).toBeNull();

    // 筛选 Desktop
    fireEvent.click(screen.getByTestId('style-filter-desktop'));
    expect(screen.getByText('Windows Fluent Inspired')).toBeDefined();
    expect(screen.getByText('Slack Workstation Inspired')).toBeDefined();
    expect(screen.queryByText('iOS Modern Clean Inspired')).toBeNull();
    expect(screen.queryByText('Linear Inspired')).toBeNull();
  });

  describe('Universal Delete Button on Template Items (v25 TDD)', () => {
    it('renders delete buttons for every item in the templates list including built-in presets', () => {
      renderWithI18n(
        <StyleCenterView
          presets={initialPresets}
          activeThemeId="macos"
          onSelectTheme={vi.fn()}
        />
      );

      // 验证每一个预设项（无论内置还是自定义）均渲染专属删除按钮
      expect(screen.getByTestId('delete-template-btn-macos')).toBeDefined();
      expect(screen.getByTestId('delete-template-btn-dark-minimal')).toBeDefined();
      expect(screen.getByTestId('delete-template-btn-ios-fintech')).toBeDefined();
    });

    it('deletes item when delete button is clicked and stops event propagation without triggering onSelectTheme', () => {
      const handleSelectTheme = vi.fn();
      const handleDeletePreset = vi.fn();

      renderWithI18n(
        <StyleCenterView
          presets={initialPresets}
          activeThemeId="macos"
          onSelectTheme={handleSelectTheme}
          onDeleteCustomPreset={handleDeletePreset}
        />
      );

      expect(screen.getByText('Dark Minimalist')).toBeDefined();

      // 点击 dark-minimal 的删除按钮
      const deleteBtn = screen.getByTestId('delete-template-btn-dark-minimal');
      fireEvent.click(deleteBtn);

      // 验证删除回调被触发，卡片从列表中移除
      expect(handleDeletePreset).toHaveBeenCalledWith('dark-minimal');
      expect(screen.queryByText('Dark Minimalist')).toBeNull();

      // 验证没有触发卡片的主题选中逻辑 (stopPropagation 生效)
      expect(handleSelectTheme).not.toHaveBeenCalled();
    });

    it('automatically transitions active theme to next available template when deleting active item', () => {
      const handleSelectTheme = vi.fn();

      renderWithI18n(
        <StyleCenterView
          presets={initialPresets}
          activeThemeId="macos"
          onSelectTheme={handleSelectTheme}
        />
      );

      // 删除当前激活的 macos 模版
      const deleteActiveBtn = screen.getByTestId('delete-template-btn-macos');
      fireEvent.click(deleteActiveBtn);

      // 验证自动顺延选中下一个可用主题（dark-minimal）
      expect(handleSelectTheme).toHaveBeenCalledWith('dark-minimal');
      expect(screen.queryByText('macOS Tahoe Blue')).toBeNull();
    });

    it('renders empty state when all templates are deleted and allows restoring defaults', () => {
      const handleRestore = vi.fn();
      renderWithI18n(
        <StyleCenterView
          presets={[initialPresets[0]]}
          activeThemeId="macos"
          onSelectTheme={vi.fn()}
          onRestoreDefaultPresets={handleRestore}
        />
      );

      // 删除唯一的项
      const deleteBtn = screen.getByTestId('delete-template-btn-macos');
      fireEvent.click(deleteBtn);

      // 验证渲染空状态
      expect(screen.getByTestId('style-templates-empty-state')).toBeDefined();
      expect(screen.getByText(/No style templates available/i)).toBeDefined();

      // 点击恢复默认按钮
      const restoreBtn = screen.getByTestId('restore-default-presets-btn');
      fireEvent.click(restoreBtn);
      expect(handleRestore).toHaveBeenCalled();
    });
  });
});
