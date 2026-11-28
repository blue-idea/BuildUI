import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModelSelector } from './ModelSelector';
import { I18nProvider } from '../i18n/I18nContext';

// 使用 I18nProvider 包装测试组件
const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nProvider initialLocale="zh">{ui}</I18nProvider>);
};

describe('ModelSelector Component', () => {
  it('renders default auto state correctly', () => {
    const handleChange = vi.fn();
    renderWithI18n(
      <ModelSelector
        value="auto"
        onChange={handleChange}
        configuredProvider="deepseek"
        configuredModel="deepseek-v4-flash"
      />
    );

    // 默认展示 Auto 或 自动
    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    expect(triggerBtn).toBeDefined();
    expect(triggerBtn.textContent).toMatch(/Auto|自动/i);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens dropdown menu when clicked and lists auto and configured provider', () => {
    const handleChange = vi.fn();
    renderWithI18n(
      <ModelSelector
        value="auto"
        onChange={handleChange}
        configuredProvider="deepseek"
        configuredModel="deepseek-v4-flash"
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    fireEvent.click(triggerBtn);

    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');
    // 列表中应包含 Auto 和 deepseek-v4-flash
    const autoOption = screen.getByRole('option', { name: /auto/i });
    const configuredOption = screen.getByRole('option', { name: /deepseek-v4-flash/i });

    expect(autoOption).toBeDefined();
    expect(configuredOption).toBeDefined();
  });

  it('triggers onChange when selecting the configured provider', () => {
    const handleChange = vi.fn();
    renderWithI18n(
      <ModelSelector
        value="auto"
        onChange={handleChange}
        configuredProvider="deepseek"
        configuredModel="deepseek-v4-flash"
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    fireEvent.click(triggerBtn);

    const configuredOption = screen.getByRole('option', { name: /deepseek-v4-flash/i });
    fireEvent.click(configuredOption);

    expect(handleChange).toHaveBeenCalledWith('configured');
  });

  it('displays configured model name on trigger button when value is configured', () => {
    const handleChange = vi.fn();
    renderWithI18n(
      <ModelSelector
        value="configured"
        onChange={handleChange}
        configuredProvider="deepseek"
        configuredModel="deepseek-v4-flash"
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    expect(triggerBtn.textContent).toContain('deepseek-v4-flash');
  });

  it('closes dropdown when clicking outside or pressing Escape', () => {
    const handleChange = vi.fn();
    renderWithI18n(
      <div>
        <div data-testid="outside">Outside area</div>
        <ModelSelector
          value="auto"
          onChange={handleChange}
          configuredProvider="deepseek"
          configuredModel="deepseek-v4-flash"
        />
      </div>
    );

    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    fireEvent.click(triggerBtn);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');

    // 按 Escape 键关闭
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');

    // 重新打开并点击外部关闭
    fireEvent.click(triggerBtn);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('handles empty configured provider gracefully', () => {
    const handleChange = vi.fn();
    renderWithI18n(
      <ModelSelector
        value="auto"
        onChange={handleChange}
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    fireEvent.click(triggerBtn);

    const autoOption = screen.getByRole('option', { name: /auto/i });
    expect(autoOption).toBeDefined();
  });

  it('displays multiple configured providers and triggers onOpenSettings from action button', () => {
    const handleChange = vi.fn();
    const handleOpenSettings = vi.fn();
    const mockSettings = {
      'llm.active_provider': 'deepseek',
      'llm.providers.deepseek.api_key': 'sk-deepseek-key',
      'llm.providers.deepseek.model': 'deepseek-chat',
      'llm.providers.openai.api_key': 'sk-openai-key',
      'llm.providers.openai.model': 'gpt-4o',
    };

    renderWithI18n(
      <ModelSelector
        value="auto"
        onChange={handleChange}
        settings={mockSettings}
        onOpenSettings={handleOpenSettings}
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    fireEvent.click(triggerBtn);

    // 应该展示 DeepSeek 与 OpenAI 选项
    const deepseekOption = screen.getByRole('option', { name: /deepseek-chat/i });
    const openaiOption = screen.getByRole('option', { name: /gpt-4o/i });
    expect(deepseekOption).toBeDefined();
    expect(openaiOption).toBeDefined();

    // 选择 DeepSeek
    fireEvent.click(deepseekOption);
    expect(handleChange).toHaveBeenCalledWith('provider:deepseek');

    // 重新打开并点击管理提供商按钮
    fireEvent.click(triggerBtn);
    const manageBtn = screen.getByRole('button', { name: /manage providers/i });
    expect(manageBtn).toBeDefined();
    fireEvent.click(manageBtn);
    expect(handleOpenSettings).toHaveBeenCalled();
  });

  it('supports Ollama without api key as a configured provider from settings', () => {
    const handleChange = vi.fn();
    const mockSettings = {
      'llm.provider_ids': 'ollama',
      'llm.providers.ollama.name': 'Ollama (Local)',
      'llm.providers.ollama.base_url': 'http://localhost:11434/v1',
      'llm.providers.ollama.api_key': '',
      'llm.providers.ollama.model': 'qwen2.5-coder',
    };

    renderWithI18n(
      <ModelSelector
        value="auto"
        onChange={handleChange}
        settings={mockSettings}
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    fireEvent.click(triggerBtn);

    const ollamaOption = screen.getByRole('option', { name: /qwen2\.5-coder/i });
    expect(ollamaOption).toBeDefined();

    fireEvent.click(ollamaOption);
    expect(handleChange).toHaveBeenCalledWith('provider:ollama');
  });

  it('supports dynamically added custom providers from settings and selects them', () => {
    const handleChange = vi.fn();
    const mockSettings = {
      'llm.provider_ids': 'custom_fast,custom_slow',
      'llm.providers.custom_fast.name': 'Fast Inference Proxy',
      'llm.providers.custom_fast.base_url': 'http://proxy.internal:8000/v1',
      'llm.providers.custom_fast.api_key': 'fast-key-123',
      'llm.providers.custom_fast.model': 'llama-3-8b-instant',
      'llm.providers.custom_slow.name': 'Heavy Reasoning',
      'llm.providers.custom_slow.base_url': 'http://reasoning.internal:8000/v1',
      'llm.providers.custom_slow.api_key': '',
      'llm.providers.custom_slow.model': 'deepseek-r1:70b',
    };

    renderWithI18n(
      <ModelSelector
        value="provider:custom_fast"
        onChange={handleChange}
        settings={mockSettings}
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    expect(triggerBtn.textContent).toContain('llama-3-8b-instant');

    fireEvent.click(triggerBtn);

    const fastOption = screen.getByRole('option', { name: /llama-3-8b-instant/i });
    const slowOption = screen.getByRole('option', { name: /deepseek-r1:70b/i });
    expect(fastOption).toBeDefined();
    expect(slowOption).toBeDefined();

    fireEvent.click(slowOption);
    expect(handleChange).toHaveBeenCalledWith('provider:custom_slow');
  });

  it('uses Apple System Blue highlights without purple classes', () => {
    const { container } = renderWithI18n(
      <ModelSelector
        value="auto"
        onChange={vi.fn()}
        configuredProvider="deepseek"
        configuredModel="deepseek-v4-flash"
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /model selector/i });
    expect(triggerBtn.className).toContain('focus:ring-blue-500');
    expect(triggerBtn.className).not.toMatch(/purple|indigo|violet/);

    fireEvent.click(triggerBtn);
    const autoOption = screen.getByRole('option', { name: /auto/i });
    expect(autoOption.className).toContain('bg-blue-50');
    expect(container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);
  });
});
