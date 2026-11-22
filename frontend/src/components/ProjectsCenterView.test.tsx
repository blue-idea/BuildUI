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
        onCreateApp={vi.fn()}
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
        onCreateApp={vi.fn()}
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
        onCreateApp={vi.fn()}
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
        onCreateApp={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    const openBtn = screen.getByTestId('open-project-btn-2');
    fireEvent.click(openBtn);

    expect(onSelectApp).toHaveBeenCalledWith(2);
    expect(onOpenProject).toHaveBeenCalledWith(2);
  });

  it('supports creating a new named project via form input', async () => {
    const onCreateNamedApp = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onCreateApp={vi.fn()}
        onCreateNamedApp={onCreateNamedApp}
        onDeleteApp={vi.fn()}
      />
    );

    // 点击“新建工程”按钮展开输入表单
    const newBtn = screen.getByTestId('new-project-btn');
    fireEvent.click(newBtn);

    const input = screen.getByTestId('new-project-name-input');
    fireEvent.change(input, { target: { value: 'Fitness Tracker' } });

    const submitBtn = screen.getByTestId('submit-create-project-btn');
    fireEvent.click(submitBtn);

    expect(onCreateNamedApp).toHaveBeenCalledWith('Fitness Tracker');
  });

  it('triggers onDeleteApp when clicking delete button', () => {
    const onDeleteApp = vi.fn();

    renderWithProviders(
      <ProjectsCenterView
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onCreateApp={vi.fn()}
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
        onCreateApp={vi.fn()}
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
        onCreateApp={vi.fn()}
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
        onCreateApp={vi.fn()}
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
        onCreateApp={vi.fn()}
        onDeleteApp={vi.fn()}
      />,
      'zh'
    );

    expect(screen.getByText('工程管理')).toBeDefined();
    expect(screen.getByText('当前激活')).toBeDefined();
    expect(screen.getByTestId('new-project-btn').textContent).toContain('新建工程');
  });
});
