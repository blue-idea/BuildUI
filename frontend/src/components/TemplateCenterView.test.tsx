import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TemplateCenterView } from './TemplateCenterView';
import { AppTemplate } from './TemplateModal';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';

const mockTemplates: AppTemplate[] = [
  {
    id: 'web-saas',
    name: 'SaaS Analytics Dashboard',
    description: 'Cloud metrics and KPI dashboard',
    category: 'Analytics',
    platform: 'web',
    tags: ['Charts', 'KPIs'],
    icon: '📊',
  },
  {
    id: 'web-landing',
    name: 'Product Landing Page',
    description: 'Clean responsive landing page',
    category: 'Marketing',
    platform: 'web',
    tags: ['Landing', 'SaaS'],
    icon: '🚀',
  },
  {
    id: 'desktop-ide',
    name: 'Developer Workstation',
    description: 'Dual-pane code inspector and terminal',
    category: 'Developer',
    platform: 'desktop',
    tags: ['IDE', 'Terminal'],
    icon: '💻',
  },
  {
    id: 'app-fitness',
    name: 'Fitness & Workout Tracker',
    description: 'Activity rings and exercise logger',
    category: 'Health',
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

  it('calls onSelectTemplate when clicking Use Template on a template card', () => {
    const onSelectTemplate = vi.fn();
    renderWithProviders(
      <TemplateCenterView
        templates={mockTemplates}
        onSelectTemplate={onSelectTemplate}
      />
    );

    const useBtn = screen.getByTestId('use-template-web-saas');
    fireEvent.click(useBtn);

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
