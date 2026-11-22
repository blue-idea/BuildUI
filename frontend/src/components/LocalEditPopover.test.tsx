import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocalEditPopover } from './LocalEditPopover';
import { InspectedElement } from '../types/inspect';

describe('LocalEditPopover Component (TDD)', () => {
  const mockElement: InspectedElement = {
    id: 'el-btn-1',
    tagName: 'button',
    componentPath: 'src/components/RecipeCard.tsx',
    className: 'px-4 py-2 bg-blue-600 text-white rounded-lg',
    textSnippet: 'Save Dinner',
    line: 8,
    codeRegion: {
      filePath: 'src/components/RecipeCard.tsx',
      startLine: 8,
      endLine: 13,
      codeSnippet: `<button className="px-4 py-2 bg-blue-600 text-white rounded-lg">\n  <span>Save Dinner</span>\n</button>`,
      found: true,
    },
  };

  it('renders inspected element metadata like tagName, path, and prompt input', () => {
    render(
      <LocalEditPopover
        element={mockElement}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText(/<button>/i)).toBeDefined();
    expect(screen.getByText(/RecipeCard\.tsx/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Describe what to change for this specific element/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Apply Edit/i })).toBeDefined();
  });

  it('renders code region line numbers badge and expandable code snippet preview', () => {
    render(
      <LocalEditPopover
        element={mockElement}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // 验证展示行号范围 Lines 8-13
    expect(screen.getByText(/Lines 8-13/i)).toBeDefined();

    // 默认折叠或提供展开代码预览按钮
    const toggleCodeBtn = screen.getByRole('button', { name: /view code|hide code|code snippet/i });
    expect(toggleCodeBtn).toBeDefined();

    // 点击展开代码预览
    fireEvent.click(toggleCodeBtn);
    expect(screen.getByText(/<span>Save Dinner<\/span>/)).toBeDefined();
  });

  it('triggers onJumpToCode when clicking Jump to Code button', () => {
    const handleJumpToCode = vi.fn();
    render(
      <LocalEditPopover
        element={mockElement}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onJumpToCode={handleJumpToCode}
      />
    );

    const jumpBtn = screen.getByRole('button', { name: /jump to code/i });
    expect(jumpBtn).toBeDefined();
    fireEvent.click(jumpBtn);

    expect(handleJumpToCode).toHaveBeenCalledTimes(1);
    expect(handleJumpToCode).toHaveBeenCalledWith('src/components/RecipeCard.tsx', 8);
  });

  it('populates prompt when clicking a quick action pill', () => {
    render(
      <LocalEditPopover
        element={mockElement}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const colorPill = screen.getByRole('button', { name: /Change Color/i });
    fireEvent.click(colorPill);

    const input = screen.getByPlaceholderText(/Describe what to change for this specific element/i) as HTMLTextAreaElement;
    expect(input.value).toContain('Change background color');
  });

  it('submits targeted prompt and closes popover', () => {
    const handleSubmit = vi.fn();
    render(
      <LocalEditPopover
        element={mockElement}
        onCancel={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/Describe what to change for this specific element/i);
    fireEvent.change(input, { target: { value: 'Make this button rounded-full with soft shadow' } });

    const submitBtn = screen.getByRole('button', { name: /Apply Edit/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      mockElement,
      expect.stringContaining('Make this button rounded-full with soft shadow')
    );
  });

  it('triggers onCancel when clicking Cancel button', () => {
    const handleCancel = vi.fn();
    render(
      <LocalEditPopover
        element={mockElement}
        onCancel={handleCancel}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
