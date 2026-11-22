import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeSelector, ThemePreset } from './ThemeSelector';

const mockPresets: ThemePreset[] = [
  {
    id: 'dark-slate',
    name: 'Midnight Slate',
    primary: '#3b82f6',
    background: '#020617',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    primary: '#00ffcc',
    background: '#0a0a12',
  },
  {
    id: 'forest-emerald',
    name: 'Forest Emerald',
    primary: '#10b981',
    background: '#051b14',
  },
];

describe('ThemeSelector Component', () => {
  it('renders current active theme name and color dot', () => {
    render(
      <ThemeSelector
        presets={mockPresets}
        activeThemeId="dark-slate"
        onSelectTheme={vi.fn()}
      />
    );

    expect(screen.getByText('Midnight Slate')).toBeDefined();
    expect(screen.getByRole('button', { name: /select theme/i })).toBeDefined();
  });

  it('opens dropdown and allows selecting another theme', () => {
    const handleSelect = vi.fn();
    render(
      <ThemeSelector
        presets={mockPresets}
        activeThemeId="dark-slate"
        onSelectTheme={handleSelect}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /select theme/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Cyberpunk Neon')).toBeDefined();
    expect(screen.getByText('Forest Emerald')).toBeDefined();

    // 点击 Cyberpunk Neon 选项
    const cyberpunkOption = screen.getByText('Cyberpunk Neon');
    fireEvent.click(cyberpunkOption);

    expect(handleSelect).toHaveBeenCalledWith('cyberpunk-neon');
  });

  it('adapts trigger button and popover with light/dark theme classes', () => {
    render(
      <ThemeSelector
        presets={mockPresets}
        activeThemeId="dark-slate"
        onSelectTheme={vi.fn()}
      />
    );
    const toggleBtn = screen.getByRole('button', { name: /select theme/i });
    expect(toggleBtn.className).toContain('border-slate-200');
    expect(toggleBtn.className).toContain('dark:border-zinc-700');

    fireEvent.click(toggleBtn);
    const dropdown = document.querySelector('.absolute.right-0');
    expect(dropdown?.className).toContain('bg-white');
    expect(dropdown?.className).toContain('dark:bg-zinc-900');
  });
});
