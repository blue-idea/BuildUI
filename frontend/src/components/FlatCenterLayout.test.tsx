import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StyleCenterView } from './StyleCenterView';
import { ProjectsCenterView } from './ProjectsCenterView';
import { TemplateCenterView } from './TemplateCenterView';
import { ThemePreset } from './ThemeSelector';
import { AppItem } from './AppDrawer';
import { LOCAL_PROJECT_TEMPLATES } from '../config/projectTemplates';
import { I18nProvider } from '../i18n/I18nContext';

const renderWithI18n = (ui: React.ReactElement, initialLocale = 'en' as const) => {
  return render(<I18nProvider initialLocale={initialLocale}>{ui}</I18nProvider>);
};

describe('StyleCenterView macOS Flat UI & Fluid Viewport Scaling (v32 TDD)', () => {
  const samplePresets: ThemePreset[] = [
    {
      id: 'macos',
      name: 'macOS Tahoe Blue',
      appType: 'desktop',
      description: 'Native Cupertino flat workstation aesthetic.',
      primary: '#0071e3',
      background: '#f5f5f7',
      surface: '#ffffff',
      text: '#1d1d1f',
      border: '#e5e5ea',
    },
    {
      id: 'linear-web',
      name: 'Linear Precision',
      appType: 'web',
      description: 'Crisp dark developer workspace.',
      primary: '#5e6ad2',
      background: '#08090a',
      surface: '#121316',
      text: '#f7f8f8',
      border: '#222326',
    },
    {
      id: 'ios-clean',
      name: 'iOS Clean Light',
      appType: 'app',
      description: 'Clean light mobile human interface.',
      primary: '#007aff',
      background: '#f2f2f7',
      surface: '#ffffff',
      text: '#1c1c1e',
      border: '#e5e5ea',
    },
  ];

  it('uses fluid full-width container and auto-fill responsive grid instead of cramped max-w-5xl layout', () => {
    renderWithI18n(
      <StyleCenterView
        presets={samplePresets}
        activeThemeId="macos"
        onSelectTheme={vi.fn()}
      />
    );

    const root = screen.getByTestId('style-center-view');
    const container = screen.getByTestId('style-center-container');
    const grid = screen.getByTestId('style-templates-grid');

    // 页面根容器采用 macOS 浅/深画布色，不再硬编码旧的窄居中 max-w-5xl
    expect(root.className).toContain('bg-[#f5f5f7]');
    expect(root.className).toContain('dark:bg-[#121214]');
    expect(container.className).not.toContain('max-w-5xl');
    expect(container.className).toContain('w-full');

    // 卡片网格使用自适应 auto-fill 列宽，随窗口尺寸平滑缩放
    expect(grid.className).toContain('auto-fill');
    expect(grid.className).toContain('minmax(');
  });

  it('renders macOS flat cards without heavy drop shadows or purple accent tokens', () => {
    const { container } = renderWithI18n(
      <StyleCenterView
        presets={samplePresets}
        activeThemeId="macos"
        onSelectTheme={vi.fn()}
      />
    );

    const activeCard = screen.getByTestId('style-template-card-macos');
    const inactiveCard = screen.getByTestId('style-template-card-linear-web');

    // 扁平化卡片禁止使用厚重浮空阴影与臃肿大圆角
    expect(activeCard.className).not.toMatch(/shadow-(md|lg|xl|2xl)/);
    expect(inactiveCard.className).not.toMatch(/shadow-(md|lg|xl|2xl)/);
    expect(activeCard.className).not.toContain('rounded-3xl');

    // 激活态使用 Apple System Blue 扁平描边
    expect(activeCard.className).toContain('#0071e3');

    // 全页统一 Apple System Blue 与中性灰体系，杜绝紫色系高亮类名残留
    expect(container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);
  });

  it('renders miniature visual interface previews inside every style card matching its palette', () => {
    renderWithI18n(
      <StyleCenterView
        presets={samplePresets}
        activeThemeId="macos"
        onSelectTheme={vi.fn()}
      />
    );

    const macPreview = screen.getByTestId('style-card-preview-macos');
    const webPreview = screen.getByTestId('style-card-preview-linear-web');
    const appPreview = screen.getByTestId('style-card-preview-ios-clean');

    expect(macPreview).toBeDefined();
    expect(webPreview).toBeDefined();
    expect(appPreview).toBeDefined();

    // 预览画布直接映射 preset 的背景色令牌
    expect(macPreview.style.backgroundColor).toBe('rgb(245, 245, 247)');
    expect(webPreview.style.backgroundColor).toBe('rgb(8, 9, 10)');
    expect(appPreview.style.backgroundColor).toBe('rgb(242, 242, 247)');
  });

  it('applies macOS flat styling without purple tokens in StyleExtractor tab as well', () => {
    const { container } = renderWithI18n(
      <StyleCenterView
        presets={samplePresets}
        activeThemeId="macos"
        onSelectTheme={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('style-tab-extractor'));
    const extractor = screen.getByTestId('style-extractor-component');

    expect(extractor).toBeDefined();
    expect(container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);
    expect(extractor.innerHTML).not.toContain('rounded-3xl');
  });
});

describe('ProjectsCenterView macOS Flat UI, Screenshot Preview & Export Button (v32 TDD)', () => {
  const sampleApps: AppItem[] = [
    {
      id: 1,
      name: 'Pantry Planner',
      path: '/workspace/pantry-planner',
      platform: 'web',
      createdAt: '2026-11-20T10:00:00Z',
    },
    {
      id: 2,
      name: 'Studio Desktop',
      path: '/workspace/studio-desktop',
      platform: 'desktop',
      thumbnailUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    {
      id: 3,
      name: 'Fitness Mobile App',
      path: '/workspace/fitness-app',
      platform: 'app',
    },
  ];

  it('uses fluid full-width container, auto-fill grid, and flat macOS cards without purple tokens or heavy shadows', () => {
    const { container } = renderWithI18n(
      <ProjectsCenterView
        apps={sampleApps}
        activeAppId={1}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
        onExportProject={vi.fn()}
      />
    );

    const root = screen.getByTestId('projects-center-view');
    const inner = screen.getByTestId('projects-center-container');
    const grid = screen.getByTestId('projects-grid');
    const activeCard = screen.getByTestId('project-card-1');

    expect(root.className).toContain('bg-[#f5f5f7]');
    expect(root.className).toContain('dark:bg-[#121214]');
    expect(inner.className).not.toContain('max-w-6xl');
    expect(grid.className).toContain('auto-fill');
    expect(grid.className).toContain('minmax(');
    expect(activeCard.className).not.toMatch(/shadow-(md|lg|xl|2xl)/);
    expect(activeCard.className).toContain('#0071e3');
    expect(container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);
  });

  it('renders screenshot preview area on every project card (real thumbnail image or flat miniature preview)', () => {
    renderWithI18n(
      <ProjectsCenterView
        apps={sampleApps}
        activeAppId={1}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    const webPreview = screen.getByTestId('project-card-preview-1');
    const customImgPreview = screen.getByTestId('project-card-preview-2');
    const appPreview = screen.getByTestId('project-card-preview-3');

    expect(webPreview).toBeDefined();
    expect(customImgPreview).toBeDefined();
    expect(appPreview).toBeDefined();

    // 当存在 thumbnailUrl 时应渲染真实截图 <img>
    const img = customImgPreview.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toContain('data:image/png;base64');
  });

  it('renders export button on every project card and triggers onExportProject with target app', () => {
    const onExportProject = vi.fn();
    renderWithI18n(
      <ProjectsCenterView
        apps={sampleApps}
        activeAppId={1}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
        onExportProject={onExportProject}
      />
    );

    const exportBtn = screen.getByTestId('export-project-btn-2');
    expect(exportBtn).toBeDefined();
    fireEvent.click(exportBtn);

    expect(onExportProject).toHaveBeenCalledTimes(1);
    expect(onExportProject).toHaveBeenCalledWith(sampleApps[1]);
  });
});

describe('TemplateCenterView macOS Flat UI & Fluid Viewport Scaling (v32 TDD)', () => {
  it('uses fluid full-width container, auto-fill grid, miniature previews, and macOS flat cards', () => {
    const { container } = renderWithI18n(
      <TemplateCenterView
        templates={LOCAL_PROJECT_TEMPLATES}
        selectedTemplateId="react"
        onSelectTemplate={vi.fn()}
        onCreateProject={vi.fn()}
      />
    );

    const root = screen.getByTestId('template-center-view');
    const inner = screen.getByTestId('template-center-container');
    const grid = screen.getByTestId('templates-grid');
    const reactCard = screen.getByTestId('template-card-react');
    const reactPreview = screen.getByTestId('template-card-preview-react');

    expect(root.className).toContain('bg-[#f5f5f7]');
    expect(root.className).toContain('dark:bg-[#121214]');
    expect(inner.className).not.toContain('max-w-6xl');
    expect(grid.className).toContain('auto-fill');
    expect(grid.className).toContain('minmax(');
    expect(reactCard.className).not.toMatch(/shadow-(md|lg|xl|2xl)/);
    expect(reactCard.className).toContain('#0071e3');
    expect(reactPreview).toBeDefined();
    expect(container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);
  });
});

describe('Builder Empty Project & Start Preview Cards (v32 TDD)', () => {
  it('renders a centered macOS flat empty-project card with primary and Home actions when no active project is selected', async () => {
    const { default: App } = await import('../App');
    render(<App initialDockTab="builder" />);

    // 关闭当前默认项目，进入构建区无激活项目状态
    fireEvent.click(screen.getByTestId('close-project-tab'));

    const card = screen.getByTestId('builder-no-project-card');
    const primaryBtn = screen.getByTestId('builder-create-or-open-btn');
    const homeBtn = screen.getByTestId('builder-go-home-btn');

    expect(card).toBeDefined();
    expect(card.className).not.toMatch(/shadow-(md|lg|xl|2xl)/);
    expect(card.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);
    expect(primaryBtn.className).toContain('#0071e3');
    expect(homeBtn).toBeDefined();

    // 点击“前往首页新建”应切换至首页视图
    fireEvent.click(homeBtn);
    expect(screen.getByTestId('guide-user-input')).toBeDefined();
  });
});
