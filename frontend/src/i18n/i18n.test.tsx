import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { en } from './locales/en';
import { zh } from './locales/zh';
import { I18nProvider, useI18n } from './I18nContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

describe('TASK-026: i18n Localization Engine and Dictionaries', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have 100% key parity between en and zh dictionaries', () => {
    const getKeys = (obj: Record<string, any>, prefix = ''): string[] => {
      let keys: string[] = [];
      for (const k of Object.keys(obj)) {
        const val = obj[k];
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof val === 'object' && val !== null) {
          keys = keys.concat(getKeys(val, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    };

    const enKeys = getKeys(en).sort();
    const zhKeys = getKeys(zh).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  const TestConsumer = () => {
    const { locale, setLocale, t } = useI18n();
    return (
      <div>
        <span data-testid="current-locale">{locale}</span>
        <span data-testid="translated-home">{t('dock.home')}</span>
        <span data-testid="fallback">{t('non.existent.key', 'FallbackText')}</span>
        <button onClick={() => setLocale('zh')}>SetZH</button>
        <button onClick={() => setLocale('en')}>SetEN</button>
      </div>
    );
  };

  it('should initialize with en locale and switch to zh on demand', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId('current-locale').textContent).toBe('en');
    expect(screen.getByTestId('translated-home').textContent).toBe('Home');
    expect(screen.getByTestId('fallback').textContent).toBe('FallbackText');

    // Switch to zh
    fireEvent.click(screen.getByRole('button', { name: 'SetZH' }));

    expect(screen.getByTestId('current-locale').textContent).toBe('zh');
    expect(screen.getByTestId('translated-home').textContent).toBe('首页');
    expect(localStorage.getItem('blot_locale')).toBe('zh');

    // Switch back to en
    fireEvent.click(screen.getByRole('button', { name: 'SetEN' }));
    expect(screen.getByTestId('current-locale').textContent).toBe('en');
    expect(screen.getByTestId('translated-home').textContent).toBe('Home');
    expect(localStorage.getItem('blot_locale')).toBe('en');
  });

  it('should load persisted locale from localStorage', () => {
    localStorage.setItem('blot_locale', 'zh');

    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId('current-locale').textContent).toBe('zh');
    expect(screen.getByTestId('translated-home').textContent).toBe('首页');
  });

  it('LanguageSwitcher component switches locale when clicked', () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
        <TestConsumer />
      </I18nProvider>
    );

    const switchBtn = screen.getByRole('button', { name: /switch to chinese|switch to english|language/i });
    expect(switchBtn).toBeDefined();

    fireEvent.click(switchBtn);
    expect(screen.getByTestId('current-locale').textContent).toBe('zh');

    fireEvent.click(switchBtn);
    expect(screen.getByTestId('current-locale').textContent).toBe('en');
  });

  it('generateSandboxDoc renders full Chinese content when locale is zh', async () => {
    const { generateSandboxDoc } = await import('../utils/sandboxTemplate');
    const zhDoc = generateSandboxDoc('Pantry Planner', 'clean-light', null, 'zh');
    expect(zhDoc).toContain('🥫 食材库存清单');
    expect(zhDoc).toContain('🍽️ 今晚菜谱推荐');
    expect(zhDoc).toContain('经典番茄罗勒意面');
    expect(zhDoc).toContain('实时沙箱运行中');

    const enDoc = generateSandboxDoc('Pantry Planner', 'clean-light', null, 'en');
    expect(enDoc).toContain('🥫 Pantry Inventory');
    expect(enDoc).toContain('🍽️ Dinner Suggestions');
    expect(enDoc).toContain('Live Sandbox');
  });

  it('renders App in full Chinese when blot_locale is zh', async () => {
    localStorage.setItem('blot_locale', 'zh');
    const { App } = await import('../App');
    render(<App initialDockTab="builder" />);

    // 顶部与操作栏验证
    expect(screen.getByText('工作区:')).toBeDefined();
    expect(screen.getByText('管理应用')).toBeDefined();
    expect(screen.getByText('局部编辑')).toBeDefined();

    // 会话流与工具条验证
    expect(screen.getByText('新建对话')).toBeDefined();
    expect(screen.getByText('对话与蓝图')).toBeDefined();
    expect(screen.getByText('构建一个食材食谱规划器，根据我现有的食材推荐晚餐')).toBeDefined();
    expect(screen.getByText(/欢迎使用 Blot-UI！已为您配置食材管理清单与晚餐推荐方案/)).toBeDefined();

    // 模式与输入框验证
    expect(screen.getByText('构建模式')).toBeDefined();
    expect(screen.getByText('模型: 自动')).toBeDefined();
    expect(screen.getByPlaceholderText('输入您的开发需求或提问...')).toBeDefined();

    // 工作区标签栏验证
    expect(screen.getByText('实时预览')).toBeDefined();
    expect(screen.getByText('代码检视')).toBeDefined();
    expect(screen.getByText('打包发布')).toBeDefined();
  });

  it('renders Guided Mode Home in full Chinese when blot_locale is zh', async () => {
    localStorage.setItem('blot_locale', 'zh');
    const { App } = await import('../App');
    render(<App initialDockTab="home" />);

    expect(screen.getByText('欢迎使用 Blot-UI..')).toBeDefined();
    expect(screen.getByText('Web')).toBeDefined();
    expect(screen.getByText('Desktop')).toBeDefined();
    expect(screen.getByText('App')).toBeDefined();
    expect(screen.queryByTestId('guide-blank-project-btn')).toBeNull();
    expect(screen.queryByTestId('guide-templates-btn')).toBeNull();
    expect(screen.queryByRole('button', { name: '从自定义设计开始' })).toBeNull();
    fireEvent.click(screen.getByTestId('guide-style-btn'));
    expect(screen.getByRole('dialog', { name: '设计系统预设' })).toBeDefined();
    expect(screen.queryByRole('button', { name: '从自定义设计开始' })).toBeNull();
  });

  it('renders ComponentCenterView in Chinese when locale is zh and English when locale is en', async () => {
    const { ComponentCenterView } = await import('../components/ComponentCenterView');

    // zh 测试
    const { unmount } = render(
      <I18nProvider initialLocale="zh">
        <ComponentCenterView />
      </I18nProvider>
    );

    expect(screen.getByText('插件与组件扩展')).toBeDefined();
    expect(screen.getByText('连接外部插件（MCP 服务器）赋予 AI 更多生产力工具。')).toBeDefined();
    expect(screen.getByRole('button', { name: /\+ 添加插件/i })).toBeDefined();
    expect(screen.getByText('从精选目录添加')).toBeDefined();
    expect(screen.getByText('精选推荐')).toBeDefined();
    expect(screen.getByText('AI 与多媒体')).toBeDefined();
    expect(screen.getByPlaceholderText('搜索插件目录...')).toBeDefined();

    unmount();

    // en 测试
    render(
      <I18nProvider initialLocale="en">
        <ComponentCenterView />
      </I18nProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Plugins' })).toBeDefined();
    expect(screen.getByText('Connect plugins (MCP servers) to give the AI new tools.')).toBeDefined();
    expect(screen.getByRole('button', { name: /\+ Add Plugin/i })).toBeDefined();
    expect(screen.getByText('Add from catalog')).toBeDefined();
    expect(screen.getByText('Featured')).toBeDefined();
    expect(screen.getByText('AI & Media')).toBeDefined();
    expect(screen.getByPlaceholderText('Search catalog')).toBeDefined();
  });

  it('renders StyleCenterView & StyleExtractor in Chinese when locale is zh and English when en', async () => {
    const { StyleCenterView } = await import('../components/StyleCenterView');

    const samplePresets = [
      {
        id: 'macos',
        name: 'macOS Tahoe Blue',
        primary: '#007aff',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#0f172a',
      },
    ];

    // zh 测试
    const { unmount } = render(
      <I18nProvider initialLocale="zh">
        <StyleCenterView presets={samplePresets} activeThemeId="macos" onSelectTheme={() => {}} />
      </I18nProvider>
    );

    expect(screen.getByText('风格与设计中心')).toBeDefined();
    expect(screen.getByText('风格模版库')).toBeDefined();
    expect(screen.getByText('参照物风格提取器')).toBeDefined();
    expect(screen.getByText(/可用风格模版 \(1\)/)).toBeDefined();
    expect(screen.getByText('已启用')).toBeDefined();

    // 切换至提取器
    fireEvent.click(screen.getByTestId('style-tab-extractor'));
    expect(screen.getByText('参照物输入')).toBeDefined();
    expect(screen.getByText('参照物品牌或关键词')).toBeDefined();
    expect(screen.getByPlaceholderText(/例如：Linear, Stripe, Apple/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /提取风格与设计 Prompt/i })).toBeDefined();

    unmount();

    // en 测试
    render(
      <I18nProvider initialLocale="en">
        <StyleCenterView presets={samplePresets} activeThemeId="macos" onSelectTheme={() => {}} />
      </I18nProvider>
    );

    expect(screen.getByText('Design & Style Center')).toBeDefined();
    expect(screen.getByText('Style Templates')).toBeDefined();
    expect(screen.getByText('Reference Extractor')).toBeDefined();
    expect(screen.getByText(/Available Templates \(1\)/)).toBeDefined();
    expect(screen.getByText('Active')).toBeDefined();

    fireEvent.click(screen.getByTestId('style-tab-extractor'));
    expect(screen.getByText('Reference Input')).toBeDefined();
    expect(screen.getByText('Reference Brand or Keyword')).toBeDefined();
    expect(screen.getByPlaceholderText(/e\.g\. Linear, Stripe, Apple/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Extract Style & Prompt/i })).toBeDefined();
  });
});
