import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PluginCard } from './PluginCard';
import { PluginItem } from '../types/plugin';

describe('PluginCard Component (TDD)', () => {
  const samplePlugin: PluginItem = {
    id: 'stripe',
    name: 'Stripe',
    badge: 'OAuth',
    description: 'Manage payments, customers, and products',
    domain: 'mcp.stripe.com',
    category: 'featured',
    toolsCount: 5,
    isInstalled: false,
  };

  it('renders plugin details including name, badge, description, and domain', () => {
    render(<PluginCard plugin={samplePlugin} onAdd={vi.fn()} />);

    expect(screen.getByText('Stripe')).toBeDefined();
    expect(screen.getByText('OAuth')).toBeDefined();
    expect(screen.getByText('Manage payments, customers, and products')).toBeDefined();
    expect(screen.getByText('mcp.stripe.com')).toBeDefined();
  });

  it('calls onAdd callback when clicking the Add button for uninstalled plugin', () => {
    const handleAdd = vi.fn();
    render(<PluginCard plugin={samplePlugin} onAdd={handleAdd} />);

    const addButton = screen.getByRole('button', { name: /Add/i });
    expect(addButton).toBeDefined();
    fireEvent.click(addButton);

    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd).toHaveBeenCalledWith(samplePlugin);
  });

  it('renders Added/Installed state when plugin is already installed', () => {
    const installedPlugin: PluginItem = {
      ...samplePlugin,
      isInstalled: true,
    };

    render(<PluginCard plugin={installedPlugin} onAdd={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText('Added')).toBeDefined();
  });
});
