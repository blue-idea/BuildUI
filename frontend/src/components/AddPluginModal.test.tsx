import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddPluginModal } from './AddPluginModal';

describe('AddPluginModal Component (TDD)', () => {
  it('renders dialog with inputs for name, endpoint/command, and description when open', () => {
    render(
      <AddPluginModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Add Custom Plugin')).toBeDefined();
    expect(screen.getByPlaceholderText(/e\.g\. GitHub MCP or Postgres/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/mcp\.example\.com or npx -y .../i)).toBeDefined();
  });

  it('does not render when isOpen is false', () => {
    render(
      <AddPluginModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByText('Add Custom Plugin')).toBeNull();
  });

  it('validates required fields before submitting', () => {
    const handleSubmit = vi.fn();
    render(
      <AddPluginModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    // 默认空提交应阻止
    const submitBtn = screen.getByRole('button', { name: /Add Plugin|Save/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Plugin name is required/i)).toBeDefined();
  });

  it('submits valid plugin information and triggers callback', () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();
    render(
      <AddPluginModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    const nameInput = screen.getByPlaceholderText(/e\.g\. GitHub MCP or Postgres/i);
    const domainInput = screen.getByPlaceholderText(/mcp\.example\.com or npx -y .../i);
    const descInput = screen.getByPlaceholderText(/Brief description of this tool/i);

    fireEvent.change(nameInput, { target: { value: 'Linear Tracker' } });
    fireEvent.change(domainInput, { target: { value: 'mcp.linear.app' } });
    fireEvent.change(descInput, { target: { value: 'Manage Linear issues' } });

    const submitBtn = screen.getByRole('button', { name: /Add Plugin|Save/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Linear Tracker',
        domain: 'mcp.linear.app',
        description: 'Manage Linear issues',
      })
    );
  });
});
