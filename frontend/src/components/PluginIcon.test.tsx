import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PluginIcon } from './PluginIcon';
import { DEFAULT_CATALOG_CATEGORIES } from '../config/plugins';

describe('PluginIcon Component (TDD)', () => {
  const allPresetPlugins = DEFAULT_CATALOG_CATEGORIES.flatMap((c) => c.plugins);

  it('renders a site icon for every preset plugin without fallback text initials', () => {
    expect(allPresetPlugins.map(({ id }) => id)).toEqual(expect.arrayContaining(['remotion', 'figma', 'lucide-icons']));

    for (const plugin of allPresetPlugins) {
      const { unmount } = render(<PluginIcon plugin={plugin} />);
      const iconContainer = screen.getByTestId(`plugin-icon-${plugin.id}`);
      expect(iconContainer).toBeDefined();

      // 验证渲染了 SVG 矢量图形或真实图标元素
      const svgOrImg = iconContainer.querySelector('svg, img');
      expect(svgOrImg).not.toBeNull();

      // 严格检查：不得存在简陋的纯文本两个大写字母（如 EX, SH, PL, ST, MO, MA, AW, GI, CL, SN, CO, HG, HF, BT）
      const fallbackInitials = plugin.name.slice(0, 2).toUpperCase();
      // 图标容器内部的纯文本不应当是这种粗糙字母缩写
      const textContent = iconContainer.textContent?.trim();
      expect(textContent).not.toBe(fallbackInitials);
      expect(textContent).not.toBe('HG');
      expect(textContent).not.toBe('HF');
      expect(textContent).not.toBe('BT');

      unmount();
    }
  });

  it('renders custom iconUrl when provided', () => {
    const customPlugin = {
      id: 'custom-mcp',
      name: 'My Service',
      iconUrl: 'https://example.com/favicon.png',
      description: 'Custom',
      domain: 'example.com',
      category: 'custom' as const,
      toolsCount: 0,
    };

    render(<PluginIcon plugin={customPlugin} />);
    const img = screen.getByRole('img', { name: 'My Service' });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://example.com/favicon.png');
  });

  it('falls back gracefully to initials for unknown plugins without custom iconUrl', () => {
    const unknownPlugin = {
      id: 'unknown-service',
      name: 'Zephyr Tool',
      iconBg: '#10b981',
      description: 'Unknown',
      domain: 'zephyr.io',
      category: 'custom' as const,
      toolsCount: 0,
    };

    render(<PluginIcon plugin={unknownPlugin} />);
    const iconContainer = screen.getByTestId('plugin-icon-unknown-service');
    expect(iconContainer.textContent?.trim()).toBe('ZE');
  });
});
