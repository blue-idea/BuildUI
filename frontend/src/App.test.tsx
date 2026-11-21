import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { App } from './App';

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
    render(<App />);
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

describe('App Main Split Layout & Workflow', () => {
  it('renders dual-pane split layout with chat and preview panels', () => {
    render(<App />);

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
    render(<App />);

    const input = screen.getByPlaceholderText(/describe what to build/i);
    const sendBtn = screen.getByRole('button', { name: /send prompt/i });

    fireEvent.change(input, { target: { value: 'Create a modern portfolio app' } });
    fireEvent.click(sendBtn);

    expect(screen.getByText('Create a modern portfolio app')).toBeDefined();
  });

  it('handles blueprint approval and transitions implementation state', () => {
    render(<App />);

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

  it('opens and closes settings modal from top navigation', () => {
    render(<App />);

    const settingsBtn = screen.getByRole('button', { name: /open settings/i });
    fireEvent.click(settingsBtn);

    expect(screen.getByText('LLM Provider Settings')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close settings/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('LLM Provider Settings')).toBeNull();
  });

  it('supports multi-turn incremental request and stop generation', () => {
    render(<App />);

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
    render(<App />);

    const versionsBtn = screen.getByRole('button', { name: /open version time machine/i });
    fireEvent.click(versionsBtn);

    expect(screen.getByText('Version Time Machine')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close time machine/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Version Time Machine')).toBeNull();
  });

  it('allows user to select and toggle workspace directory', () => {
    render(<App />);

    const workspaceBtn = screen.getByRole('button', { name: /select workspace directory/i });
    expect(workspaceBtn).toBeDefined();

    fireEvent.click(workspaceBtn);
    expect(screen.getByText(/my-blot-app/i)).toBeDefined();
  });

  it('opens applications drawer and supports switching apps', () => {
    render(<App />);

    const appsBtn = screen.getByRole('button', { name: /open applications drawer/i });
    fireEvent.click(appsBtn);

    expect(screen.getByText('Applications')).toBeDefined();
    expect(screen.getByText('Default Application')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close applications drawer/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Applications')).toBeNull();
  });

  it('toggles component inspector and injects prompt on element click', () => {
    render(<App />);

    const inspectBtn = screen.getByRole('button', { name: /toggle component inspector/i });
    fireEvent.click(inspectBtn);

    expect(screen.getByText(/Inspector Mode Active/i)).toBeDefined();

    const mockElementBtn = screen.getByRole('button', { name: /inspect navbar element/i });
    fireEvent.click(mockElementBtn);

    expect(screen.queryByText(/Inspector Mode Active/i)).toBeNull();
    const chatInput = screen.getByPlaceholderText(/describe what to build/i) as HTMLInputElement;
    expect(chatInput.value).toBe('@src/components/Navbar.tsx: ');
  });

  it('opens export modal and triggers export as zip', () => {
    render(<App />);

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
    render(<App />);

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
    render(<App />);

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
    render(<App />);

    const cmdBtn = screen.getByRole('button', { name: /open command palette/i });
    expect(cmdBtn).toBeDefined();

    fireEvent.click(cmdBtn);
    expect(screen.getByPlaceholderText(/type a command or search/i)).toBeDefined();
    expect(screen.getByText('Switch Theme: Cyberpunk Neon')).toBeDefined();

    // 点击命令项触发
    fireEvent.click(screen.getByText('Switch Theme: Cyberpunk Neon'));
    expect(screen.queryByPlaceholderText(/type a command or search/i)).toBeNull();
  });

  it('opens template modal from applications drawer and instantiates project', () => {
    render(<App />);

    // 打开 Apps 抽屉
    const appsBtn = screen.getByRole('button', { name: /open applications drawer/i });
    fireEvent.click(appsBtn);

    // 点击 Browse Templates
    const tmplBtn = screen.getByRole('button', { name: /browse templates/i });
    fireEvent.click(tmplBtn);

    expect(screen.getByText('Application Templates')).toBeDefined();
    expect(screen.getByText('SaaS Analytics Dashboard')).toBeDefined();

    // 点击使用模版
    const useBtns = screen.getAllByRole('button', { name: /use template/i });
    fireEvent.click(useBtns[0]);

    // 模版弹窗应关闭
    expect(screen.queryByText('Application Templates')).toBeNull();
  });

  it('supports selecting and previewing image attachments before sending', async () => {
    render(<App />);

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
    render(<App />);

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
});
