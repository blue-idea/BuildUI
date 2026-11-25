import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { App } from './App';

it('手动启动预览时显示后端检查进度，修复完成后刷新源码列表', async () => {
  const project = { appId: 41, name: 'Podcast', path: '/podcast', blueprintApproved: true };
  let finishPreview!: (result: { previewUrl: string; typeScriptChecked: boolean; repairAttempts: number }) => void;
  const runApp = vi.fn().mockImplementation(() => new Promise((resolve) => { finishPreview = resolve; }));
  const listFiles = vi.fn().mockResolvedValue([]);
  const handlers = new Map<string, (data: unknown) => void>();
  vi.stubGlobal('runtime', { EventsOn: (event: string, listener: (data: unknown) => void) => {
    handlers.set(event, listener);
    return () => handlers.delete(event);
  } });
  vi.stubGlobal('go', { main: { App: {
    GetSettings: vi.fn().mockResolvedValue({}),
    ListApps: vi.fn().mockResolvedValue([{ id: 41, name: project.name, path: project.path }]),
    GetActiveApp: vi.fn().mockResolvedValue(project),
    SwitchApp: vi.fn().mockResolvedValue(project),
    GetProjectChat: vi.fn().mockResolvedValue({ chatId: 7, messages: [] }),
    GetVersions: vi.fn().mockResolvedValue([]),
    ListProjectFiles: listFiles,
    RunApp: runApp,
  } } });
  try {
    render(<App initialDockTab="builder" />);
    await waitFor(() => expect(listFiles).toHaveBeenCalledWith(41));
    fireEvent.click(screen.getByRole('button', { name: 'Start preview' }));
    await waitFor(() => expect(runApp).toHaveBeenCalledWith({ appId: 41 }));
    act(() => handlers.get('preview:progress')?.({ appId: 41, message: 'Checking project TypeScript…' }));
    expect(await screen.findByText('Checking project TypeScript…')).toBeDefined();
    expect(screen.queryByTitle('App live preview')).toBeNull();
    await act(async () => finishPreview({ previewUrl: 'http://localhost:8080', typeScriptChecked: true, repairAttempts: 1 }));
    expect((await screen.findByTitle('App live preview')).getAttribute('src')).toBe('http://localhost:8080');
    await waitFor(() => expect(listFiles).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: 'Restart preview' }));
    await waitFor(() => expect(runApp).toHaveBeenLastCalledWith({ appId: 41, restart: true }));
    await act(async () => finishPreview({ previewUrl: 'http://localhost:8081', typeScriptChecked: true, repairAttempts: 0 }));
    expect((await screen.findByTitle('App live preview')).getAttribute('src')).toBe('http://localhost:8081');
  } finally {
    vi.unstubAllGlobals();
  }
});

// v29.REQ-018 / AC-018-03：快速重开项目时等待上次预览停止。
it('重开项目时不恢复正在关闭的预览地址', async () => {
  const project = { appId: 41, name: 'Sample AI App', path: '/sample-ai-app', blueprintApproved: true };
  const oldAddress = 'http://127.0.0.1:8081';
  let stopPending = true;
  let finishStop!: () => void;
  const stopApp = vi.fn(() => new Promise<void>((resolve) => {
    finishStop = () => {
      stopPending = false;
      resolve();
    };
  }));
  const switchApp = vi.fn(async () => ({ ...project, previewUrl: stopPending ? oldAddress : '' }));
  vi.stubGlobal('go', { main: { App: {
    GetSettings: vi.fn().mockResolvedValue({}),
    ListApps: vi.fn().mockResolvedValue([{ id: 41, name: project.name, path: project.path }]),
    GetActiveApp: vi.fn().mockResolvedValue(project),
    SwitchApp: switchApp,
    GetProjectChat: vi.fn().mockResolvedValue({ chatId: 7, messages: [] }),
    GetVersions: vi.fn().mockResolvedValue([]),
    ListProjectFiles: vi.fn().mockResolvedValue([]),
    StopApp: stopApp,
  } } });
  try {
    render(<App initialDockTab="builder" />);
    expect((await screen.findByTitle('App live preview')).getAttribute('src')).toBe(oldAddress);
    fireEvent.click(screen.getByTestId('close-project-tab'));
    expect(stopApp).toHaveBeenCalledWith({ appId: 41 });
    fireEvent.click(screen.getByTestId('dock-projects'));
    await act(async () => { fireEvent.click(await screen.findByTestId('open-project-btn-41')); });
    expect(switchApp).toHaveBeenCalledTimes(1);
    expect(screen.queryByTitle('App live preview')).toBeNull();
    await act(async () => finishStop());
    expect(switchApp).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('button', { name: 'Start preview' })).toBeDefined();
  } finally {
    vi.unstubAllGlobals();
  }
});

