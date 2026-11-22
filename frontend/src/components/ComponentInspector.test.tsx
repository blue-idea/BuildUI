import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComponentInspector } from './ComponentInspector';

describe('ComponentInspector (TDD)', () => {
  it('renders inspector banner when active', () => {
    render(
      <ComponentInspector
        isActive={true}
        onExit={vi.fn()}
        onSelectComponent={vi.fn()}
      />
    );

    expect(screen.getByText(/Inspector Mode Active/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /exit inspect mode/i })).toBeDefined();
  });

  it('calls onExit when clicking exit button', () => {
    const handleExit = vi.fn();
    render(
      <ComponentInspector
        isActive={true}
        onExit={handleExit}
        onSelectComponent={vi.fn()}
      />
    );

    const exitBtn = screen.getByRole('button', { name: /exit inspect mode/i });
    fireEvent.click(exitBtn);
    expect(handleExit).toHaveBeenCalled();
  });

  it('selects component and triggers callback with component path and suggested prompt', () => {
    const handleSelect = vi.fn();
    render(
      <ComponentInspector
        isActive={true}
        onExit={vi.fn()}
        onSelectComponent={handleSelect}
      />
    );

    // 触发模拟检查元素
    const mockElementBtn = screen.getByRole('button', { name: /inspect navbar element/i });
    fireEvent.click(mockElementBtn);

    expect(handleSelect).toHaveBeenCalledWith(
      'src/components/Navbar.tsx',
      expect.stringContaining('@src/components/Navbar.tsx')
    );
  });

  it('locks targeted element upon clicking target element tag and opens LocalEditPopover', () => {
    const handleSelect = vi.fn();
    render(
      <ComponentInspector
        isActive={true}
        onExit={vi.fn()}
        onSelectComponent={handleSelect}
      />
    );

    // 点击可选元素列表中的 button
    const targetPill = screen.getByTestId('inspect-target-button');
    expect(targetPill).toBeDefined();
    fireEvent.click(targetPill);

    // 应该弹出 LocalEditPopover
    expect(screen.getByTestId('local-edit-popover')).toBeDefined();

    // 点击 Change Color 药丸填充
    fireEvent.click(screen.getByRole('button', { name: /Change Color/i }));

    // 点击 Apply Edit 提交
    fireEvent.click(screen.getByRole('button', { name: /Apply Edit/i }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('Change background color')
    );
  });
});
