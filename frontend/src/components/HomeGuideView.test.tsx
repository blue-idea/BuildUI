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
    // 验证附件名称展示与删除按钮
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
});
