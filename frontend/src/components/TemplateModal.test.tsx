import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TemplateModal, AppTemplate } from './TemplateModal';

const mockTemplates: AppTemplate[] = [
  {
    id: 'saas-dashboard',
    name: 'SaaS Analytics Dashboard',
    description: 'Production-ready metrics dashboard featuring revenue KPI cards',
    category: 'Analytics',
    tags: ['Charts', 'KPIs', 'Metrics'],
    icon: '📊',
    themeId: 'dark-slate',
  },
  {
    id: 'portfolio',
    name: 'Creative Developer Portfolio',
    description: 'High-contrast personal portfolio layout with bio hero',
    category: 'Personal',
    tags: ['Cyberpunk', 'Hero', 'Projects'],
    icon: '⚡',
    themeId: 'cyberpunk-neon',
  },
  {
    id: 'landing-page',
    name: 'Modern Product Landing Page',
    description: 'Clean landing page featuring sticky navigation and pricing',
    category: 'Marketing',
    tags: ['Landing', 'SaaS', 'Pricing'],
    icon: '🚀',
    themeId: 'clean-light',
  },
];

describe('TemplateModal Component', () => {
  it('renders list of available starter templates', () => {
    render(
      <TemplateModal
        isOpen={true}
        onClose={vi.fn()}
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    expect(screen.getByText('Application Templates')).toBeDefined();
    expect(screen.getByText('SaaS Analytics Dashboard')).toBeDefined();
    expect(screen.getByText('Creative Developer Portfolio')).toBeDefined();
    expect(screen.getByText('Modern Product Landing Page')).toBeDefined();
  });

  it('filters templates by keyword search', () => {
    render(
      <TemplateModal
        isOpen={true}
        onClose={vi.fn()}
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search templates/i);
    fireEvent.change(searchInput, { target: { value: 'portfolio' } });

    expect(screen.getByText('Creative Developer Portfolio')).toBeDefined();
    expect(screen.queryByText('SaaS Analytics Dashboard')).toBeNull();
    expect(screen.queryByText('Modern Product Landing Page')).toBeNull();
  });

  it('triggers onSelectTemplate with selected template ID', () => {
    const handleSelect = vi.fn();
    render(
      <TemplateModal
        isOpen={true}
        onClose={vi.fn()}
        templates={mockTemplates}
        onSelectTemplate={handleSelect}
      />
    );

    const useBtns = screen.getAllByRole('button', { name: /use template/i });
    fireEvent.click(useBtns[0]); // 点击第一个模版 (saas-dashboard)

    expect(handleSelect).toHaveBeenCalledWith('saas-dashboard');
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(
      <TemplateModal
        isOpen={true}
        onClose={handleClose}
        templates={mockTemplates}
        onSelectTemplate={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close template modal/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});
