import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
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
  it.each([
    ['expo', 'Streamable HTTP', 'https://mcp.expo.dev/mcp'],
    ['shadcn', 'Standard input/output (stdio)', 'npx'],
    ['playwright', 'Standard input/output (stdio)', 'npx'],
    ['stitch', 'Streamable HTTP', 'https://stitch.googleapis.com/mcp'],
    ['github', 'Streamable HTTP', 'https://api.githubcopilot.com/mcp/'],
    ['cloudflare', 'Streamable HTTP', 'https://mcp.cloudflare.com/mcp'],
    ['snyk', 'Standard input/output (stdio)', 'npx'],
  ])('预填 %s 的传输和连接地址', async (id, transport, endpoint) => {
    vi.stubGlobal('go', { main: { App: { ListPlugins: vi.fn().mockResolvedValue([]) } } });
    try {
      renderWithProviders(<ComponentCenterView />);
      fireEvent.click(within(await screen.findByTestId('plugin-card-' + id)).getByRole('button', { name: 'Add' }));
      expect((screen.getByLabelText('Transport') as HTMLSelectElement).selectedOptions[0].text).toBe(transport);
      expect((screen.getByLabelText(transport.startsWith('Streamable') ? 'Server URL' : 'Command') as HTMLInputElement).value).toBe(endpoint);
      if (transport.includes('stdio')) {
        expect((screen.getByLabelText('Arguments') as HTMLInputElement).value).toContain(id);
      }
    } finally { vi.unstubAllGlobals(); }
  });

  it.each([
    ['stitch', 'http', 'https://stitch.googleapis.com/mcp', 'Add Header', 'X-Goog-Api-Key', true, false],
    ['github', 'http', 'https://api.githubcopilot.com/mcp/', 'Add Header', 'Authorization', true, false],
    ['cloudflare', 'http', 'https://mcp.cloudflare.com/mcp', 'Add Header', 'Authorization', false, true],
    ['snyk', 'stdio', 'npx', 'Add Variable', 'SNYK_TOKEN', false, false],
  ])('为 %s 预填凭据名并保留可用的认证方式', async (id, transport, endpoint, action, key, blocked, oauth) => {
    vi.stubGlobal('go', { main: { App: { ListPlugins: vi.fn().mockResolvedValue([
      { id: 1, name: id, catalogId: id, transport, endpoint, enabled: true, headers: [], env: [] },
    ]) } } });
    try {
      renderWithProviders(<ComponentCenterView />);
      fireEvent.click(await screen.findByRole('button', { name: 'Configure' }));
      expect((screen.getByRole('button', { name: 'Test connection' }) as HTMLButtonElement).disabled).toBe(blocked);
      expect(Boolean(screen.queryByRole('button', { name: 'Sign in with OAuth' }))).toBe(oauth);
      fireEvent.click(screen.getByRole('button', { name: action }));
      expect((screen.getByLabelText('Key') as HTMLInputElement).value).toBe(key);
      expect((screen.getByLabelText('Value') as HTMLInputElement).value).toBe('');
    } finally { vi.unstubAllGlobals(); }
  });
  it('在插件详情中提交 Header 并使用后端返回的最新键', async () => {
    const plugin = { id: 1, name: 'Context7', description: '', transport: 'http', endpoint: 'https://mcp.context7.com/mcp', enabled: true, headers: [] };
    const save = vi.fn().mockResolvedValue({ ...plugin, headers: ['X-Test-Key'] });
    vi.stubGlobal('go', { main: { App: { ListPlugins: vi.fn().mockResolvedValue([plugin]), SavePluginCredential: save } } });
    try {
      renderWithProviders(<ComponentCenterView />);
      fireEvent.click(await screen.findByRole('button', { name: 'Configure' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add Header' }));
      const dialog = screen.getByRole('dialog');
      fireEvent.change(within(dialog).getByLabelText('Key'), { target: { value: 'X-Test-Key' } });
      fireEvent.change(within(dialog).getByLabelText('Value'), { target: { value: 'fixture' } });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
      expect(await within(dialog).findByText('X-Test-Key')).toBeDefined();
      expect(save).toHaveBeenCalledWith({ pluginId: 1, oldKey: '', key: 'X-Test-Key', value: 'fixture' });
    } finally { vi.unstubAllGlobals(); }
  });

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