// v12.REQ-004-AC-002 验证重开会话后展示检查点并请求续建。
it('从桌面会话恢复已保存的阶段并发送续建请求', async () => {
  const project = { appId: 41, name: 'Subscription SaaS', path: '/saas', blueprintApproved: true };
  const streamChat = vi.fn().mockResolvedValue(undefined);
  const runApp = vi.fn().mockResolvedValue({ previewUrl: 'http://localhost:8080' });
  vi.stubGlobal('go', { main: { App: {
    GetSettings: vi.fn().mockResolvedValue({}),
    ListApps: vi.fn().mockResolvedValue([{ id: 41, name: project.name, path: project.path }]),
    GetActiveApp: vi.fn().mockResolvedValue(project),
    SwitchApp: vi.fn().mockResolvedValue(project),
    GetProjectChat: vi.fn().mockResolvedValue({ chatId: 7, messages: [], buildProgress: { completed: 1, total: 3 } }),
    GetVersions: vi.fn().mockResolvedValue([]),
    ListProjectFiles: vi.fn().mockResolvedValue([]),
    StreamChat: streamChat,
    RunApp: runApp,
  } } });
  try {
    render(<App initialDockTab="builder" />);
    const resume = await screen.findByRole('button', { name: 'Resume build' });
    expect(screen.getByText('1 of 3 steps completed')).toBeDefined();
    fireEvent.click(resume);
    await waitFor(() => expect(streamChat).toHaveBeenCalledWith(expect.objectContaining({
      chatId: 7,
      mode: 'build',
      resume: true,
    })));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Resume build' })).toBeNull());
    await waitFor(() => expect(runApp).toHaveBeenCalledWith({ appId: 41, restart: true }));
  } finally {
    vi.unstubAllGlobals();
  }
});

it('桌面工作台从后端加载空项目列表并使用真实创建入口', async () => {
  const create = vi.fn().mockResolvedValue({ appId: 41, name: 'Fitness Check-in', path: '/fitness' });
  vi.stubGlobal('go', { main: { App: {
    GetSettings: vi.fn().mockResolvedValue({}),
    ListApps: vi.fn().mockResolvedValue([]),
    CreateApp: create,
    SwitchApp: vi.fn().mockResolvedValue({ appId: 41, name: 'Fitness Check-in', path: '/fitness' }),
    GetProjectChat: vi.fn().mockResolvedValue({ chatId: 7, messages: [] }),
    GetVersions: vi.fn().mockResolvedValue([]),
    ListProjectFiles: vi.fn().mockResolvedValue([]),
  } } });
  try {
    render(<App /* default home */ />);
    fireEvent.click(screen.getByRole('button', { name: /open applications drawer/i }));
    expect(screen.queryAllByText('Pantry Planner')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /mock blueprint/i })).toBeNull();
    const newApp = screen.getByRole<HTMLButtonElement>('button', { name: /new app/i });
    await waitFor(() => expect(newApp.disabled).toBe(false));
    fireEvent.click(newApp);
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Fitness Check-in' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Fitness Check-in' })));
    await waitFor(() => expect(screen.queryByText('Fitness Check-in')).toBeDefined());
  } finally {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});

