import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';
import { WorkspacePanel } from './WorkspacePanel';
import { I18nProvider } from '../i18n/I18nContext';

const renderWorkspace = (ui: ReactElement) => {
  return render(<I18nProvider>{ui}</I18nProvider>);
};

describe('WorkspacePanel Code Review Layout', () => {
  it('使用真实手机视口预览 App，并支持切换到窄屏', () => {
    renderWorkspace(<WorkspacePanel nativePreview previewUrl="http://localhost:8081" />);
    const frame = screen.getByTitle('App live preview');
    expect(frame.getAttribute('width')).toBe('390');
    expect(frame.getAttribute('height')).toBe('844');
    fireEvent.change(screen.getByRole('combobox', { name: 'Phone preview size' }), { target: { value: 'compact' } });
    expect(screen.getByTitle('App live preview')).toBe(frame);
    expect(frame.getAttribute('width')).toBe('360');
  });

  it('Web 预览沿用全宽画布', () => {
    renderWorkspace(<WorkspacePanel previewUrl="http://localhost:8080" />);
    expect(screen.getByTitle('App live preview').hasAttribute('width')).toBe(false);
    expect(screen.queryByRole('combobox', { name: 'Phone preview size' })).toBeNull();
  });

  const mockFiles = [
    {
      path: 'src/components/PantryList.tsx',
      content: 'export const PantryList = () => <div>Pantry</div>;',
    },
    {
      path: 'src/components/RecipeCard.tsx',
      content: 'export const RecipeCard = () => <div>Recipe</div>;',
    },
    {
      path: 'README.md',
      content: '# Pantry App',
    },
  ];

  it('在代码检视模式下以“左侧文件目录树，右侧文件内容”分栏布局渲染', () => {
    renderWorkspace(
      <WorkspacePanel
        activeView="code"
        files={mockFiles}
      />
    );

    // 验证包含代码检视专用布局容器
    const layout = screen.getByTestId('code-review-layout');
    expect(layout).toBeDefined();

    // 验证左侧目录树容器与右侧内容容器存在
    const treeContainer = screen.getByTestId('code-file-tree');
    const contentContainer = screen.getByTestId('code-file-content');
    expect(treeContainer).toBeDefined();
    expect(contentContainer).toBeDefined();

    // 验证左侧树中呈现文件名，右侧展示初始选中的文件内容
    expect(screen.getByText('PantryList.tsx')).toBeDefined();
    expect(screen.getByText(/export const PantryList/)).toBeDefined();
  });

  it('点击左侧文件树中的其他文件，右侧内容区切换为该文件代码', () => {
    renderWorkspace(
      <WorkspacePanel
        activeView="code"
        files={mockFiles}
      />
    );

    // 点击切换至 README.md
    const readmeFile = screen.getByText('README.md');
    fireEvent.click(readmeFile);

    // 右侧内容区应切换显示 README.md 的内容
    expect(screen.getByText('# Pantry App')).toBeDefined();
    expect(screen.queryByText(/export const PantryList/)).toBeNull();
  });

  it('响应 focusedFile 变化自动切换当前文件并展示内容', () => {
    const { rerender } = renderWorkspace(
      <WorkspacePanel
        activeView="code"
        files={mockFiles}
        focusedFile="src/components/PantryList.tsx"
      />
    );

    expect(screen.getByText(/export const PantryList/)).toBeDefined();

    rerender(
      <I18nProvider>
        <WorkspacePanel
          activeView="code"
          files={mockFiles}
          focusedFile="src/components/RecipeCard.tsx"
        />
      </I18nProvider>
    );

    expect(screen.getByText(/export const RecipeCard/)).toBeDefined();
  });

  it('支持 desktop 异步 onReadFile 加载并处理错误状态', async () => {
    const onReadFileMock = vi.fn().mockRejectedValue(new Error('Failed to read file from disk'));

    renderWorkspace(
      <WorkspacePanel
        activeView="code"
        sourcePaths={['src/App.tsx']}
        onReadFile={onReadFileMock}
      />
    );

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Failed to read file from disk');
    });
  });

  it('在代码检视区渲染轻量代码编辑器与行号指示，并支持语法高亮', () => {
    renderWorkspace(
      <WorkspacePanel
        activeView="code"
        files={mockFiles}
      />
    );

    // 验证 CodeEditorViewer 与行号指示栏渲染
    const codeViewer = screen.getByTestId('code-editor-viewer');
    expect(codeViewer).toBeDefined();

    const line1 = screen.getByTestId('code-line-number-1');
    expect(line1).toBeDefined();
    expect(line1.textContent?.trim()).toBe('1');
  });

  it('当存在诊断项时展示诊断问题面板，并支持点击同文件错误跳转高亮对应代码行', () => {
    const mockDiagnostics = [
      {
        file: 'src/components/PantryList.tsx',
        line: 1,
        column: 14,
        message: 'Type error: Cannot find module or its corresponding type declarations.',
        severity: 'error' as const,
      },
    ];

    renderWorkspace(
      <WorkspacePanel
        activeView="code"
        files={mockFiles}
        diagnostics={mockDiagnostics}
      />
    );

    // 验证诊断问题面板存在并展示错误信息
    const diagPanel = screen.getByTestId('diagnostics-panel');
    expect(diagPanel).toBeDefined();
    expect(within(diagPanel).getByText(/Cannot find module/)).toBeDefined();

    // 点击诊断项
    const diagItem = screen.getByTestId('diagnostic-item-0');
    fireEvent.click(diagItem);

    // 验证对应行号被高亮
    const line1 = screen.getByTestId('code-line-1');
    expect(line1.getAttribute('data-highlighted-line')).toBe('true');
  });

  it('点击跨文件诊断项时自动切换当前文件并高亮目标代码行', () => {
    const mockDiagnostics = [
      {
        file: 'src/components/RecipeCard.tsx',
        line: 1,
        column: 14,
        message: 'Unused import in RecipeCard',
        severity: 'warning' as const,
      },
    ];

    renderWorkspace(
      <WorkspacePanel
        activeView="code"
        files={mockFiles}
        diagnostics={mockDiagnostics}
      />
    );

    // 初始状态下展示 PantryList.tsx
    expect(screen.getByText(/export const PantryList/)).toBeDefined();

    // 点击属于 RecipeCard.tsx 的诊断项
    const diagItem = screen.getByTestId('diagnostic-item-0');
    fireEvent.click(diagItem);

    // 验证自动切换至 RecipeCard.tsx 并展示对应内容
    expect(screen.getByText(/export const RecipeCard/)).toBeDefined();
    expect(screen.queryByText(/export const PantryList/)).toBeNull();

    // 验证 RecipeCard 中的第 1 行被高亮
    const line1 = screen.getByTestId('code-line-1');
    expect(line1.getAttribute('data-highlighted-line')).toBe('true');
  });

  it('代码检视区右侧容器与诊断面板遵循全局明暗主题配色类名', () => {
    const mockDiagnostics = [
      {
        file: 'src/components/PantryList.tsx',
        line: 1,
        column: 14,
        message: 'Type error: Cannot find module',
        severity: 'error' as const,
      },
    ];

    renderWorkspace(
      <WorkspacePanel
        activeView="code"
        files={mockFiles}
        diagnostics={mockDiagnostics}
      />
    );

    // 验证右侧内容区具备浅色与深色自适应类
    const content = screen.getByTestId('code-file-content');
    expect(content.className).toContain('bg-white');
    expect(content.className).toContain('dark:bg-zinc-950');

    // 验证诊断问题面板具备浅色与深色自适应边框与背景类
    const diagPanel = screen.getByTestId('diagnostics-panel');
    expect(diagPanel.className).toContain('bg-slate-50');
    expect(diagPanel.className).toContain('dark:bg-zinc-950');
    expect(diagPanel.className).toContain('border-slate-200');
    expect(diagPanel.className).toContain('dark:border-zinc-800');
  });

  it('在审查模式下接收沙箱 buildui:element-selected 自动解析源码定位并在点击 Jump to Code 时切换代码视图', async () => {
    const onViewChangeMock = vi.fn();
    const onReadFileMock = vi.fn().mockResolvedValue(`import React from 'react';\n\nexport const Navbar = () => {\n  return (\n    <nav className="p-4 bg-white">\n      <button className="px-4 py-2">Click</button>\n    </nav>\n  );\n};`);

    renderWorkspace(
      <WorkspacePanel
        activeView="preview"
        isInspectMode={true}
        onViewChange={onViewChangeMock}
        onReadFile={onReadFileMock}
        sourcePaths={['src/components/Navbar.tsx']}
        previewUrl="http://localhost:8080"
      />
    );

    // 触发沙箱 postMessage
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'buildui:element-selected',
          element: {
            id: 'el-1',
            tagName: 'button',
            componentPath: 'src/components/Navbar.tsx',
            line: 6,
            className: 'px-4 py-2',
            textSnippet: 'Click',
          },
        },
        origin: 'http://localhost:8080',
      })
    );

    // 验证弹出 LocalEditPopover，并展示行号
    await waitFor(() => {
      expect(screen.getByTestId('local-edit-popover')).toBeDefined();
    });
    expect(screen.getByText(/Lines 6-6|Line 6/i)).toBeDefined();

    // 点击 Jump to Code 按钮
    const jumpBtn = screen.getByRole('button', { name: /jump to code/i });
    fireEvent.click(jumpBtn);

    // 验证调用了 onViewChange('code')
    expect(onViewChangeMock).toHaveBeenCalledWith('code');
  });

  describe('TASK-064: 拟真地址栏交互输入与路由跳转', () => {
    it('渲染可交互的地址输入框并呈现当前地址', () => {
      renderWorkspace(
        <WorkspacePanel
          activeView="preview"
          previewUrl="http://localhost:8080"
        />
      );

      const addressInput = screen.getByTestId('browser-address-input') as HTMLInputElement;
      expect(addressInput).toBeDefined();
      expect(addressInput.value).toBe('http://localhost:8080');
    });

    it('手动输入相对路由 /dashboard 回车后驱动 iframe 跳转到目标路径', () => {
      renderWorkspace(
        <WorkspacePanel
          activeView="preview"
          previewUrl="http://localhost:8080"
        />
      );

      const addressInput = screen.getByTestId('browser-address-input') as HTMLInputElement;
      fireEvent.change(addressInput, { target: { value: '/dashboard' } });
      fireEvent.submit(addressInput.closest('form')!);

      const iframe = screen.getByTitle('App live preview') as HTMLIFrameElement;
      expect(iframe.src).toBe('http://localhost:8080/dashboard');
      expect(addressInput.value).toBe('http://localhost:8080/dashboard');
    });

    it('手动输入无前导斜杠路径 settings 自动规范化为 /settings 并跳转', () => {
      renderWorkspace(
        <WorkspacePanel
          activeView="preview"
          previewUrl="http://localhost:8080"
        />
      );

      const addressInput = screen.getByTestId('browser-address-input') as HTMLInputElement;
      fireEvent.change(addressInput, { target: { value: 'settings' } });
      fireEvent.submit(addressInput.closest('form')!);

      const iframe = screen.getByTitle('App live preview') as HTMLIFrameElement;
      expect(iframe.src).toBe('http://localhost:8080/settings');
    });

    it('按下 Escape 键时恢复原始地址并退出编辑态', () => {
      renderWorkspace(
        <WorkspacePanel
          activeView="preview"
          previewUrl="http://localhost:8080"
        />
      );

      const addressInput = screen.getByTestId('browser-address-input') as HTMLInputElement;
      fireEvent.change(addressInput, { target: { value: '/unsaved-route' } });
      expect(addressInput.value).toBe('/unsaved-route');

      fireEvent.keyDown(addressInput, { key: 'Escape' });
      expect(addressInput.value).toBe('http://localhost:8080');
    });

    it('同步沙箱路由到地址栏并保留当前 iframe 文档', async () => {
      renderWorkspace(
        <WorkspacePanel
          activeView="preview"
          previewUrl="http://localhost:8080"
        />
      );

      const addressInput = screen.getByTestId('browser-address-input') as HTMLInputElement;

      // 模拟沙箱内路由变迁
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'buildui:route-changed',
            pathname: '/products/42',
            url: 'http://localhost:8080/products/42',
          },
          origin: 'http://localhost:8080',
        })
      );

      await waitFor(() => {
        expect(addressInput.value).toBe('http://localhost:8080/products/42');
      });
      expect(screen.getByTitle('App live preview').getAttribute('src')).toBe('http://localhost:8080');
    });

    it('激活审查模式时在预览区展示局部编辑覆盖层，支持点选元素并呈现盒模型图解卡片', () => {
      const handleToggle = vi.fn();
      renderWorkspace(
        <WorkspacePanel
          activeView="preview"
          previewUrl="http://localhost:8080"
          isInspectMode={true}
          onToggleInspect={handleToggle}
        />
      );

      // 验证局部编辑模式横幅展示
      expect(screen.getByText(/Local Edit Mode/i)).toBeDefined();
      expect(screen.getByText(/Select Elements/i)).toBeDefined();

      // 点选按钮元素
      const targetPill = screen.getByTestId('inspect-target-button');
      fireEvent.click(targetPill);

      // 验证弹出局部编辑控制器
      expect(screen.getByTestId('local-edit-popover')).toBeDefined();
    });
  });

  describe('Blueprint Pending Guidance State', () => {
    const mockPendingBlueprint = {
      chatId: 42,
      appName: 'Travel Explorer',
      designDirection: 'OLED dark theme',
      primaryColor: '#ff2d55',
      themeId: 'default',
      visuals: [],
      approved: false,
    };

    it('当蓝图未审批时展示引导卡片与批准按钮，并不加载未生成的预览 iframe', () => {
      const onApprove = vi.fn();
      renderWorkspace(
        <WorkspacePanel
          previewUrl="http://localhost:8081"
          blueprint={mockPendingBlueprint}
          onApproveBlueprint={onApprove}
        />
      );

      const guidance = screen.getByTestId('blueprint-pending-guidance');
      expect(guidance).toBeDefined();
      expect(screen.getByText('Travel Explorer')).toBeDefined();
      expect(screen.getByText(/Blueprint Pending/i)).toBeDefined();
      expect(screen.queryByTitle('App live preview')).toBeNull();

      const approveBtn = screen.getByTestId('preview-approve-blueprint-btn');
      fireEvent.click(approveBtn);
      expect(onApprove).toHaveBeenCalledWith(42);
    });

    it('当蓝图审批通过后，引导卡片消失并恢复渲染正常预览 iframe', () => {
      renderWorkspace(
        <WorkspacePanel
          previewUrl="http://localhost:8081"
          blueprint={{ ...mockPendingBlueprint, approved: true }}
        />
      );

      expect(screen.queryByTestId('blueprint-pending-guidance')).toBeNull();
      expect(screen.getByTitle('App live preview')).toBeDefined();
    });
  });

  it('交互高亮与主操作统一收拢为 Apple System Blue，不包含紫色类名', () => {
    const { container } = renderWorkspace(
      <WorkspacePanel
        activeView="preview"
        previewUrl="http://localhost:8081"
        blueprint={{
          chatId: 9,
          appName: 'Demo',
          designDirection: 'Clean',
          primaryColor: '#007aff',
          themeId: 'default',
          visuals: [],
          approved: false,
        }}
        onApproveBlueprint={vi.fn()}
      />
    );

    const previewTab = screen.getByTestId('tab-preview');
    expect(previewTab.className).toContain('blue');
    expect(previewTab.className).not.toMatch(/purple|indigo|violet/);

    const approveBtn = screen.getByTestId('preview-approve-blueprint-btn');
    expect(approveBtn.className).toContain('bg-blue-600');
    expect(approveBtn.className).not.toMatch(/purple|indigo|violet/);
    expect(container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);

    const publishRender = renderWorkspace(
      <WorkspacePanel activeView="publish" onPublish={vi.fn()} />
    );
    expect(publishRender.container.innerHTML).toContain('bg-blue-600');
    expect(publishRender.container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);
  });

  // v33.REQ-003-AC-001：构建区预览工具栏截图为封面按钮
  describe('Project Screenshot Capture Button (v33 TDD)', () => {
    it('预览就绪时展示截图按钮，点击后触发 onCaptureScreenshot 并携带当前地址与 iframe 捕获器', async () => {
      const onCaptureScreenshot = vi.fn().mockResolvedValue(undefined);
      renderWorkspace(
        <WorkspacePanel
          activeView="preview"
          previewUrl="http://127.0.0.1:5173/dashboard"
          onCaptureScreenshot={onCaptureScreenshot}
        />
      );

      const captureBtn = screen.getByTestId('capture-screenshot-btn') as HTMLButtonElement;
      expect(captureBtn.disabled).toBe(false);
      fireEvent.click(captureBtn);

      await waitFor(() => expect(onCaptureScreenshot).toHaveBeenCalledTimes(1));
      expect(onCaptureScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          previewUrl: 'http://127.0.0.1:5173/dashboard',
          captureFrame: expect.any(Function),
        })
      );
    });

    it('无可用预览或正在截图中时禁用截图按钮', () => {
      const { rerender } = renderWorkspace(
        <WorkspacePanel
          activeView="preview"
          previewUrl=""
          onCaptureScreenshot={vi.fn()}
        />
      );

      expect((screen.getByTestId('capture-screenshot-btn') as HTMLButtonElement).disabled).toBe(true);

      rerender(
        <I18nProvider>
          <WorkspacePanel
            activeView="preview"
            previewUrl="http://127.0.0.1:5173"
            isCapturingScreenshot={true}
            onCaptureScreenshot={vi.fn()}
          />
        </I18nProvider>
      );

      expect((screen.getByTestId('capture-screenshot-btn') as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
