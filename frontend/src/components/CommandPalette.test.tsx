import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommandPalette, CommandAction } from './CommandPalette';

const mockActions: CommandAction[] = [
  {
    id: 'theme-cyberpunk',
    title: 'Switch Theme: Cyberpunk Neon',
    category: 'Theme',
    shortcut: 'Ctrl+T',
    run: vi.fn(),
  },
  {
    id: 'export-zip',
    title: 'Export Project as ZIP',
    category: 'Action',
    shortcut: 'Ctrl+E',
    run: vi.fn(),
  },
  {
    id: 'open-settings',
    title: 'Open Settings',
    category: 'Navigation',
    shortcut: 'Ctrl+,',
    run: vi.fn(),
  },
];

describe('CommandPalette Component', () => {
  it('renders command palette with search input and all actions when open', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={vi.fn()}
        actions={mockActions}
      />
    );

    expect(screen.getByPlaceholderText(/type a command or search/i)).toBeDefined();
    expect(screen.getByText('Switch Theme: Cyberpunk Neon')).toBeDefined();
    expect(screen.getByText('Export Project as ZIP')).toBeDefined();
    expect(screen.getByText('Open Settings')).toBeDefined();
  });

  it('filters actions by keyword search', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={vi.fn()}
        actions={mockActions}
      />
    );

    const input = screen.getByPlaceholderText(/type a command or search/i);
    fireEvent.change(input, { target: { value: 'export' } });

    expect(screen.getByText('Export Project as ZIP')).toBeDefined();
    expect(screen.queryByText('Switch Theme: Cyberpunk Neon')).toBeNull();
  });

  it('executes active action on Enter keypress', () => {
    const handleRun = vi.fn();
    const handleClose = vi.fn();
    const actions: CommandAction[] = [
      {
        id: 'test-act',
        title: 'Run Diagnostic Test',
        category: 'Action',
        run: handleRun,
      },
    ];

    render(
      <CommandPalette
        isOpen={true}
        onClose={handleClose}
        actions={actions}
      />
    );

    const input = screen.getByPlaceholderText(/type a command or search/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleRun).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const handleClose = vi.fn();
    render(
      <CommandPalette
        isOpen={true}
        onClose={handleClose}
        actions={mockActions}
      />
    );

    const input = screen.getByPlaceholderText(/type a command or search/i);
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    expect(handleClose).toHaveBeenCalled();
  });
});
