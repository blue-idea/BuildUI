import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StyleExtractor } from './StyleExtractor';
import { I18nProvider } from '../i18n/I18nContext';

const renderWithI18n = (ui: React.ReactElement, initialLocale = 'en' as const) => {
  return render(<I18nProvider initialLocale={initialLocale}>{ui}</I18nProvider>);
};

describe('StyleExtractor Component (TDD)', () => {
  it('renders input area for reference brand/product and image upload trigger', () => {
    renderWithI18n(<StyleExtractor onSaveTemplate={vi.fn()} />);

    expect(screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i)).toBeDefined();
    expect(screen.getByText(/Upload Reference Image/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Extract Style & Prompt/i })).toBeDefined();
  });

  it('extracts style and displays color palette and generated design prompt when extracting', async () => {
    renderWithI18n(<StyleExtractor onSaveTemplate={vi.fn()} />);

    const brandInput = screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i);
    fireEvent.change(brandInput, { target: { value: 'Linear' } });

    const extractBtn = screen.getByRole('button', { name: /Extract Style & Prompt/i });
    fireEvent.click(extractBtn);

    // 应该渲染调色板与 Prompt 预览
    expect(screen.getByText(/Design System Prompt/i)).toBeDefined();
    expect(screen.getByText(/Live UI Preview/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Save as Style Template/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Copy Prompt/i })).toBeDefined();
  });

  it('calls onSaveTemplate callback when clicking Save as Style Template button', () => {
    const handleSave = vi.fn();
    renderWithI18n(<StyleExtractor onSaveTemplate={handleSave} />);

    const brandInput = screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i);
    fireEvent.change(brandInput, { target: { value: 'Stripe' } });

    fireEvent.click(screen.getByRole('button', { name: /Extract Style & Prompt/i }));

    const saveBtn = screen.getByRole('button', { name: /Save as Style Template/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceSource: 'Stripe',
        palette: expect.objectContaining({
          primary: expect.any(String),
        }),
      })
    );
  });
});
