import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComponentCenterView } from './ComponentCenterView';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <I18nProvider initialLocale="en">{ui}</I18nProvider>
    </ThemeProvider>
  );
};

describe('ComponentCenterView Component (TDD)', () => {
  it('renders top navigation with Go Back, Plugins title, subtitle, and + Add Plugin button', () => {
    const handleGoBack = vi.fn();
    renderWithProviders(<ComponentCenterView onGoBack={handleGoBack} />);

    expect(screen.getByText('Go Back')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: /Plugins/i })).toBeDefined();
    expect(screen.getByText(/Connect plugins \(MCP servers\) to give the AI new tools\./i)).toBeDefined();
    expect(screen.getByRole('button', { name: /\+ Add Plugin/i })).toBeDefined();

    fireEvent.click(screen.getByText('Go Back'));
    expect(handleGoBack).toHaveBeenCalledTimes(1);
  });

  it('renders initial summary "0 plugins · 0 tools enabled" and empty state "No plugins added yet."', () => {
    renderWithProviders(<ComponentCenterView />);

    expect(screen.getByText(/0 plugins · 0 tools enabled/i)).toBeDefined();
    expect(screen.getByText(/No plugins added yet\./i)).toBeDefined();
  });

  it('renders catalog categories including Featured and AI & Media', () => {
    renderWithProviders(<ComponentCenterView />);

    expect(screen.getByText('Add from catalog')).toBeDefined();
    expect(screen.getByText(/Featured/i)).toBeDefined();
    expect(screen.getByText('AI & Media')).toBeDefined();

    // 预设插件检查
    expect(screen.getByText('Stripe')).toBeDefined();
    expect(screen.getByText('Vercel')).toBeDefined();
    expect(screen.getByText('Hugging Face')).toBeDefined();
    expect(screen.getByText('HeyGen')).toBeDefined();
  });

  it('filters catalog plugins according to search input query', () => {
    renderWithProviders(<ComponentCenterView />);

    const searchInput = screen.getByPlaceholderText(/Search catalog/i);
    fireEvent.change(searchInput, { target: { value: 'stripe' } });

    expect(screen.getByText('Stripe')).toBeDefined();
    expect(screen.queryByText('Vercel')).toBeNull();
    expect(screen.queryByText('HeyGen')).toBeNull();
  });

  it('installs a plugin when clicking Add on a card, updating counts and installed section', () => {
    renderWithProviders(<ComponentCenterView />);

    // 点击 Stripe 卡片的 Add 按钮
    const stripeCard = screen.getByTestId('plugin-card-stripe');
    const addButton = stripeCard.querySelector('button');
    expect(addButton).toBeDefined();
    if (addButton) {
      fireEvent.click(addButton);
    }

    // 统计应该不再是 0 plugins
    expect(screen.queryByText(/0 plugins · 0 tools enabled/i)).toBeNull();
    expect(screen.getByText(/1 plugins/i)).toBeDefined();
  });

  it('opens AddPluginModal when clicking + Add Plugin and allows creating custom plugin', () => {
    renderWithProviders(<ComponentCenterView />);

    const addPluginBtn = screen.getByTestId('btn-open-add-plugin');
    fireEvent.click(addPluginBtn);

    expect(screen.getByText('Add Custom Plugin')).toBeDefined();

    const nameInput = screen.getByPlaceholderText(/e\.g\. GitHub MCP or Postgres/i);
    const domainInput = screen.getByPlaceholderText(/mcp\.example\.com or npx -y .../i);
    fireEvent.change(nameInput, { target: { value: 'Custom Docker MCP' } });
    fireEvent.change(domainInput, { target: { value: 'mcp.docker.local' } });

    const submitBtn = screen.getByTestId('btn-submit-plugin');
    fireEvent.click(submitBtn);

    expect(screen.getByText('Custom Docker MCP')).toBeDefined();
    expect(screen.queryByText('Add Custom Plugin')).toBeNull();
  });
});
