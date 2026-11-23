import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StyleExtractor } from './StyleExtractor';
import { I18nProvider } from '../i18n/I18nContext';

const renderWithI18n = (ui: React.ReactElement, initialLocale = 'en' as const) => {
  return render(<I18nProvider initialLocale={initialLocale}>{ui}</I18nProvider>);
};

describe('StyleExtractor Component (TDD)', () => {
  const originalWindowGo = window.go;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.go = originalWindowGo;
  });

  it('renders input area for reference brand/product and image upload trigger', () => {
    renderWithI18n(<StyleExtractor onSaveTemplate={vi.fn()} />);

    expect(screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i)).toBeDefined();
    expect(screen.getByText(/Upload Reference Image/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Extract Style & Prompt/i })).toBeDefined();
  });

  it('renders model selector with options from settings', () => {
    const handleSelectModel = vi.fn();
    const handleOpenSettings = vi.fn();
    const mockSettings = {
      'llm.providers.openai.name': 'OpenAI',
      'llm.providers.openai.model': 'gpt-4o',
      'llm.providers.openai.api_key': 'sk-test',
      'llm.providers.openai.base_url': 'https://api.openai.com/v1',
    };

    renderWithI18n(
      <StyleExtractor
        onSaveTemplate={vi.fn()}
        settings={mockSettings}
        selectedModel="provider:openai"
        onSelectModel={handleSelectModel}
        onOpenSettings={handleOpenSettings}
      />
    );

    expect(screen.getByText(/Extraction Model/i)).toBeDefined();
    expect(screen.getByText(/gpt-4o/i)).toBeDefined();
  });

  it('calls backend ExtractStyle via Wails RPC when available and displays result', async () => {
    const mockExtractStyle = vi.fn().mockResolvedValue({
      id: 'style-test-123',
      name: 'Custom Vision Model Style',
      referenceSource: 'My App',
      palette: {
        primary: '#ab12cd',
        accent: '#cd34ef',
        background: '#111222',
        surface: '#222333',
        text: '#fefefe',
        textMuted: '#999999',
        border: '#444555',
      },
      borderRadius: '2xl',
      typography: 'Geist, sans-serif',
      tags: ['Vision LLM', 'Ultra Modern'],
      stylePrompt: '# Design System Specification: Custom Vision Model Style\nPrimary: #ab12cd',
      designPrompt: '# Design System Specification: Custom Vision Model Style\nPrimary: #ab12cd',
      createdAt: '2026-11-23T12:00:00Z',
    });

    window.go = {
      main: {
        App: {
          ExtractStyle: mockExtractStyle,
        },
      },
    } as any;

    renderWithI18n(
      <StyleExtractor
        onSaveTemplate={vi.fn()}
        selectedModel="provider:openai"
      />
    );

    const brandInput = screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i);
    fireEvent.change(brandInput, { target: { value: 'My App' } });

    const extractBtn = screen.getByRole('button', { name: /Extract Style & Prompt/i });
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(mockExtractStyle).toHaveBeenCalledTimes(1);
    });

    expect(mockExtractStyle).toHaveBeenCalledWith({
      reference: 'My App',
      imageBase64: undefined,
      provider: 'openai',
      model: 'gpt-4o',
    });

    await waitFor(() => {
      expect(screen.getByText('Custom Vision Model Style')).toBeDefined();
      expect(screen.getByText('#ab12cd')).toBeDefined();
      expect(screen.getByText('Vision LLM')).toBeDefined();
    });
  });

  it('displays error banner when ExtractStyle rejects and provides settings shortcut', async () => {
    const mockExtractStyle = vi.fn().mockRejectedValue(new Error('Configure the model and API URL in Settings.'));
    const handleOpenSettings = vi.fn();

    window.go = {
      main: {
        App: {
          ExtractStyle: mockExtractStyle,
        },
      },
    } as any;

    renderWithI18n(
      <StyleExtractor
        onSaveTemplate={vi.fn()}
        onOpenSettings={handleOpenSettings}
      />
    );

    const brandInput = screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i);
    fireEvent.change(brandInput, { target: { value: 'Any Brand' } });

    const extractBtn = screen.getByRole('button', { name: /Extract Style & Prompt/i });
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(screen.getByTestId('style-extract-error-banner')).toBeDefined();
      expect(screen.getByText(/Configure the model and API URL in Settings/i)).toBeDefined();
    });

    const settingsBtn = screen.getByRole('button', { name: /Configure in Settings/i });
    fireEvent.click(settingsBtn);
    expect(handleOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('extracts style and displays color palette and generated design prompt when extracting with fallback', async () => {
    window.go = undefined as any; // 模拟离线环境
    renderWithI18n(<StyleExtractor onSaveTemplate={vi.fn()} />);

    const brandInput = screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i);
    fireEvent.change(brandInput, { target: { value: 'Linear' } });

    const extractBtn = screen.getByRole('button', { name: /Extract Style & Prompt/i });
    fireEvent.click(extractBtn);

    // 应该渲染调色板与 Prompt 预览
    await waitFor(() => {
      expect(screen.getByText(/Design System Prompt/i)).toBeDefined();
      expect(screen.getByText(/Live UI Preview/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Save as Style Template/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Copy Prompt/i })).toBeDefined();
    });
  });

  it('calls onSaveTemplate callback when clicking Save as Style Template button', async () => {
    window.go = undefined as any;
    const handleSave = vi.fn();
    renderWithI18n(<StyleExtractor onSaveTemplate={handleSave} />);

    const brandInput = screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple, Notion/i);
    fireEvent.change(brandInput, { target: { value: 'Stripe' } });

    fireEvent.click(screen.getByRole('button', { name: /Extract Style & Prompt/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save as Style Template/i })).toBeDefined();
    });

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
