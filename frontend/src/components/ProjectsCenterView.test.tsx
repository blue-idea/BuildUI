import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ProjectsCenterView } from './ProjectsCenterView';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';
import { AppItem } from './AppDrawer';
import { PROJECT_DELETE_COOLDOWN_SECONDS } from '../config/projectDelete';

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

  it('requires confirmation before calling onDeleteApp to prevent accidental deletion', () => {
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

    // 首次点击删除按钮仅进入二次确认态，不直接删除
    const deleteBtn = screen.getByTestId('delete-project-btn-2');
    fireEvent.click(deleteBtn);
    expect(onDeleteApp).not.toHaveBeenCalled();

    // 点击取消应退出确认态且不触发删除或冷静期
    const cancelBtn = screen.getByTestId('cancel-delete-project-btn-2');
    fireEvent.click(cancelBtn);
    expect(onDeleteApp).not.toHaveBeenCalled();
    expect((screen.getByTestId('delete-project-btn-2') as HTMLButtonElement).disabled).toBe(false);

    // 再次点击删除并确认，才真正触发 onDeleteApp
    fireEvent.click(screen.getByTestId('delete-project-btn-2'));
    fireEvent.click(screen.getByTestId('confirm-delete-project-btn-2'));
    expect(onDeleteApp).toHaveBeenCalledTimes(1);
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

  // 工程删除冷静期（默认 20 秒，仅限当前项目且项目删除后自动取消）与防误删二次确认测试
  describe('Project Delete Cooldown & Anti-Accidental Deletion (TDD)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('确认删除后仅当前项目按钮进入默认 20 秒冷静期，其他项目按钮不受影响，到期后自动恢复', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-28T10:00:00.000Z'));

      const onDeleteApp = vi.fn();
      renderWithProviders(
        <ProjectsCenterView
          apps={mockApps}
          activeAppId={1}
          onNewProject={vi.fn()}
          onDeleteApp={onDeleteApp}
        />
      );

      // 第一步：点击项目 2 删除进入确认态并确认删除（此处 mockApps 未立即移除项目 2，模拟异步或失败残留）
      fireEvent.click(screen.getByTestId('delete-project-btn-2'));
      fireEvent.click(screen.getByTestId('confirm-delete-project-btn-2'));
      expect(onDeleteApp).toHaveBeenCalledTimes(1);
      expect(onDeleteApp).toHaveBeenCalledWith(2);

      // 第二步：仅项目 2 的删除按钮进入 20 秒冷静期；项目 1 删除按钮不受影响且无全局冷却横幅
      expect(screen.queryByTestId('delete-cooldown-banner')).toBeNull();
      const deleteBtn1 = screen.getByTestId('delete-project-btn-1') as HTMLButtonElement;
      const deleteBtn2 = screen.getByTestId('delete-project-btn-2') as HTMLButtonElement;
      expect(deleteBtn2.disabled).toBe(true);
      expect(deleteBtn2.textContent).toContain(`${PROJECT_DELETE_COOLDOWN_SECONDS}s`);
      expect(deleteBtn1.disabled).toBe(false);
      expect(deleteBtn1.textContent?.trim()).toBe('');

      // 冷静期内再次点击项目 2 删除按钮无效，不进入确认态也不调用 onDeleteApp
      fireEvent.click(deleteBtn2);
      expect(screen.queryByTestId('confirm-delete-project-btn-2')).toBeNull();
      expect(onDeleteApp).toHaveBeenCalledTimes(1);

      // 项目 1 仍可正常点击进入确认态并取消，互不干扰
      fireEvent.click(deleteBtn1);
      expect(screen.getByTestId('confirm-delete-project-btn-1')).toBeDefined();
      fireEvent.click(screen.getByTestId('cancel-delete-project-btn-1'));

      // 推进 1 秒：项目 2 倒计时更新为 19s，仍然禁用
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect((screen.getByTestId('delete-project-btn-2') as HTMLButtonElement).disabled).toBe(true);
      expect(screen.getByTestId('delete-project-btn-2').textContent).toContain('19s');

      // 推进至第 19 秒（还剩 1 秒）：仍然禁用
      act(() => {
        vi.advanceTimersByTime(18_000);
      });
      expect((screen.getByTestId('delete-project-btn-2') as HTMLButtonElement).disabled).toBe(true);
      expect(screen.getByTestId('delete-project-btn-2').textContent).toContain('1s');

      // 再推进 1 秒（满 20 秒）：项目 2 冷静期结束，恢复可点击
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      const restoredBtn2 = screen.getByTestId('delete-project-btn-2') as HTMLButtonElement;
      expect(restoredBtn2.disabled).toBe(false);
      expect(restoredBtn2.textContent?.trim()).toBe('');

      // 冷静期结束后项目 2 可重新进入确认态
      fireEvent.click(restoredBtn2);
      expect(screen.getByTestId('confirm-delete-project-btn-2')).toBeDefined();
    });

    it('当冷静期中的项目已经被删除（从 apps 中移除）时，自动取消该项目的冷静期', () => {
      vi.useFakeTimers();
      const now = new Date('2026-11-28T10:00:00.000Z').getTime();
      vi.setSystemTime(now);

      const onDeleteCooldownsChange = vi.fn();
      const { rerender } = renderWithProviders(
        <ProjectsCenterView
          apps={mockApps}
          activeAppId={1}
          onNewProject={vi.fn()}
          onDeleteApp={vi.fn()}
          deleteCooldowns={{ 2: now + 20_000 }}
          onDeleteCooldownsChange={onDeleteCooldownsChange}
        />
      );

      expect((screen.getByTestId('delete-project-btn-2') as HTMLButtonElement).disabled).toBe(true);
      expect((screen.getByTestId('delete-project-btn-1') as HTMLButtonElement).disabled).toBe(false);

      // 模拟项目 2 已被删除，从 apps 列表中移除
      rerender(
        <ThemeProvider>
          <I18nProvider>
            <ProjectsCenterView
              apps={[mockApps[0]]}
              activeAppId={1}
              onNewProject={vi.fn()}
              onDeleteApp={vi.fn()}
              deleteCooldowns={{ 2: now + 20_000 }}
              onDeleteCooldownsChange={onDeleteCooldownsChange}
            />
          </I18nProvider>
        </ThemeProvider>
      );

      // 应自动回调清空已删除项目 2 的冷静期
      expect(onDeleteCooldownsChange).toHaveBeenCalledWith({});
      expect((screen.getByTestId('delete-project-btn-1') as HTMLButtonElement).disabled).toBe(false);
    });

    it('同一时间仅允许一个项目卡片处于删除确认态，点击另一项目删除会自动切换确认目标', () => {
      renderWithProviders(
        <ProjectsCenterView
          apps={mockApps}
          activeAppId={1}
          onNewProject={vi.fn()}
          onDeleteApp={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('delete-project-btn-1'));
      expect(screen.getByTestId('confirm-delete-project-btn-1')).toBeDefined();

      fireEvent.click(screen.getByTestId('delete-project-btn-2'));
      expect(screen.queryByTestId('confirm-delete-project-btn-1')).toBeNull();
      expect(screen.getByTestId('confirm-delete-project-btn-2')).toBeDefined();
    });

    it('支持受控 deleteCooldowns（按项目 ID 跨页保持冷静期）并在到期后自动清理', () => {
      vi.useFakeTimers();
      const now = new Date('2026-11-28T10:00:00.000Z').getTime();
      vi.setSystemTime(now);

      const onDeleteCooldownsChange = vi.fn();
      renderWithProviders(
        <ProjectsCenterView
          apps={mockApps}
          activeAppId={1}
          onNewProject={vi.fn()}
          onDeleteApp={vi.fn()}
          deleteCooldowns={{ 2: now + 5_000 }}
          onDeleteCooldownsChange={onDeleteCooldownsChange}
        />
      );

      expect((screen.getByTestId('delete-project-btn-2') as HTMLButtonElement).disabled).toBe(true);
      expect(screen.getByTestId('delete-project-btn-2').textContent).toContain('5s');
      expect((screen.getByTestId('delete-project-btn-1') as HTMLButtonElement).disabled).toBe(false);

      act(() => {
        vi.advanceTimersByTime(5_000);
      });

      expect(onDeleteCooldownsChange).toHaveBeenCalledWith({});
    });
  });
});
