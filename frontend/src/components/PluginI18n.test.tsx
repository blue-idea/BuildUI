import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComponentCenterView } from './ComponentCenterView';
import { AddPluginModal } from './AddPluginModal';
import { PluginDetails } from './PluginDetails';
import { HomePluginPicker } from './HomePluginPicker';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider, useI18n } from '../i18n/I18nContext';
import type { Locale } from '../i18n/types';
import type { InstalledPlugin } from '../types/plugin';

const renderWithLocale = (ui: React.ReactElement, initialLocale: Locale = 'zh') => {
  return render(
    <ThemeProvider>
      <I18nProvider initialLocale={initialLocale}>{ui}</I18nProvider>
    </ThemeProvider>
  );
};

describe('TASK-128: Plugin Page & Popups i18n alignment (TDD)', () => {
  it('ComponentCenterView renders category titles and card buttons in Chinese', async () => {
    vi.stubGlobal('go', {
      main: {
        App: {
          ListPlugins: vi.fn().mockResolvedValue([
            { id: 1, name: 'expo', catalogId: 'expo', transport: 'http', endpoint: 'https://mcp.expo.dev/mcp', enabled: true, headers: [], env: [] },
          ]),
        },
      },
    });

    try {
      renderWithLocale(<ComponentCenterView />, 'zh');

      // 验证分类标题在中文下为中文
      expect(await screen.findByText('界面开发')).toBeDefined();
      expect(screen.getByText('工程协作')).toBeDefined();
      expect(screen.getByText('精选推荐')).toBeDefined();
      expect(screen.getByText('AI 与多媒体')).toBeDefined();

      // 验证已安装卡片的配置按钮为中文 "配置"
      expect(screen.getByRole('button', { name: '配置' })).toBeDefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('AddPluginModal renders labels and options in Chinese', () => {
    renderWithLocale(
      <AddPluginModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initial={{ id: 1, name: 'My Plugin', endpoint: 'npx', transport: 'stdio', enabled: true, description: '' }}
      />,
      'zh'
    );

    // 编辑模式标题
    expect(screen.getByText('编辑插件')).toBeDefined();
    // 传输协议标签
    expect(screen.getByText('传输协议')).toBeDefined();
    // 选项
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.textContent).toContain('标准输入输出 (stdio)');
    expect(select.textContent).toContain('流式 HTTP');
    // stdio 下的命令与参数
    expect(screen.getByText('启动命令')).toBeDefined();
    expect(screen.getByText('启动参数')).toBeDefined();
    // 提交按钮
    expect(screen.getByRole('button', { name: '保存' })).toBeDefined();
  });

  it('PluginDetails renders all sections and popup menus in Chinese', () => {
    const mockPlugin: InstalledPlugin = {
      id: 1,
      name: 'GitHub',
      description: 'GitHub MCP server',
      catalogId: 'github',
      transport: 'http',
      endpoint: 'https://api.githubcopilot.com/mcp/',
      enabled: true,
      headers: ['Authorization'],
      env: [],
    };

    renderWithLocale(
      <PluginDetails
        plugin={mockPlugin}
        projects={[{ id: 1, name: 'Demo Project' }]}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onToolCount={vi.fn()}
      />,
      'zh'
    );

    // 头部返回按钮
    expect(screen.getByRole('button', { name: /所有插件/ })).toBeDefined();
    // 操作按钮
    expect(screen.getByRole('button', { name: '编辑连接' })).toBeDefined();
    expect(screen.getByRole('switch', { name: '启用插件' })).toBeDefined();
    // 适用工程
    expect(screen.getByText('适用工程')).toBeDefined();
    expect(screen.getByText('所有工程')).toBeDefined();
    // 凭据区域
    expect(screen.getByText('请求头')).toBeDefined();
    expect(screen.getByRole('button', { name: '添加请求头' })).toBeDefined();
    // 工具区域
    expect(screen.getByText('工具列表')).toBeDefined();
    expect(screen.getByRole('button', { name: '测试连接' })).toBeDefined();
    // 删除区域
    const deleteBtn = screen.getByRole('button', { name: '删除插件' });
    expect(deleteBtn).toBeDefined();
    fireEvent.click(deleteBtn);
    expect(screen.getByText('确定删除此插件及其已保存配置吗？')).toBeDefined();
    expect(screen.getByRole('button', { name: '确认删除' })).toBeDefined();
  });

  it('HomePluginPicker renders automation toggle and status in Chinese', () => {
    renderWithLocale(
      <HomePluginPicker
        selection={{ enabled: true, pluginIds: [] }}
        plugins={[]}
        loadError={false}
        onChange={vi.fn()}
      />,
      'zh'
    );

    expect(screen.getByText('自动调用插件')).toBeDefined();
    expect(screen.getByText('尚未启用任何插件。请在插件中心启用。')).toBeDefined();
  });

  it('dynamically switches plugin texts when language changes', () => {
    const SwitcherTest = () => {
      const { setLocale } = useI18n();
      return (
        <div>
          <button onClick={() => setLocale('zh')}>ToZH</button>
          <button onClick={() => setLocale('en')}>ToEN</button>
          <AddPluginModal
            isOpen={true}
            onClose={vi.fn()}
            onSubmit={vi.fn()}
          />
        </div>
      );
    };

    render(
      <ThemeProvider>
        <I18nProvider initialLocale="en">
          <SwitcherTest />
        </I18nProvider>
      </ThemeProvider>
    );

    // 默认 en
    expect(screen.getByText('Add Custom Plugin')).toBeDefined();
    expect(screen.getByText('Transport')).toBeDefined();

    // 切换到 zh
    fireEvent.click(screen.getByRole('button', { name: 'ToZH' }));
    expect(screen.getByText('添加自定义插件')).toBeDefined();
    expect(screen.getByText('传输协议')).toBeDefined();

    // 切换回 en
    fireEvent.click(screen.getByRole('button', { name: 'ToEN' }));
    expect(screen.getByText('Add Custom Plugin')).toBeDefined();
    expect(screen.getByText('Transport')).toBeDefined();
  });
});
