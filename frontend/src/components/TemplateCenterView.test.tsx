import { act, render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TemplateCenterView } from './TemplateCenterView';
import { AppTemplate } from './TemplateModal';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';
import { LOCAL_PROJECT_TEMPLATES } from '../config/projectTemplates';

const mockTemplates: AppTemplate[] = [
  {
    id: 'web-saas',
    name: 'SaaS Analytics Dashboard',
    description: 'Cloud metrics and KPI dashboard',
    category: 'Analytics',
    source: 'official',
    platform: 'web',
    tags: ['Charts', 'KPIs'],
    icon: '📊',
  },
  {
    id: 'web-landing',
    name: 'Product Landing Page',
    description: 'Clean responsive landing page',
    category: 'Marketing',
    source: 'official',
    platform: 'web',
    tags: ['Landing', 'SaaS'],
    icon: '🚀',
  },
  {
    id: 'desktop-ide',
    name: 'Developer Workstation',
    description: 'Dual-pane code inspector and terminal',
    category: 'Developer',
    source: 'official',
    platform: 'desktop',
    tags: ['IDE', 'Terminal'],
    icon: '💻',
  },
  {
    id: 'app-fitness',
    name: 'Fitness & Workout Tracker',
    description: 'Activity rings and exercise logger',
    category: 'Health',
    source: 'official',
    platform: 'app',
    tags: ['Activity', 'Timer'],
    icon: '🏃',
  },
];

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  );
};