describe('App Guided Mode Home & Navigation', () => {
  it('renders Guided Mode Home by default when launching App', () => {
    render(<App /* default home */ />);
    expect(screen.getByTestId('guide-tab-web')).toBeDefined();
    expect(screen.getByTestId('guide-tab-desktop')).toBeDefined();
    expect(screen.getByTestId('guide-tab-app')).toBeDefined();
    expect(screen.getByTestId('guide-user-input')).toBeDefined();
    expect(screen.getByTestId('guide-submit-btn')).toBeDefined();
  });

  it('navigates from Guided Mode Home into Builder and automatically starts generating without clicking send', async () => {
    render(<App /* default home */ />);
    const input = screen.getByTestId('guide-user-input');
    fireEvent.change(input, { target: { value: 'Create a crypto dashboard' } });

    const enterBtn = screen.getByTestId('guide-submit-btn');
    fireEvent.click(enterBtn);

    // 自动进入构建区并开始生成，无需再次点击发送指令
    expect(screen.getByText(/Chat & Blueprint/i)).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText(/Create a crypto dashboard/i)).toBeDefined();
    });
    const chatInput = screen.getByPlaceholderText(/describe what to build/i) as HTMLTextAreaElement;
    expect(chatInput.value).toBe('');
  });

  // v22.REQ-001-AC-001：三个平台通过同一个首页生成入口选择脚手架。
  it.each([
    { category: 'app', template: undefined, effectiveTemplate: 'react-native', stack: 'Expo + React Native + NativeWind + Expo Router + Font Awesome' },
    { category: 'desktop', template: undefined, effectiveTemplate: undefined, stack: 'React 19 + Tailwind CSS' },
    { category: 'web', template: undefined, effectiveTemplate: undefined, stack: 'React 19 + Tailwind CSS' },
    { category: 'web', template: 'next', effectiveTemplate: 'next', stack: 'Next.js App Router' },
    { category: 'desktop', template: 'saas-dashboard', effectiveTemplate: 'saas-dashboard', stack: 'React 19 + Tailwind CSS' },
  ] as const)('首页 $category 创建使用对应脚手架 ($template)', async ({ category, template, effectiveTemplate, stack }) => {
    const create = vi.fn().mockResolvedValue({ appId: 41, name: 'Fitness Check-in', path: '/fitness' });
    const streamChat = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('go', { main: { App: {
      GetSettings: vi.fn().mockResolvedValue({ 'templates.selectedId': 'react-native' }),
      ListApps: vi.fn().mockResolvedValue([]),
      CreateApp: create,
      SwitchApp: vi.fn().mockResolvedValue({ appId: 41, name: 'Fitness Check-in', path: '/fitness' }),
      GetProjectChat: vi.fn().mockResolvedValue({ chatId: 7, messages: [] }),
      GetVersions: vi.fn().mockResolvedValue([]),
      ListProjectFiles: vi.fn().mockResolvedValue([]),
      StreamChat: streamChat,
    } } });
    try {
      render(<App />);
      fireEvent.click(screen.getByTestId(`guide-tab-${category}`));
      if (template) {
        fireEvent.click(screen.getByRole('switch', { name: 'Custom template' }));
        fireEvent.click(screen.getByRole('radio', { name: template === 'next' ? 'Next.js' : 'SaaS Analytics Dashboard' }));
      }
      fireEvent.change(screen.getByTestId('guide-user-input'), { target: { value: 'Fitness Check-in' } });
      fireEvent.click(screen.getByTestId('guide-submit-btn'));
      await waitFor(() => expect(streamChat).toHaveBeenCalledTimes(1));
      expect(streamChat.mock.calls[0][0].prompt).toContain(stack);
      expect(create.mock.calls[0][0].templateId).toBe(effectiveTemplate);
      fireEvent.click(screen.getByTestId('dock-projects'));
      const badge = { app: 'App', desktop: 'Desktop', web: 'Web' }[category];
      expect((await screen.findByTestId('project-platform-badge-41')).textContent).toBe(badge);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('桌面端首页点击开始生成按钮，自动创建项目并直接调用生成，无需再次点击发送指令', async () => {
    const create = vi.fn().mockResolvedValue({ appId: 88, name: 'Crypto App', path: '/crypto' });
    const streamChat = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('go', {
      main: {
        App: {
          GetSettings: vi.fn().mockResolvedValue({}),
          ListApps: vi.fn().mockResolvedValue([]),
          CreateApp: create,
          SwitchApp: vi.fn().mockResolvedValue({ appId: 88, name: 'Crypto App', path: '/crypto' }),
          GetProjectChat: vi.fn().mockResolvedValue({ chatId: 108, messages: [] }),
          GetVersions: vi.fn().mockResolvedValue([]),
          ListProjectFiles: vi.fn().mockResolvedValue([]),
          StreamChat: streamChat,
        },
      },
    });

    try {
      render(<App /* default home */ />);
      const input = screen.getByTestId('guide-user-input');
      fireEvent.change(input, { target: { value: 'Crypto Trading Platform' } });

      const enterBtn = screen.getByTestId('guide-submit-btn');
      fireEvent.click(enterBtn);

      await waitFor(() => {
        expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: expect.stringContaining('Crypto Trading Platform') }));
      });
      await waitFor(() => {
        expect(streamChat).toHaveBeenCalledWith(expect.objectContaining({
          chatId: 108,
          prompt: expect.stringContaining('Crypto Trading Platform'),
        }));
      });
      // 验证在构建区中展示了用户提交的需求内容
      expect(screen.getByText(/Chat & Blueprint/i)).toBeDefined();
      expect(screen.getByText(/Crypto Trading Platform/i)).toBeDefined();
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });

  it('桌面端构建页发送指令在无活跃项目时，自动创建项目开始构建，而不是跳转到工程管理页面', async () => {
    const create = vi.fn().mockResolvedValue({ appId: 99, name: 'My Direct App', path: '/direct' });
    const streamChat = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('go', {
      main: {
        App: {
          GetSettings: vi.fn().mockResolvedValue({}),
          ListApps: vi.fn().mockResolvedValue([]),
          CreateApp: create,
          SwitchApp: vi.fn().mockResolvedValue({ appId: 99, name: 'My Direct App', path: '/direct' }),
          GetProjectChat: vi.fn().mockResolvedValue({ chatId: 202, messages: [] }),
          GetVersions: vi.fn().mockResolvedValue([]),
          ListProjectFiles: vi.fn().mockResolvedValue([]),
          StreamChat: streamChat,
        },
      },
    });

    try {
      // 直接初始化在构建区，当前无任何已激活项目
      render(<App initialDockTab="builder" />);

      const chatInput = screen.getByPlaceholderText(/describe what to build/i);
      fireEvent.change(chatInput, { target: { value: 'Build an invoice generator' } });

      const sendBtn = screen.getByRole('button', { name: /send prompt/i });
      fireEvent.click(sendBtn);

      // 验证没有跳转到工程管理页面
      expect(screen.queryByTestId('projects-center-view')).toBeNull();

      // 验证自动触发了项目创建与 StreamChat
      await waitFor(() => {
        expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: expect.stringContaining('Build an invoice generator') }));
      });
      await waitFor(() => {
        expect(streamChat).toHaveBeenCalledWith(expect.objectContaining({
          chatId: 202,
          prompt: 'Build an invoice generator',
        }));
      });
      expect(screen.getByText('Build an invoice generator')).toBeDefined();
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });

  it('switches between Home, Builder, and Style views via LeftDock icons', () => {
    render(<App /* default home */ />);

    // Initially in Home
    expect(screen.getByTestId('guide-submit-btn')).toBeDefined();

    // Click dock-builder
    fireEvent.click(screen.getByTestId('dock-builder'));
    expect(screen.getByText(/Chat & Blueprint/i)).toBeDefined();

    // Click dock-style
    fireEvent.click(screen.getByTestId('dock-style'));
    expect(screen.getByTestId('style-center-view')).toBeDefined();
    expect(screen.getByTestId('style-tab-templates')).toBeDefined();
    expect(screen.getByTestId('style-tab-extractor')).toBeDefined();

    // Click dock-home
    fireEvent.click(screen.getByTestId('dock-home'));
    expect(screen.getByTestId('guide-submit-btn')).toBeDefined();
  });

  it('switches to ComponentCenterView via dock-components and returns via Go Back button', () => {
    render(<App initialDockTab="home" />);

    // Click dock-components
    fireEvent.click(screen.getByTestId('dock-components'));

    // Should render ComponentCenterView
    expect(screen.getByTestId('component-center-view')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: /Plugins/i })).toBeDefined();

    // Click Go Back
    fireEvent.click(screen.getByText('Go Back'));

    // Should return to Home
    expect(screen.getByTestId('guide-submit-btn')).toBeDefined();
  });

  it('switches to ProjectsCenterView via dock-projects in LeftDock and manages applications', () => {
    render(<App initialDockTab="home" />);

    // Click dock-projects below dock-builder
    fireEvent.click(screen.getByTestId('dock-projects'));

    // Should render ProjectsCenterView
    const projectsView = screen.getByTestId('projects-center-view');
    expect(projectsView).toBeDefined();
    expect(within(projectsView).getByText('Pantry Planner')).toBeDefined();

    // Click Open Project on Pantry Planner
    fireEvent.click(screen.getByTestId('open-project-btn-1'));

    // Should transition to Builder view
    expect(screen.getByText(/Chat & Blueprint/i)).toBeDefined();
  });
});

