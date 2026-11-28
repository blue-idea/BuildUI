import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppDrawer, AppItem } from './AppDrawer';

const mockApps: AppItem[] = [
  { id: 1, name: 'SaaS Dashboard', path: '/workspace/saas-dashboard', createdAt: '2026-11-21T00:00:00Z' },
  { id: 2, name: 'Crypto Tracker', path: '/workspace/crypto-tracker', createdAt: '2026-11-21T01:00:00Z' },
];

describe('AppDrawer', () => {
  it('renders drawer with app list and highlights active app', () => {
    render(
      <AppDrawer
        isOpen={true}
        onClose={vi.fn()}
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onCreateApp={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    expect(screen.getByText('Applications')).toBeDefined();
    expect(screen.getByText('SaaS Dashboard')).toBeDefined();
    expect(screen.getByText('Crypto Tracker')).toBeDefined();
    expect(screen.getByText('Active')).toBeDefined();
  });

  it('triggers onSelectApp when clicking an app card', () => {
    const handleSelect = vi.fn();
    render(
      <AppDrawer
        isOpen={true}
        onClose={vi.fn()}
        apps={mockApps}
        activeAppId={1}
        onSelectApp={handleSelect}
        onCreateApp={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    const appCard = screen.getByText('Crypto Tracker');
    fireEvent.click(appCard);
    expect(handleSelect).toHaveBeenCalledWith(2);
  });

  it('triggers onCreateApp when clicking New Application button', () => {
    const handleCreate = vi.fn();
    render(
      <AppDrawer
        isOpen={true}
        onClose={vi.fn()}
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onCreateApp={handleCreate}
        onDeleteApp={vi.fn()}
      />
    );

    const createBtn = screen.getByRole('button', { name: /new application/i });
    fireEvent.click(createBtn);
    expect(handleCreate).toHaveBeenCalled();
  });

  it('triggers onDeleteApp when clicking delete on inactive app', () => {
    const handleDelete = vi.fn();
    render(
      <AppDrawer
        isOpen={true}
        onClose={vi.fn()}
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onCreateApp={vi.fn()}
        onDeleteApp={handleDelete}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete crypto tracker/i });
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(2);
  });

  it('adapts to light and dark frosted glass materials without hardcoded dark-only surfaces', () => {
    const { container } = render(
      <AppDrawer
        isOpen={true}
        onClose={vi.fn()}
        apps={mockApps}
        activeAppId={1}
        onSelectApp={vi.fn()}
        onCreateApp={vi.fn()}
        onOpenTemplates={vi.fn()}
        onDeleteApp={vi.fn()}
      />
    );

    const html = container.innerHTML;
    expect(html).toContain('bg-white/85');
    expect(html).toContain('dark:bg-zinc-900/85');
    expect(html).toContain('backdrop-blur-xl');
    expect(html).not.toContain('bg-slate-900 ');
    expect(html).not.toContain('bg-slate-950');
  });
});
