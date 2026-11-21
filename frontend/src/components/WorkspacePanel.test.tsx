import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';
import { WorkspacePanel } from './WorkspacePanel';
import { I18nProvider } from '../i18n/I18nContext';

const renderWorkspace = (ui: ReactElement) => {
  return render(<I18nProvider>{ui}</I18nProvider>);
};

describe('WorkspacePanel Code Review Layout', () => {
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
});