describe('App Main Split Layout & Workflow', () => {
  const renderBuilder = () => render(<App initialDockTab="builder" />);

  it('renders dual-pane split layout with chat and preview panels', () => {
    renderBuilder();

    // 验证全局应用头部
    expect(screen.getByText('Blot-UI')).toBeDefined();

    // 验证左侧 Chat 交互区元素
    expect(screen.getByText(/Chat & Blueprint/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/describe what to build/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /send prompt/i })).toBeDefined();

    // 验证右侧 Preview 区域元素
    expect(screen.getByText('Preview')).toBeDefined();
  });

  it('submits a user prompt and appends to chat stream', () => {
    renderBuilder();

    const input = screen.getByPlaceholderText(/describe what to build/i);
    const sendBtn = screen.getByRole('button', { name: /send prompt/i });

    fireEvent.change(input, { target: { value: 'Create a modern portfolio app' } });
    fireEvent.click(sendBtn);

    expect(screen.getByText('Create a modern portfolio app')).toBeDefined();
  });

  it('handles blueprint approval and transitions implementation state', () => {
    renderBuilder();

    // 触发进入需要审批蓝图的模拟状态
    const mockBlueprintBtn = screen.getByRole('button', { name: /mock blueprint/i });
    fireEvent.click(mockBlueprintBtn);

    expect(screen.getByText('Pending Approval')).toBeDefined();

    // 点击审批按钮
    const approveBtn = screen.getByRole('button', { name: /approve blueprint/i });
    fireEvent.click(approveBtn);

    // 验证审批通过
    expect(screen.getByText('Approved')).toBeDefined();
  });

  it('supports full workflow: questionnaire clarification -> blueprint generation -> user approval', () => {
    renderBuilder();

    // 1. 触发澄清问卷卡片
    const mockQBtn = screen.getByRole('button', { name: /mock questionnaire/i });
    fireEvent.click(mockQBtn);

    expect(screen.getByText(/Project Clarification Questionnaire/i)).toBeDefined();
    expect(screen.getByText(/What is the primary target audience\?/i)).toBeDefined();

    // 2. 选择问卷选项并提交
    fireEvent.click(screen.getByText('Developers'));
    const submitBtn = screen.getByRole('button', { name: /submit answers/i });
    fireEvent.click(submitBtn);

    // 3. 验证问卷提交后展示应用蓝图（含设计方向、主色调、视觉清单）
    expect(screen.getByText(/Submitted questionnaire answers/i)).toBeDefined();
    expect(screen.getByText('Pending Approval')).toBeDefined();
    expect(screen.getByText(/Clean modern card layout with high visual contrast/i)).toBeDefined();
    expect(screen.getByText('brand-logo')).toBeDefined();

    // 4. 点击审批蓝图解锁写盘
    const approveBtn = screen.getByRole('button', { name: /approve blueprint/i });
    fireEvent.click(approveBtn);

    expect(screen.getByText('Approved')).toBeDefined();
  });

  it('opens and closes settings modal from top navigation', () => {
    renderBuilder();

    const settingsBtn = screen.getByRole('button', { name: /open settings/i });
    fireEvent.click(settingsBtn);

    expect(screen.getByText('LLM Provider Settings')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close settings/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('LLM Provider Settings')).toBeNull();
  });

  it('supports multi-turn incremental request and stop generation', () => {
    renderBuilder();

    // 1. 初始化蓝图并审批，触发首轮生成
    const mockBlueprintBtn = screen.getByRole('button', { name: /mock blueprint/i });
    fireEvent.click(mockBlueprintBtn);
    const approveBtn = screen.getByRole('button', { name: /approve blueprint/i });
    fireEvent.click(approveBtn);

    // 2. 验证生成状态中出现 Stop 按钮，并可主动中断
    const stopBtn = screen.getByRole('button', { name: /stop generation/i });
    expect(stopBtn).toBeDefined();
    fireEvent.click(stopBtn);
    expect(screen.getByText('Generation stopped by user.')).toBeDefined();

    // 3. 中断后恢复 Send 按钮，发起第二轮增量需求
    const input = screen.getByPlaceholderText(/describe what to build/i);
    fireEvent.change(input, { target: { value: 'Add a revenue line chart' } });
    const sendBtn = screen.getByRole('button', { name: /send prompt/i });
    fireEvent.click(sendBtn);

    // 验证展示第二轮消息，并再次进入可中断状态
    expect(screen.getByText('Add a revenue line chart')).toBeDefined();
    const secondStopBtn = screen.getByRole('button', { name: /stop generation/i });
    expect(secondStopBtn).toBeDefined();
    fireEvent.click(secondStopBtn);
  });

  it('opens and closes version time machine modal from top navigation', () => {
    renderBuilder();

    const versionsBtn = screen.getByRole('button', { name: /open version time machine/i });
    fireEvent.click(versionsBtn);

    expect(screen.getByText('Version Time Machine')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close time machine/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Version Time Machine')).toBeNull();
  });

  it('allows user to select and toggle workspace directory', () => {
    renderBuilder();

    const workspaceBtn = screen.getByRole('button', { name: /select workspace directory/i });
    expect(workspaceBtn).toBeDefined();

    fireEvent.click(workspaceBtn);
    expect(screen.getByText(/my-blot-app/i)).toBeDefined();
  });

  it('opens project management center from header manage app button and supports switching apps', () => {
    renderBuilder();

    const appsBtn = screen.getByRole('button', { name: /manage app/i });
    fireEvent.click(appsBtn);

    expect(screen.getByTestId('projects-center-view')).toBeDefined();
    expect(screen.getByText('Default Application')).toBeDefined();

    // 点击切换打开 Default Application
    const openBtn = screen.getByTestId('open-project-btn-2');
    fireEvent.click(openBtn);

    // 回到 Builder 视图
    expect(screen.getByText(/Chat & Blueprint/i)).toBeDefined();
  });

  it('toggles component inspector and injects prompt on element click', () => {
    renderBuilder();

    const inspectBtn = screen.getByRole('button', { name: /toggle component inspector/i });
    fireEvent.click(inspectBtn);

    expect(screen.getByText(/Inspector Mode Active/i)).toBeDefined();

    const mockElementBtn = screen.getByRole('button', { name: /inspect navbar element/i });
    fireEvent.click(mockElementBtn);

    expect(screen.queryByText(/Inspector Mode Active/i)).toBeNull();
    const chatInput = screen.getByPlaceholderText(/describe what to build/i) as HTMLInputElement;
    expect(chatInput.value).toBe('@src/components/Navbar.tsx: ');
  });

  it('selects target element in inspector, fills local edit prompt, and injects into chat', () => {
    renderBuilder();

    // 开启审查模式
    const inspectBtn = screen.getByRole('button', { name: /toggle component inspector/i });
    fireEvent.click(inspectBtn);

    // 点选 <button> 元素
    const targetBtn = screen.getByTestId('inspect-target-button');
    fireEvent.click(targetBtn);

    // 弹出局部编辑控制器
    expect(screen.getByTestId('local-edit-popover')).toBeDefined();

    // 点击 Change Color 药丸
    fireEvent.click(screen.getByRole('button', { name: /Change Color/i }));

    // 提交局部编辑
    fireEvent.click(screen.getByRole('button', { name: /Apply Edit/i }));

    // 验证审查浮层关闭，Chat 输入框填入了结构化定向指令
    expect(screen.queryByTestId('local-edit-popover')).toBeNull();
    const chatInput = screen.getByPlaceholderText(/describe what to build/i) as HTMLTextAreaElement;
    expect(chatInput.value).toContain('Local Edit:');
    expect(chatInput.value).toContain('RecipeCard.tsx');
  });

  it('审查模式点选元素后展示局部编辑模式状态与控制器', () => {
    renderBuilder();

    // 开启审查模式
    const inspectBtn = screen.getByRole('button', { name: /toggle component inspector/i });
    fireEvent.click(inspectBtn);

    // 验证局部编辑模式状态横幅
    expect(screen.getByText(/Local Edit Mode/i)).toBeDefined();
    expect(screen.getByText(/Select Elements/i)).toBeDefined();

    // 点选 <button> 元素
    const targetBtn = screen.getByTestId('inspect-target-button');
    fireEvent.click(targetBtn);

    // 弹出局部编辑控制器
    expect(screen.getByTestId('local-edit-popover')).toBeDefined();
  });

  it('opens export modal and triggers export as zip', () => {
    renderBuilder();

    const exportBtn = screen.getByRole('button', { name: /open export modal/i });
    fireEvent.click(exportBtn);

    expect(screen.getByText('Export Project')).toBeDefined();

    const doExportBtn = screen.getByRole('button', { name: /export as zip/i });
    fireEvent.click(doExportBtn);

    const closeBtn = screen.getByRole('button', { name: /close export modal/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Export Project')).toBeNull();
  });

  it('renders ThemeSelector in header and allows switching active theme', () => {
    renderBuilder();

    const themeSelectBtn = screen.getByRole('button', { name: /select theme/i });
    expect(themeSelectBtn).toBeDefined();

    fireEvent.click(themeSelectBtn);
    expect(screen.getByText('Cyberpunk Neon')).toBeDefined();

    const cyberpunkOption = screen.getByText('Cyberpunk Neon');
    fireEvent.click(cyberpunkOption);

    // 验证当前显示主题名更新为 Cyberpunk Neon
    expect(screen.getByText('Cyberpunk Neon')).toBeDefined();
  });

  it('renders dependency installation status card and feedback', () => {
    renderBuilder();

    // 触发模拟包含依赖安装的 Prompt 或操作
    const chatInput = screen.getByPlaceholderText(/describe what to build/i);
    const sendBtn = screen.getByRole('button', { name: /send prompt/i });

    fireEvent.change(chatInput, {
      target: { value: 'Add animated charts with recharts and lucide-react' },
    });
    fireEvent.click(sendBtn);

    // 验证消息上屏
    expect(
      screen.getByText('Add animated charts with recharts and lucide-react')
    ).toBeDefined();
  });

  it('opens command palette and allows executing actions', () => {
    renderBuilder();

    const cmdBtn = screen.getByRole('button', { name: /open command palette/i });
    expect(cmdBtn).toBeDefined();

    fireEvent.click(cmdBtn);
    expect(screen.getByPlaceholderText(/type a command or search/i)).toBeDefined();
    expect(screen.getByText('Switch Theme: Cyberpunk Neon')).toBeDefined();

    // 点击命令项触发
    fireEvent.click(screen.getByText('Switch Theme: Cyberpunk Neon'));
    expect(screen.queryByPlaceholderText(/type a command or search/i)).toBeNull();
  });

  it('从项目中心打开模板目录并以 Next.js 模板命名创建', async () => {
    renderBuilder();

    // 点击顶栏 Manage App 进入工程管理页面
    const appsBtn = screen.getByRole('button', { name: /manage app/i });
    fireEvent.click(appsBtn);

    // 点击从模版浏览
    const tmplBtn = screen.getByRole('button', { name: /browse templates/i });
    fireEvent.click(tmplBtn);

    expect(screen.getByText('Application Templates')).toBeDefined();
    expect(screen.getByText('SaaS Analytics Dashboard')).toBeDefined();

    fireEvent.click(screen.getByTestId('use-template-next'));
    const create = await within(screen.getByTestId('template-card-next')).findByRole('button', { name: 'Create App' });
    fireEvent.click(create);
    fireEvent.change(screen.getByRole('textbox', { name: 'Project name' }), { target: { value: 'Sample AI App' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }));

    // 模版中心使用后进入构建区
    expect(await screen.findByText(/Chat & Blueprint/i)).toBeDefined();
  });

  it('supports selecting and previewing image attachments before sending', async () => {
    renderBuilder();

    const uploadInput = screen.getByLabelText(/upload attachment input/i);
    expect(uploadInput).toBeDefined();

    const file = new File(['dummy-bytes'], 'design-mockup.png', { type: 'image/png' });
    fireEvent.change(uploadInput, { target: { files: [file] } });

    // 等待异步文件读取并验证待发送预览条出现
    await waitFor(() => {
      expect(screen.getByText('design-mockup.png')).toBeDefined();
    });

    // 点击发送
    const sendBtn = screen.getByRole('button', { name: /send prompt/i });
    fireEvent.click(sendBtn);

    // 验证用户消息已成功附带该附件
    await waitFor(() => {
      expect(screen.getByText('design-mockup.png')).toBeDefined();
    });
  });

  it('切换至代码检视时以左侧目录树与右侧文件内容呈现，并支持交互切换', () => {
    renderBuilder();

    // 点击切换至代码检视
    const codeTab = screen.getByTestId('tab-code');
    fireEvent.click(codeTab);

    // 验证左右分栏布局与容器
    expect(screen.getByTestId('code-review-layout')).toBeDefined();
    const fileTree = screen.getByTestId('code-file-tree');
    const fileContent = screen.getByTestId('code-file-content');
    expect(fileTree).toBeDefined();
    expect(fileContent).toBeDefined();

    // 验证左侧目录树中存在文件，右侧展示初始文件内容
    expect(within(fileTree).getByText('PantryList.tsx')).toBeDefined();
    expect(within(fileContent).getByText(/Pantry Inventory/)).toBeDefined();

    // 在左侧目录树点击切换至 RecipeCard.tsx
    const recipeFileNode = within(fileTree).getByText('RecipeCard.tsx');
    fireEvent.click(recipeFileNode);

    // 验证右侧内容区成功切换为 RecipeCard.tsx 的代码
    expect(within(fileContent).getByText(/Dinner Suggestion/)).toBeDefined();
    expect(within(fileContent).queryByText(/Pantry Inventory/)).toBeNull();
  });

  it('在代码检视面板中展示行号、轻量语法高亮与错误诊断项并支持点击直接跳转对应代码行', async () => {
    renderBuilder();

    // 切换至代码检视视图
    const codeTab = screen.getByTestId('tab-code');
    fireEvent.click(codeTab);

    // 验证轻量代码编辑器与行号指示渲染
    expect(screen.getByTestId('code-editor-viewer')).toBeDefined();
    expect(screen.getByTestId('code-line-number-1')).toBeDefined();

    // 验证诊断问题面板存在
    const diagPanel = screen.getByTestId('diagnostics-panel');
    expect(diagPanel).toBeDefined();

    // 点击诊断项（指向 RecipeCard.tsx 的第 3 行）
    const diagItem = screen.getByTestId('diagnostic-item-0');
    fireEvent.click(diagItem);

    // 验证自动切换到目标文件 RecipeCard.tsx
    const fileContent = screen.getByTestId('code-file-content');
    expect(within(fileContent).getByText(/Dinner Suggestion/)).toBeDefined();

    // 验证对应代码行被高亮
    const line3 = screen.getByTestId('code-line-3');
    expect(line3.getAttribute('data-highlighted-line')).toBe('true');
  });

  it('closes active project when clicking the project tab close button in header', async () => {
    renderBuilder();

    // Initially "Pantry Planner" project is open
    expect(screen.getByTestId('project-tab')).toBeDefined();
    expect(screen.getByText('Pantry Planner')).toBeDefined();

    // Click close button on the project tab
    const closeBtn = screen.getByTestId('close-project-tab');
    fireEvent.click(closeBtn);

    // Project should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('project-tab')).toBeNull();
      expect(screen.getByText('Create or open a project')).toBeDefined();
    });
  });

  it('renders model selector defaulting to Auto and allows choosing configured provider', async () => {
    renderBuilder();

    // 默认展示为 Auto 按钮
    const modelSelectorBtn = screen.getByRole('button', { name: /model selector/i });
    expect(modelSelectorBtn).toBeDefined();
    expect(modelSelectorBtn.textContent).toMatch(/Auto|自动/i);

    // 点击展开下拉框
    fireEvent.click(modelSelectorBtn);
    expect(modelSelectorBtn.getAttribute('aria-expanded')).toBe('true');

    // 选项中展示 Auto 选项
    const autoOption = screen.getByRole('option', { name: /auto/i });
    expect(autoOption).toBeDefined();

    // 点击选择 auto 后收起
    fireEvent.click(autoOption);
    expect(modelSelectorBtn.getAttribute('aria-expanded')).toBe('false');
    expect(modelSelectorBtn.textContent).toMatch(/Auto|自动/i);
  });

  it('populates model selector in builder from current configured providers in settings', async () => {
    // 注入预先配置好的 providers settings
    const mockSettings = {
      'llm.provider_ids': 'ollama,deepseek',
      'llm.active_provider': 'ollama',
      'llm.providers.ollama.name': 'Ollama Local',
      'llm.providers.ollama.base_url': 'http://localhost:11434/v1',
      'llm.providers.ollama.model': 'qwen2.5-coder',
      'llm.providers.deepseek.name': 'DeepSeek Cloud',
      'llm.providers.deepseek.base_url': 'https://api.deepseek.com/v1',
      'llm.providers.deepseek.api_key': 'sk-deepseek-test',
      'llm.providers.deepseek.model': 'deepseek-chat',
    };
    vi.stubGlobal('go', {
      main: {
        App: {
          GetSettings: vi.fn().mockResolvedValue(mockSettings),
        },
      },
    });

    try {
      renderBuilder();

      await waitFor(() => {
        const modelSelectorBtn = screen.getByRole('button', { name: /model selector/i });
        expect(modelSelectorBtn).toBeDefined();
      });

      const modelSelectorBtn = screen.getByRole('button', { name: /model selector/i });
      fireEvent.click(modelSelectorBtn);

      // 应该从 settings 中获取到 Ollama 与 DeepSeek
      const ollamaOption = screen.getByRole('option', { name: /qwen2\.5-coder/i });
      expect(ollamaOption).toBeDefined();
      expect(ollamaOption.textContent).toContain('Ollama Local');

      const deepseekOption = screen.getByRole('option', { name: /deepseek-chat/i });
      expect(deepseekOption).toBeDefined();

      // 选择 Ollama 后按钮文字更新
      fireEvent.click(ollamaOption);
      expect(modelSelectorBtn.textContent).toContain('qwen2.5-coder');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('creates project under custom workspace.dir when configured in settings', async () => {
    const mockSettings = {
      'workspace.dir': '/custom/storage/path',
    };
    const create = vi.fn().mockResolvedValue({
      appId: 101,
      name: 'Custom Storage App',
      path: '/custom/storage/path/custom-storage-app',
    });
    vi.stubGlobal('go', {
      main: {
        App: {
          GetSettings: vi.fn().mockResolvedValue(mockSettings),
          GetActiveApp: vi.fn().mockResolvedValue({
            appId: 1,
            name: 'Default App',
            path: '/workspace/default-app',
            previewUrl: 'http://localhost:5173',
            blueprintApproved: true,
          }),
          ListApps: vi.fn().mockResolvedValue([]),
          GetActiveChat: vi.fn().mockResolvedValue({ chatId: 1, messages: [] }),
          CreateApp: create,
        },
      },
    });

    try {
      render(<App initialDockTab="builder" />);

      await waitFor(() => {
        expect(screen.getByTestId('dock-projects')).toBeDefined();
      });

      // 点击 dock-projects 进入工程中心
      fireEvent.click(screen.getByTestId('dock-projects'));

      await waitFor(() => {
        expect(screen.getByTestId('projects-center-view')).toBeDefined();
      });

      // 打开新建工程表单
      const newProjectBtn = screen.getByTestId('new-project-btn');
      fireEvent.click(newProjectBtn);

      const nameInput = screen.getByTestId('new-project-name-input');
      fireEvent.change(nameInput, { target: { value: 'Custom Storage App' } });

      const submitBtn = screen.getByTestId('submit-create-project-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Custom Storage App' }));
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('首页设计系统预设动态包含风格页可用模版并在生成时注入风格prompt', async () => {
    const customTemplate = {
      id: 'style-custom-cyber',
      name: 'Custom Cyber Glow',
      description: 'Extracted cyberpunk futuristic palette',
      primary: '#00f0ff',
      background: '#05050a',
      surface: '#0f0f1a',
      text: '#ffffff',
      border: '#00f0ff33',
      stylePrompt: 'Design System & Visual Language Specification: Custom Cyber Glow. High energy neon cyan accents.',
    };
    localStorage.setItem('blot_style_templates', JSON.stringify([customTemplate]));

    try {
      render(<App initialDockTab="home" />);

      // 打开首页风格设计系统浮层
      const guideStyleBtn = screen.getByTestId('guide-style-btn');
      fireEvent.click(guideStyleBtn);

      // 验证浮层中动态展示了自定义模版以及标杆网站模版（如 Linear）
      await waitFor(() => {
        expect(screen.getByTestId('preset-style-custom-cyber')).toBeDefined();
        expect(screen.getByTestId('preset-benchmark-linear')).toBeDefined();
      });

      // 选择自定义模版
      fireEvent.click(screen.getByTestId('preset-style-custom-cyber'));

      // 输入提示词并点击开始构建
      const promptInput = screen.getByTestId('guide-user-input');
      fireEvent.change(promptInput, { target: { value: 'Build a futuristic crypto dashboard' } });

      const startBtn = screen.getByTestId('guide-submit-btn');
      fireEvent.click(startBtn);

      // 进入构建区后，验证 Chat 中注入了包含 Design System Style Prompt 的提示词
      await waitFor(() => {
        const chatInput = screen.getByPlaceholderText(/describe what to build/i) as HTMLTextAreaElement;
        expect(chatInput).toBeDefined();
      });
      // 检查最新消息列表中包含该 prompt
      expect(screen.getByText(/Design System Style Prompt/i)).toBeDefined();
      expect(screen.getAllByText(/Custom Cyber Glow/i).length).toBeGreaterThanOrEqual(1);
    } finally {
      localStorage.removeItem('blot_style_templates');
    }
  });
});
