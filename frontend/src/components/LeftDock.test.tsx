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
  it('renders navigation icons in the exact order: home, builder, projects, style, templates, components, settings and removes toggle and help buttons', () => {
    const onSelectTab = vi.fn();

    renderWithProviders(<LeftDock activeTab="home" onSelectTab={onSelectTab} />);

    // 验证折叠和帮助按钮已被移除
    expect(screen.queryByTestId('dock-toggle')).toBeNull();
    expect(screen.queryByTestId('dock-help')).toBeNull();

    // 获取所有导航按钮
    const homeBtn = screen.getByTestId('dock-home');
    const builderBtn = screen.getByTestId('dock-builder');
    const projectsBtn = screen.getByTestId('dock-projects');
    const styleBtn = screen.getByTestId('dock-style');
    const templatesBtn = screen.getByTestId('dock-templates');
    const componentsBtn = screen.getByTestId('dock-components');
    const settingsBtn = screen.getByTestId('dock-settings');

    expect(homeBtn).toBeDefined();
    expect(builderBtn).toBeDefined();
    expect(projectsBtn).toBeDefined();
    expect(styleBtn).toBeDefined();
    expect(templatesBtn).toBeDefined();
    expect(componentsBtn).toBeDefined();
    expect(settingsBtn).toBeDefined();

    // 验证在 DOM 中仅有 7 个导航按钮且构建区下方为工程管理区
    const allDockButtons = screen.getAllByRole('button');
    expect(allDockButtons).toHaveLength(7);
    const buttonTestIds = allDockButtons.map((btn) => btn.getAttribute('data-testid'));
    expect(buttonTestIds).toEqual([
      'dock-home',
      'dock-builder',
      'dock-projects',
      'dock-style',
      'dock-templates',
      'dock-components',
      'dock-settings',
    ]);
  });

  it('triggers onSelectTab and action callbacks when clicking dock items', () => {
    const onSelectTab = vi.fn();
    const onOpenProjects = vi.fn();
    const onOpenTemplates = vi.fn();
    const onOpenSettings = vi.fn();
    const onOpenComponents = vi.fn();
    const onOpenStyle = vi.fn();

    renderWithProviders(
      <LeftDock
        activeTab="home"
        onSelectTab={onSelectTab}
        onOpenProjects={onOpenProjects}
        onOpenTemplates={onOpenTemplates}
        onOpenSettings={onOpenSettings}
        onOpenComponents={onOpenComponents}
        onOpenStyle={onOpenStyle}
      />
    );

    // 点击构建区
    fireEvent.click(screen.getByTestId('dock-builder'));
    expect(onSelectTab).toHaveBeenCalledWith('builder');

    // 点击构建区下方的工程管理区
    fireEvent.click(screen.getByTestId('dock-projects'));
    expect(onSelectTab).toHaveBeenCalledWith('projects');
    expect(onOpenProjects).toHaveBeenCalled();

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
    renderWithProviders(<LeftDock activeTab="projects" />);

    const projectsBtn = screen.getByTestId('dock-projects');
    expect(projectsBtn.className).toContain('text-blue-600');
    expect(projectsBtn.className).toContain('bg-blue-100');
  });

  it('pins the settings button to the bottom of the left dock', () => {
    renderWithProviders(<LeftDock activeTab="home" />);

    const bottomGroup = screen.getByTestId('dock-bottom');
    const settingsBtn = screen.getByTestId('dock-settings');
    const homeBtn = screen.getByTestId('dock-home');

    expect(bottomGroup.className).toContain('mt-auto');
    expect(bottomGroup.contains(settingsBtn)).toBe(true);
    expect(bottomGroup.contains(homeBtn)).toBe(false);
  });
});