describe('TemplateCenterView - Normal Page with Web, Desktop, App Categories', () => {
  it('官方目录的 Desktop 分类仅提供 React，并以 Desktop 平台创建', async () => {
    const onCreateProject = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <TemplateCenterView
        templates={LOCAL_PROJECT_TEMPLATES}
        onSelectTemplate={vi.fn()}
        onCreateProject={onCreateProject}
      />
    );

    const desktop = screen.getByTestId('platform-tab-desktop');
    expect(within(desktop).getByText('1')).toBeDefined();
    fireEvent.click(desktop);
    expect(screen.getAllByRole('article').map((card) => card.dataset.testid)).toEqual(['template-card-react']);
    expect(within(screen.getByTestId('template-card-react')).getByText('Desktop')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Create App' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Project name' }), { target: { value: 'Sample AI App' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Create project' })); });
    expect(onCreateProject).toHaveBeenCalledWith('Sample AI App', 'react', 'desktop');
  });

  it('选择默认模板与提交创建相互独立', async () => {
    const onSelectTemplate = vi.fn();
    const onCreateProject = vi.fn().mockResolvedValue(undefined);
    const props = { templates: mockTemplates, onSelectTemplate, onCreateProject, selectedTemplateId: 'web-saas' };
    renderWithProviders(<TemplateCenterView {...props} />);

    await act(async () => { fireEvent.click(screen.getByTestId('use-template-web-landing')); });
    expect(onSelectTemplate).toHaveBeenCalledWith('web-landing');
    expect(onCreateProject).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Create App' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Project name' }), { target: { value: '  Sample AI App  ' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Create project' })); });
    expect(onCreateProject).toHaveBeenCalledWith('Sample AI App', 'web-saas', 'web');
  });

  it('仅将官方模板纳入列表、平台计数和搜索', () => {
    renderWithProviders(<TemplateCenterView templates={[
      mockTemplates[0],
      { ...mockTemplates[1], source: 'example' },
      { ...mockTemplates[2], id: 'jeff-kazzee/dyad-template-angular', source: 'community' },
      { ...mockTemplates[3], source: undefined },
    ]} onSelectTemplate={vi.fn()} />);

    expect(screen.getAllByRole('article').map((card) => card.dataset.testid)).toEqual(['template-card-web-saas']);
    expect(within(screen.getByTestId('platform-tab-all')).getByText('1')).toBeDefined();
    expect(screen.queryByTestId('platform-tab-desktop')).toBeNull();
    expect(screen.queryByTestId('platform-tab-app')).toBeNull();
    fireEvent.change(screen.getByTestId('template-search-input'), { target: { value: 'landing' } });
    expect(screen.getByTestId('template-empty-state')).toBeDefined();
  });

  it('renders the template center page header and 3 main platform tabs plus all', () => {
    renderWithProviders(
      <TemplateCenterView
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    expect(screen.getByText(/Application Templates|应用模版中心/i)).toBeDefined();
    expect(screen.getByTestId('platform-tab-all')).toBeDefined();
    expect(screen.getByTestId('platform-tab-web')).toBeDefined();
    expect(screen.getByTestId('platform-tab-desktop')).toBeDefined();
    expect(screen.getByTestId('platform-tab-app')).toBeDefined();

    // 默认展示全部
    expect(screen.getByText('SaaS Analytics Dashboard')).toBeDefined();
    expect(screen.getByText('Developer Workstation')).toBeDefined();
    expect(screen.getByText('Fitness & Workout Tracker')).toBeDefined();
  });

  it('filters templates strictly by web, desktop, and app category tabs', () => {
    renderWithProviders(
      <TemplateCenterView
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    // 切换到 Web 分类
    fireEvent.click(screen.getByTestId('platform-tab-web'));
    expect(screen.getByText('SaaS Analytics Dashboard')).toBeDefined();
    expect(screen.getByText('Product Landing Page')).toBeDefined();
    expect(screen.queryByText('Developer Workstation')).toBeNull();
    expect(screen.queryByText('Fitness & Workout Tracker')).toBeNull();

    // 切换到 Desktop 分类
    fireEvent.click(screen.getByTestId('platform-tab-desktop'));
    expect(screen.getByText('Developer Workstation')).toBeDefined();
    expect(screen.queryByText('SaaS Analytics Dashboard')).toBeNull();
    expect(screen.queryByText('Fitness & Workout Tracker')).toBeNull();

    // 切换到 App 分类
    fireEvent.click(screen.getByTestId('platform-tab-app'));
    expect(screen.getByText('Fitness & Workout Tracker')).toBeDefined();
    expect(screen.queryByText('SaaS Analytics Dashboard')).toBeNull();
    expect(screen.queryByText('Developer Workstation')).toBeNull();
  });

  it('supports searching templates by keyword across name, description, and tags', () => {
    renderWithProviders(
      <TemplateCenterView
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    const searchInput = screen.getByTestId('template-search-input');
    fireEvent.change(searchInput, { target: { value: 'terminal' } });

    expect(screen.getByText('Developer Workstation')).toBeDefined();
    expect(screen.queryByText('SaaS Analytics Dashboard')).toBeNull();
    expect(screen.queryByText('Fitness & Workout Tracker')).toBeNull();
  });

  it('calls onSelectTemplate when clicking Use Template on a template card', async () => {
    const onSelectTemplate = vi.fn();
    renderWithProviders(
      <TemplateCenterView
        templates={mockTemplates}
        onSelectTemplate={onSelectTemplate}
      />
    );

    const useBtn = screen.getByTestId('use-template-web-saas');
    await act(async () => { fireEvent.click(useBtn); });

    expect(onSelectTemplate).toHaveBeenCalledWith('web-saas');
  });

  it('shows empty state when search returns no matches and allows clearing search', () => {
    renderWithProviders(
      <TemplateCenterView
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    const searchInput = screen.getByTestId('template-search-input');
    fireEvent.change(searchInput, { target: { value: 'non-existent-xyz' } });

    expect(screen.getByTestId('template-empty-state')).toBeDefined();

    const clearBtn = screen.getByTestId('clear-search-btn');
    fireEvent.click(clearBtn);

    expect(screen.queryByTestId('template-empty-state')).toBeNull();
    expect(screen.getByText('SaaS Analytics Dashboard')).toBeDefined();
  });
});
