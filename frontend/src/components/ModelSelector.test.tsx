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
});
