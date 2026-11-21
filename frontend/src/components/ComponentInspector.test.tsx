import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComponentInspector } from './ComponentInspector';

describe('ComponentInspector', () => {
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
      '@src/components/Navbar.tsx: '
    );
  });
});
