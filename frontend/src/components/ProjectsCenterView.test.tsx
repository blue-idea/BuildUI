import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectsCenterView } from './ProjectsCenterView';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';
import { AppItem } from './AppDrawer';

const mockApps: AppItem[] = [
  {
    id: 1,
    name: 'Pantry Planner',
    path: '/workspace/pantry-planner',
    createdAt: '2026-11-20T10:00:00Z',
  },
  {
    id: 2,
    name: 'SaaS Dashboard',
    path: '/workspace/saas-dashboard',
    createdAt: '2026-11-21T12:00:00Z',
  },
];

const renderWithProviders = (ui: React.ReactElement, initialLocale: 'en' | 'zh' = 'en') => {
  localStorage.setItem('blot_locale', initialLocale);
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  );
};

describe('ProjectsCenterView Component', () => {
  it('renders project management view with title, search input, stats, and project list', () => {
    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    // 验证标题与描述
    expect(screen.getByTestId('projects-center-view')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();

    // 验证搜索框
    expect(screen.getByTestId('project-search-input')).toBeDefined();

    // 验证项目卡片
    expect(screen.getByText('Pantry Planner')).toBeDefined();
    expect(screen.getByText('SaaS Dashboard')).toBeDefined();
    expect(screen.getByText('/workspace/pantry-planner')).toBeDefined();
  });

  it('marks active project with Active badge', () => {
    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    // 验证 activeAppId 为 1 时展示当前激活标记
    const activeBadge = screen.getByTestId('active-badge-1');
    expect(activeBadge).toBeDefined();
    expect(screen.queryByTestId('active-badge-2')).toBeNull();
  });

  it('filters project list by search keyword matching name or path', () => {
    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    const searchInput = screen.getByTestId('project-search-input');
    fireEvent.change(searchInput, { target: { value: 'SaaS' } });

    expect(screen.queryByText('Pantry Planner')).toBeNull();
    expect(screen.getByText('SaaS Dashboard')).toBeDefined();

    // 清空搜索
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Pantry Planner')).toBeDefined();
    expect(screen.getByText('SaaS Dashboard')).toBeDefined();
  });

  it('triggers onSelectApp and onOpenProject when clicking open project button', () => {
    const onSelectApp = vi.fn();
    const onOpenProject = vi.fn();

    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={onSelectApp}
        onOpenProject={onOpenProject}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    const openBtn = screen.getByTestId('open-project-btn-2');
    fireEvent.click(openBtn);

    expect(onSelectApp).toHaveBeenCalledWith(2);
    expect(onOpenProject).toHaveBeenCalledWith(2);
  });

  it('triggers onDeleteApp when clicking delete button', () => {
    const onDeleteApp = vi.fn();

    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onNewProject={vi.fn()}
        onDeleteApp={onDeleteApp}
      />
    );

    const deleteBtn = screen.getByTestId('delete-project-btn-2');
    fireEvent.click(deleteBtn);

    expect(onDeleteApp).toHaveBeenCalledWith(2);
  });

  it('triggers onOpenInFileManager when clicking reveal in folder button', () => {
    const onOpenInFileManager = vi.fn();

    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
        onOpenInFileManager={onOpenInFileManager}
      />
    );

    const revealBtn = screen.getByTestId('reveal-folder-btn-1');
    fireEvent.click(revealBtn);

    expect(onOpenInFileManager).toHaveBeenCalledWith('/workspace/pantry-planner');
  });

  it('renders empty state when there are no applications', () => {
    renderWithProviders(
      <ProjectsCenterView
        apps={[]}
        activeAppId={0}
        onSelectApp={vi.fn()}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    expect(screen.getByTestId('empty-projects-state')).toBeDefined();
  });

  it('supports in-place renaming of a project', () => {
    const onRenameApp = vi.fn();

    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
        onRenameApp={onRenameApp}
      />
    );

    // 点击重命名按钮进入编辑状态
    const renameBtn = screen.getByTestId('rename-project-btn-1');
    fireEvent.click(renameBtn);

    const renameInput = screen.getByTestId('rename-input-1') as HTMLInputElement;
    expect(renameInput.value).toBe('Pantry Planner');

    fireEvent.change(renameInput, { target: { value: 'Super Pantry' } });
    const saveBtn = screen.getByTestId('save-rename-btn-1');
    fireEvent.click(saveBtn);

    expect(onRenameApp).toHaveBeenCalledWith(1, 'Super Pantry');
  });

  it('renders localized content in Chinese when locale is zh', () => {
    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onNewProject={vi.fn()}
        onDeleteApp={vi.fn()}
      />,
      'zh'
    );

    expect(screen.getByText('工程管理')).toBeDefined();
    expect(screen.getByText('当前激活')).toBeDefined();
    expect(screen.getByTestId('new-project-btn').textContent).toContain('新建工程');
  });

  describe('Multi-Platform Filtering (Web / Desktop / App) - v27 TDD', () => {
    const multiPlatformApps: AppItem[] = [
      {
        id: 1,
        name: 'Web SaaS Dashboard',
        path: '/workspace/web-saas',
        platform: 'web',
      },
      {
        id: 2,
        name: 'Desktop Audio Workstation',
        path: '/workspace/desktop-audio',
        platform: 'desktop',
      },
      {
        id: 3,
        name: 'Mobile Crypto App',
        path: '/workspace/mobile-crypto',
        platform: 'app',
      },
    ];

    it('renders platform category filter pills (All, Web, Desktop, App) with counts', () => {
      renderWithProviders(
        <ProjectsCenterView
          apps={multiPlatformApps}
          activeAppId={1}
          onSelectApp={vi.fn()}
          onNewProject={vi.fn()}
          onDeleteApp={vi.fn()}
        />
      );

      expect(screen.getByTestId('project-filter-all')).toBeDefined();
      expect(screen.getByTestId('project-filter-web')).toBeDefined();
      expect(screen.getByTestId('project-filter-desktop')).toBeDefined();
      expect(screen.getByTestId('project-filter-app')).toBeDefined();
    });

    it('filters project cards when clicking Web, Desktop, App tabs', () => {
      renderWithProviders(
        <ProjectsCenterView
          apps={multiPlatformApps}
          activeAppId={1}
          onSelectApp={vi.fn()}
          onNewProject={vi.fn()}
          onDeleteApp={vi.fn()}
        />
      );

      // 默认 All 显示全部 3 个
      expect(screen.getByText('Web SaaS Dashboard')).toBeDefined();
      expect(screen.getByText('Desktop Audio Workstation')).toBeDefined();
      expect(screen.getByText('Mobile Crypto App')).toBeDefined();

      // 点击 Desktop 过滤
      fireEvent.click(screen.getByTestId('project-filter-desktop'));
      expect(screen.getByText('Desktop Audio Workstation')).toBeDefined();
      expect(screen.queryByText('Web SaaS Dashboard')).toBeNull();
      expect(screen.queryByText('Mobile Crypto App')).toBeNull();

      // 点击 App 过滤
      fireEvent.click(screen.getByTestId('project-filter-app'));
      expect(screen.getByText('Mobile Crypto App')).toBeDefined();
      expect(screen.queryByText('Desktop Audio Workstation')).toBeNull();
      expect(screen.queryByText('Web SaaS Dashboard')).toBeNull();

      // 点击 Web 过滤
      fireEvent.click(screen.getByTestId('project-filter-web'));
      expect(screen.getByText('Web SaaS Dashboard')).toBeDefined();
      expect(screen.queryByText('Mobile Crypto App')).toBeNull();

      // 切回 All
      fireEvent.click(screen.getByTestId('project-filter-all'));
      expect(screen.getByText('Web SaaS Dashboard')).toBeDefined();
      expect(screen.getByText('Desktop Audio Workstation')).toBeDefined();
      expect(screen.getByText('Mobile Crypto App')).toBeDefined();
    });

    it('renders platform badges on project cards', () => {
      renderWithProviders(
        <ProjectsCenterView
          apps={multiPlatformApps}
          activeAppId={1}
          onSelectApp={vi.fn()}
          onNewProject={vi.fn()}
          onDeleteApp={vi.fn()}
        />
      );

      expect(screen.getByTestId('project-platform-badge-1')).toBeDefined();
      expect(screen.getByTestId('project-platform-badge-2')).toBeDefined();
      expect(screen.getByTestId('project-platform-badge-3')).toBeDefined();
    });
  });

  // v33.REQ-003-AC-002：工程管理页卡片截图替换按钮与加载态
  describe('Project Screenshot Capture Action (v33 TDD)', () => {
    it('每张工程卡片渲染截图按钮，点击后调用 onCaptureScreenshot 并传入目标项目', () => {
      const onCaptureScreenshot = vi.fn();
      renderWithProviders(
        <ProjectsCenterView
          apps={mockApps}
          activeAppId={1}
          onNewProject={vi.fn()}
          onDeleteApp={vi.fn()}
          onCaptureScreenshot={onCaptureScreenshot}
        />
      );

      const captureBtn = screen.getByTestId('capture-project-screenshot-btn-2') as HTMLButtonElement;
      expect(captureBtn.disabled).toBe(false);
      fireEvent.click(captureBtn);

      expect(onCaptureScreenshot).toHaveBeenCalledTimes(1);
      expect(onCaptureScreenshot).toHaveBeenCalledWith(mockApps[1]);
    });

    it('当项目处于截图加载态时禁用按钮并展示加载文案，更新 thumbnailUrl 后替换卡片图片', () => {
      const { rerender } = renderWithProviders(
        <ProjectsCenterView
          apps={mockApps}
          activeAppId={1}
          onNewProject={vi.fn()}
          onDeleteApp={vi.fn()}
          onCaptureScreenshot={vi.fn()}
          capturingAppId={1}
        />
      );

      const btn1 = screen.getByTestId('capture-project-screenshot-btn-1') as HTMLButtonElement;
      expect(btn1.disabled).toBe(true);
      expect(btn1.textContent).toMatch(/Capturing/i);

      const updatedApps: AppItem[] = [
        { ...mockApps[0], thumbnailUrl: 'data:image/png;base64,NEW_SHOT_DATA' },
        mockApps[1],
      ];
      rerender(
        <ThemeProvider>
          <I18nProvider>
            <ProjectsCenterView
              apps={updatedApps}
              activeAppId={1}
              onNewProject={vi.fn()}
              onDeleteApp={vi.fn()}
              onCaptureScreenshot={vi.fn()}
              capturingAppId={null}
            />
          </I18nProvider>
        </ThemeProvider>
      );

      const preview = screen.getByTestId('project-card-preview-1');
      const img = preview.querySelector('img');
      expect(img).not.toBeNull();
      expect(img?.getAttribute('src')).toBe('data:image/png;base64,NEW_SHOT_DATA');
    });
  });
});
