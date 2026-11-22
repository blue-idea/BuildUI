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
    expect(screen.getByText('组件审查')).toBeDefined();

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
    expect(screen.getByText('空白项目')).toBeDefined();
  });
});
