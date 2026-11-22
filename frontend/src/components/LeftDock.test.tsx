import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeftDock } from './LeftDock';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  );
};

describe('LeftDock Navigation Bar', () => {
  it('renders navigation icons in the exact order: home, builder, style, templates, components, settings', () => {
    const onSelectTab = vi.fn();

    renderWithProviders(<LeftDock activeTab="home" onSelectTab={onSelectTab} />);

    // 获取所有导航按钮
    const homeBtn = screen.getByTestId('dock-home');
    const builderBtn = screen.getByTestId('dock-builder');
    const styleBtn = screen.getByTestId('dock-style');
    const templatesBtn = screen.getByTestId('dock-templates');
    const componentsBtn = screen.getByTestId('dock-components');
    const settingsBtn = screen.getByTestId('dock-settings');

    expect(homeBtn).toBeDefined();
    expect(builderBtn).toBeDefined();
    expect(styleBtn).toBeDefined();
    expect(templatesBtn).toBeDefined();
    expect(componentsBtn).toBeDefined();
    expect(settingsBtn).toBeDefined();

    // 验证在 DOM 中的前后顺序
    const allDockButtons = screen.getAllByRole('button');
    // 第 1 个是折叠切换按钮 dock-toggle，接下来必须按顺序
    const buttonTestIds = allDockButtons.map((btn) => btn.getAttribute('data-testid'));
    
    expect(buttonTestIds).toContain('dock-home');
    expect(buttonTestIds).toContain('dock-builder');
    expect(buttonTestIds).toContain('dock-style');
    expect(buttonTestIds).toContain('dock-templates');
    expect(buttonTestIds).toContain('dock-components');
    expect(buttonTestIds).toContain('dock-settings');

    const homeIndex = buttonTestIds.indexOf('dock-home');
    const builderIndex = buttonTestIds.indexOf('dock-builder');
    const styleIndex = buttonTestIds.indexOf('dock-style');
    const templatesIndex = buttonTestIds.indexOf('dock-templates');
    const componentsIndex = buttonTestIds.indexOf('dock-components');
    const settingsIndex = buttonTestIds.indexOf('dock-settings');

    expect(builderIndex).toBe(homeIndex + 1);
    expect(styleIndex).toBe(builderIndex + 1);
    expect(templatesIndex).toBe(styleIndex + 1);
    expect(componentsIndex).toBe(templatesIndex + 1);
    expect(settingsIndex).toBe(componentsIndex + 1);
  });

  it('triggers onSelectTab and action callbacks when clicking dock items', () => {
    const onSelectTab = vi.fn();
    const onOpenTemplates = vi.fn();
    const onOpenSettings = vi.fn();
    const onOpenComponents = vi.fn();
    const onOpenStyle = vi.fn();

    renderWithProviders(
      <LeftDock
        activeTab="home"
        onSelectTab={onSelectTab}
        onOpenTemplates={onOpenTemplates}
        onOpenSettings={onOpenSettings}
        onOpenComponents={onOpenComponents}
        onOpenStyle={onOpenStyle}
      />
    );

    // 点击构建区
    fireEvent.click(screen.getByTestId('dock-builder'));
    expect(onSelectTab).toHaveBeenCalledWith('builder');

    // 点击风格页
    fireEvent.click(screen.getByTestId('dock-style'));
    expect(onSelectTab).toHaveBeenCalledWith('style');
    expect(onOpenStyle).toHaveBeenCalled();

    // 点击模版中心
    fireEvent.click(screen.getByTestId('dock-templates'));
    expect(onSelectTab).toHaveBeenCalledWith('templates');
    expect(onOpenTemplates).toHaveBeenCalled();

    // 点击组件库
    fireEvent.click(screen.getByTestId('dock-components'));
    expect(onSelectTab).toHaveBeenCalledWith('components');
    expect(onOpenComponents).toHaveBeenCalled();

    // 点击设置
    fireEvent.click(screen.getByTestId('dock-settings'));
    expect(onSelectTab).toHaveBeenCalledWith('settings');
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('applies blue active highlight styles matching the new theme color', () => {
    renderWithProviders(<LeftDock activeTab="builder" />);

    const builderBtn = screen.getByTestId('dock-builder');
    expect(builderBtn.className).toContain('text-blue-600');
    expect(builderBtn.className).toContain('bg-blue-100');
  });
});
