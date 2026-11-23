import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComponentInspector } from './ComponentInspector';
import { InspectedElement } from '../types/inspect';

describe('ComponentInspector (TDD)', () => {
  it('renders inspector banner when active', () => {
    render(
      <ComponentInspector
        isActive={true}
        onExit={vi.fn()}
        onSelectComponent={vi.fn()}
      />
    );

    expect(screen.getByText(/Local Edit Mode/i)).toBeDefined();
    expect(screen.getByText(/Select Elements/i)).toBeDefined();
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

  it('renders externally selected element with code region and forwards onJumpToCode', () => {
    const handleJumpToCode = vi.fn();
    const externalElement: InspectedElement = {
      id: 'el-custom',
      tagName: 'section',
      componentPath: 'src/components/Hero.tsx',
      line: 14,
      className: 'bg-white p-6',
      codeRegion: {
        filePath: 'src/components/Hero.tsx',
        startLine: 14,
        endLine: 28,
        codeSnippet: '<section className="bg-white p-6">Hero</section>',
        found: true,
      },
    };

    render(
      <ComponentInspector
        isActive={true}
        selectedElement={externalElement}
        onExit={vi.fn()}
        onSelectComponent={vi.fn()}
        onJumpToCode={handleJumpToCode}
      />
    );

    // 应弹出 LocalEditPopover，并展示 section 及行号
    expect(screen.getByText(/<section>/i)).toBeDefined();
    expect(screen.getByText(/Hero\.tsx/i)).toBeDefined();
    expect(screen.getByText(/Lines 14-28/i)).toBeDefined();

    // 点击 Jump to Code 应触发回调
    const jumpBtn = screen.getByRole('button', { name: /jump to code/i });
    fireEvent.click(jumpBtn);

    expect(handleJumpToCode).toHaveBeenCalledTimes(1);
    expect(handleJumpToCode).toHaveBeenCalledWith('src/components/Hero.tsx', 14);
  });
});
