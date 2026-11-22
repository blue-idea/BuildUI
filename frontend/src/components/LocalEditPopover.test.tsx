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
