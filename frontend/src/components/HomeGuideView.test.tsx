import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HomeGuideView } from './HomeGuideView';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  );
};

describe('HomeGuideView - Minimalist Icon & Tab Guided Studio', () => {
  it('定制模板默认关闭，开启后单选，关闭后恢复平台默认', () => {
    const onStartBuilding = vi.fn();
    renderWithProviders(<HomeGuideView onStartBuilding={onStartBuilding} />);

    const toggle = screen.getByRole('switch', { name: 'Custom template' });
    const style = screen.getByTestId('guide-style-btn');
    expect(toggle.compareDocumentPosition(style) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const submit = screen.getByTestId<HTMLButtonElement>('guide-submit-btn');
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(screen.queryByRole('dialog', { name: 'Custom template' })).toBeNull();
    fireEvent.click(submit);
    expect(onStartBuilding.mock.lastCall?.[1].template).toBe('blank');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    const trigger = screen.getByRole('button', { name: 'Starter template' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(submit.disabled).toBe(true);
    fireEvent.keyDown(screen.getByTestId('guide-user-input'), { key: 'Enter' });
    expect(onStartBuilding).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('radio', { name: 'SaaS Analytics Dashboard' }));
    const next = screen.getByRole('radio', { name: 'Next.js' });
    fireEvent.click(next);
    expect(screen.getAllByRole('radio', { checked: true })).toEqual([next]);
    fireEvent.keyDown(next, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Custom template' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(submit);
    expect(onStartBuilding).toHaveBeenLastCalledWith(
      expect.stringContaining('Next.js App Router'), expect.objectContaining({ template: 'next' }), expect.anything(),
    );

    fireEvent.click(screen.getByTestId('guide-blank-project-btn'));
    expect(onStartBuilding.mock.lastCall?.[1].template).toBe('blank');
    fireEvent.click(trigger);
    expect(screen.getByRole('radio', { name: 'Next.js', checked: true })).toBeDefined();
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(screen.queryByRole('dialog', { name: 'Custom template' })).toBeNull();
    fireEvent.click(submit);
    expect(onStartBuilding.mock.lastCall?.[1].template).toBe('blank');
  });

  it('切换到 App 后清除不兼容的 Next.js 并提供 Expo', () => {
    const onStartBuilding = vi.fn();
    renderWithProviders(<HomeGuideView onStartBuilding={onStartBuilding} />);

    fireEvent.click(screen.getByRole('switch', { name: 'Custom template' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Next.js' }));
    fireEvent.click(screen.getByTestId('guide-tab-desktop'));
    expect(screen.getByRole('radio', { name: 'Next.js', checked: true })).toBeDefined();
    fireEvent.click(screen.getByTestId('guide-tab-app'));
    expect(screen.queryByRole('radio', { checked: true })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Next.js' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'React Native (Expo)' }));
    fireEvent.click(screen.getByTestId('guide-submit-btn'));
    expect(onStartBuilding.mock.lastCall?.[1]).toMatchObject({ template: 'react-native', category: 'app' });
  });

  it('点击外部关闭定制模板菜单，打开设计系统预设时只显示其菜单', () => {
    renderWithProviders(<HomeGuideView onStartBuilding={vi.fn()} />);
    const toggle = screen.getByRole('switch', { name: 'Custom template' });
    fireEvent.click(toggle);
    const trigger = screen.getByRole('button', { name: 'Starter template' });
    expect(screen.getByRole('dialog', { name: 'Custom template' })).toBeDefined();
    fireEvent.mouseDown(screen.getByTestId('guide-user-input'));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId('guide-style-btn'));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByTestId('guide-style-filter-all')).toBeDefined();
  });

  it('只选择可用于新项目的已启用插件，并提交开关和多选状态', async () => {
    const onStartBuilding = vi.fn();
    vi.stubGlobal('go', { main: { App: { ListPlugins: vi.fn().mockResolvedValue([
      { id: 11, name: 'Mobbin', enabled: true },
      { id: 12, name: 'Custom Notes', enabled: true },
      { id: 13, name: 'Disabled plugin', enabled: false },
      { id: 14, name: 'Other project plugin', enabled: true, appId: 8 },
    ]) } } });
    try {
      renderWithProviders(<HomeGuideView onStartBuilding={onStartBuilding} />);
      const toggle = screen.getByRole('switch', { name: 'Automatically use plugins' });
      expect((toggle as HTMLInputElement).checked).toBe(false);
      fireEvent.click(toggle);
      fireEvent.click(await screen.findByRole('checkbox', { name: 'Mobbin' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Custom Notes' }));
      expect(screen.queryByRole('checkbox', { name: 'Disabled plugin' })).toBeNull();
      expect(screen.queryByRole('checkbox', { name: 'Other project plugin' })).toBeNull();
      fireEvent.change(screen.getByTestId('guide-user-input'), { target: { value: 'Build a dashboard' } });
      fireEvent.click(screen.getByTestId('guide-submit-btn'));
      expect(onStartBuilding).toHaveBeenLastCalledWith(
        expect.stringContaining('Build a dashboard'), expect.objectContaining({ pluginAutomation: { enabled: true, pluginIds: [11, 12] } }), expect.anything(),
      );
      fireEvent.click(toggle);
      expect(screen.queryByRole('group', { name: 'Enabled plugins' })).toBeNull();
      fireEvent.click(screen.getByTestId('guide-submit-btn'));
      expect(onStartBuilding).toHaveBeenLastCalledWith(
        expect.any(String), expect.objectContaining({ pluginAutomation: { enabled: false, pluginIds: [] } }), expect.anything(),
      );
      fireEvent.click(toggle);
      expect((screen.getByRole('checkbox', { name: 'Mobbin' }) as HTMLInputElement).checked).toBe(true);
    } finally { vi.unstubAllGlobals(); }
  });

  it('renders minimalist welcome header and top quick action buttons', () => {
    const onStartBuilding = vi.fn();
    const onBrowseTemplates = vi.fn();

    renderWithProviders(
      <HomeGuideView
        onStartBuilding={onStartBuilding}
        onBrowseTemplates={onBrowseTemplates}
      />
    );

    // 验证欢迎标题与右侧轻量胶囊按钮
    expect(screen.getByText(/Welcome to Blot-UI/i)).toBeDefined();
    expect(screen.getByTestId('guide-blank-project-btn')).toBeDefined();
    expect(screen.getByTestId('guide-templates-btn')).toBeDefined();

    // 点击空白项目直接进入构建区
    fireEvent.click(screen.getByTestId('guide-blank-project-btn'));
    expect(onStartBuilding).toHaveBeenCalledWith(
      expect.stringContaining('Blank Canvas'),
      expect.objectContaining({ template: 'blank' }),
      expect.anything()
    );
  });

  it('renders platform category tabs (App, Desktop, Web) and updates textarea placeholder', () => {
    renderWithProviders(<HomeGuideView onStartBuilding={vi.fn()} />);

    const appTab = screen.getByTestId('guide-tab-app');
    const desktopTab = screen.getByTestId('guide-tab-desktop');
    const webTab = screen.getByTestId('guide-tab-web');

    expect(appTab).toBeDefined();
    expect(desktopTab).toBeDefined();
    expect(webTab).toBeDefined();

    const input = screen.getByTestId('guide-user-input') as HTMLTextAreaElement;

    // 切换到 App
    fireEvent.click(appTab);
    expect(input.placeholder).toMatch(/native mobile app/i);

    // 切换到 Web
    fireEvent.click(webTab);
    expect(input.placeholder).toMatch(/web application/i);

    // 切换到 Desktop
    fireEvent.click(desktopTab);
    expect(input.placeholder).toMatch(/desktop/i);
  });

  it('opens style presets popover when clicking the palette icon and selects a preset', () => {
    renderWithProviders(<HomeGuideView onStartBuilding={vi.fn()} />);

    const styleBtn = screen.getByTestId('guide-style-btn');
    expect(styleBtn).toBeDefined();

    // 点击打开风格设计系统弹层
    fireEvent.click(styleBtn);

    // 浮层说明及预设项
    expect(screen.getByText(/auto-select based on your prompt/i)).toBeDefined();
    expect(screen.getByTestId('preset-bauhaus')).toBeDefined();
    expect(screen.getByTestId('preset-alexandria')).toBeDefined();
    expect(screen.getByTestId('preset-neon-tokyo')).toBeDefined();

    // 选择 Bauhaus
    fireEvent.click(screen.getByTestId('preset-bauhaus'));

    // 验证激活状态或显示
    expect(screen.getByTestId('guide-selected-style-badge').textContent).toContain('Bauhaus');
  });

  it('dynamically renders style templates passed from style page and injects stylePrompt into assembled prompt', () => {
    const onStartBuilding = vi.fn();
    const customTemplates = [
      {
        id: 'style-linear-mock',
        name: 'Linear Dark Tech',
        description: 'Obsidian minimalist dark mode with purple glow',
        primary: '#5e6ad2',
        background: '#08090a',
        stylePrompt: 'Design System & Visual Language Specification: Obsidian dark minimalism with #5e6ad2 accent.',
      },
      {
        id: 'style-stripe-mock',
        name: 'Stripe Fintech Glow',
        description: 'Clean modern fintech with cyan and blur gradients',
        primary: '#635bff',
        background: '#ffffff',
        stylePrompt: 'Design System & Visual Language Specification: Ultra-clean fintech typography and #635bff highlights.',
      },
    ];

    renderWithProviders(
      <HomeGuideView
        onStartBuilding={onStartBuilding}
        styleTemplates={customTemplates}
      />
    );

    const styleBtn = screen.getByTestId('guide-style-btn');
    fireEvent.click(styleBtn);

    // 确保动态风格模版项展示
    expect(screen.getByTestId('preset-style-linear-mock')).toBeDefined();
    expect(screen.getByText('Linear Dark Tech')).toBeDefined();
    expect(screen.getByTestId('preset-style-stripe-mock')).toBeDefined();
    expect(screen.getByText('Stripe Fintech Glow')).toBeDefined();

    // 选择 Linear Dark Tech
    fireEvent.click(screen.getByTestId('preset-style-linear-mock'));
    expect(screen.getByTestId('guide-selected-style-badge').textContent).toContain('Linear Dark Tech');

    // 输入需求并点击开始构建
    const input = screen.getByTestId('guide-user-input');
    fireEvent.change(input, { target: { value: 'Build an issue tracking workspace' } });

    const submitBtn = screen.getByTestId('guide-submit-btn');
    fireEvent.click(submitBtn);

    // 验证 prompt 中注入了 [Design System Style Prompt] 及对应内容
    expect(onStartBuilding).toHaveBeenCalledTimes(1);
    const calledPrompt = onStartBuilding.mock.calls[0][0];
    const calledOptions = onStartBuilding.mock.calls[0][1];

    expect(calledPrompt).toContain('[Design System Style Prompt]');
    expect(calledPrompt).toContain('Obsidian dark minimalism with #5e6ad2 accent');
    expect(calledOptions.style).toBe('style-linear-mock');
  });

  it('notifies onSelectStyleId when a dynamic template is chosen', () => {
    const onSelectStyleId = vi.fn();
    const customTemplates = [
      {
        id: 'style-test-1',
        name: 'Cyber Minimal',
        primary: '#00ffcc',
        background: '#0a0a0f',
        stylePrompt: 'Neon accents and dark slate panels',
      },
    ];

    renderWithProviders(
      <HomeGuideView
        onStartBuilding={vi.fn()}
        styleTemplates={customTemplates}
        onSelectStyleId={onSelectStyleId}
      />
    );

    fireEvent.click(screen.getByTestId('guide-style-btn'));
    fireEvent.click(screen.getByTestId('preset-style-test-1'));

    expect(onSelectStyleId).toHaveBeenCalledWith('style-test-1');
  });

  it('replaces Balanced dropdown with ModelSelector and triggers onSelectModel', () => {
    const onSelectModel = vi.fn();
    renderWithProviders(
      <HomeGuideView
        onStartBuilding={vi.fn()}
        selectedModel="auto"
        onSelectModel={onSelectModel}
      />
    );

    // 验证原有的 Balanced 选项已不存在
    expect(screen.queryByText(/^balanced$/i)).toBeNull();

    // 验证渲染了 ModelSelector
    const modelBtn = screen.getByLabelText('Model selector');
    expect(modelBtn).toBeDefined();

    // 点击打开模型选择菜单
    fireEvent.click(modelBtn);
    expect(screen.getByRole('listbox')).toBeDefined();
  });

  it('supports attachment upload via + button and renders preview chips with remove capability', async () => {
    const onStartBuilding = vi.fn();
    renderWithProviders(<HomeGuideView onStartBuilding={onStartBuilding} />);

    // 验证 + 按钮作为附件上传触发器
    const uploadBtn = screen.getByTestId('guide-upload-btn');
    expect(uploadBtn).toBeDefined();

    const fileInput = screen.getByTestId('guide-upload-input') as HTMLInputElement;
    expect(fileInput).toBeDefined();

    // 模拟文件上传
    const file = new File(['mock content'], 'sample-mockup.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true,
    });
    fireEvent.change(fileInput);

    // 模拟 FileReader 触发完成预览展示
    const chipText = await screen.findByText('sample-mockup.png');
    expect(chipText).toBeDefined();

    // 提交时附件应携带传递至构建区
    const input = screen.getByTestId('guide-user-input');
    fireEvent.change(input, { target: { value: 'Design based on attached mockup' } });

    const submitBtn = screen.getByTestId('guide-submit-btn');
    fireEvent.click(submitBtn);

    expect(onStartBuilding).toHaveBeenCalledWith(
      expect.stringContaining('Design based on attached mockup'),
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ name: 'sample-mockup.png' }),
      ])
    );
  });

  it('guarantees NO component library section is rendered', () => {
    renderWithProviders(<HomeGuideView onStartBuilding={vi.fn()} />);

    // 严格确保无大面积组件库卡片/复选框（符合用户备注：不需要加入组件库）
    expect(screen.queryByTestId('comp-navbar')).toBeNull();
    expect(screen.queryByTestId('comp-sidebar')).toBeNull();
    expect(screen.queryByTestId('comp-charts')).toBeNull();
    expect(screen.queryByTestId('comp-datatable')).toBeNull();
  });

  it('submits assembled prompt and enters builder when clicking submit button', () => {
    const onStartBuilding = vi.fn();
    renderWithProviders(<HomeGuideView onStartBuilding={onStartBuilding} />);

    const input = screen.getByTestId('guide-user-input');
    fireEvent.change(input, { target: { value: 'Personal finance wealth management dashboard' } });

    const submitBtn = screen.getByTestId('guide-submit-btn');
    fireEvent.click(submitBtn);

    expect(onStartBuilding).toHaveBeenCalledTimes(1);
    expect(onStartBuilding).toHaveBeenCalledWith(
      expect.stringContaining('Personal finance wealth management dashboard'),
      expect.objectContaining({
        userInput: 'Personal finance wealth management dashboard',
      }),
      expect.anything()
    );
  });

  it('retrieves and displays configured providers in model selector on home page from settings', () => {
    const onSelectModel = vi.fn();
    const mockSettings = {
      'llm.provider_ids': 'ollama,custom_deepseek',
      'llm.providers.ollama.name': 'Ollama Local Host',
      'llm.providers.ollama.base_url': 'http://localhost:11434/v1',
      'llm.providers.ollama.model': 'qwen2.5-coder:7b',
      'llm.providers.custom_deepseek.name': 'DeepSeek Production',
      'llm.providers.custom_deepseek.base_url': 'https://api.deepseek.com/v1',
      'llm.providers.custom_deepseek.api_key': 'sk-test',
      'llm.providers.custom_deepseek.model': 'deepseek-coder-v2',
    };

    renderWithProviders(
      <HomeGuideView
        onStartBuilding={vi.fn()}
        selectedModel="auto"
        onSelectModel={onSelectModel}
        settings={mockSettings}
      />
    );

    // 打开首页的模型选择下拉菜单
    const modelBtn = screen.getByLabelText('Model selector');
    fireEvent.click(modelBtn);

    // 应该列出当前设置的 Provider 及其模型
    const ollamaOption = screen.getByRole('option', { name: /qwen2\.5-coder:7b/i });
    const deepseekOption = screen.getByRole('option', { name: /deepseek-coder-v2/i });
    expect(ollamaOption).toBeDefined();
    expect(deepseekOption).toBeDefined();

    // 点击选择 Ollama 模型
    fireEvent.click(ollamaOption);
    expect(onSelectModel).toHaveBeenCalledWith('provider:ollama');
  });

  it('filters style presets by app, desktop, and web category pills inside popover', () => {
    const customStyleTemplates = [
      {
        id: 'style-app-fitness',
        name: 'Fitness Pro App',
        appType: 'app' as const,
        description: 'Dark OLED mobile fitness tracker',
        primary: '#10b981',
        background: '#000000',
        stylePrompt: 'Mobile App design system for fitness',
      },
      {
        id: 'style-desktop-studio',
        name: 'Studio Desktop Station',
        appType: 'desktop' as const,
        description: 'Multi-column desktop editor layout',
        primary: '#6366f1',
        background: '#1e1e24',
        stylePrompt: 'Desktop workstation design system',
      },
      {
        id: 'style-web-saas',
        name: 'Cloud SaaS Web',
        appType: 'web' as const,
        description: 'Clean responsive web dashboard',
        primary: '#3b82f6',
        background: '#ffffff',
        stylePrompt: 'Web responsive SaaS design system',
      },
    ];

    renderWithProviders(
      <HomeGuideView
        onStartBuilding={vi.fn()}
        styleTemplates={customStyleTemplates}
      />
    );

    // 点击调色板打开风格选择 Popover
    fireEvent.click(screen.getByTestId('guide-style-btn'));

    // 验证分类筛选胶囊存在且文案为简短文字，顺序依次为 Web、Desktop、App
    const filterAll = screen.getByTestId('guide-style-filter-all');
    const filterWeb = screen.getByTestId('guide-style-filter-web');
    const filterDesktop = screen.getByTestId('guide-style-filter-desktop');
    const filterApp = screen.getByTestId('guide-style-filter-app');
    expect(filterAll).toBeDefined();
    expect(filterWeb.textContent).toBe('Web');
    expect(filterDesktop.textContent).toBe('Desktop');
    expect(filterApp.textContent).toBe('App');
    expect(filterWeb.compareDocumentPosition(filterDesktop) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(filterDesktop.compareDocumentPosition(filterApp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // 默认或点击 All 时展示所有风格
    fireEvent.click(filterAll);
    expect(screen.getByTestId('preset-style-app-fitness')).toBeDefined();
    expect(screen.getByTestId('preset-style-desktop-studio')).toBeDefined();
    expect(screen.getByTestId('preset-style-web-saas')).toBeDefined();

    // 点击 App 分类筛选
    fireEvent.click(filterApp);
    expect(screen.getByTestId('preset-style-app-fitness')).toBeDefined();
    expect(screen.queryByTestId('preset-style-desktop-studio')).toBeNull();
    expect(screen.queryByTestId('preset-style-web-saas')).toBeNull();

    // 点击 Desktop 分类筛选
    fireEvent.click(filterDesktop);
    expect(screen.getByTestId('preset-style-desktop-studio')).toBeDefined();
    expect(screen.queryByTestId('preset-style-app-fitness')).toBeNull();
    expect(screen.queryByTestId('preset-style-web-saas')).toBeNull();

    // 点击 Web 分类筛选
    fireEvent.click(filterWeb);
    expect(screen.getByTestId('preset-style-web-saas')).toBeDefined();
    expect(screen.queryByTestId('preset-style-app-fitness')).toBeNull();
    expect(screen.queryByTestId('preset-style-desktop-studio')).toBeNull();

    // 验证每个预设项展示对应的形态标识
    expect(screen.getByTestId('preset-badge-style-web-saas')).toBeDefined();
  });
});
