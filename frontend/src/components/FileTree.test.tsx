import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileTree } from './FileTree';

describe('FileTree Component', () => {
  const samplePaths = [
    'package.json',
    'README.md',
    'src/App.tsx',
    'src/index.css',
    'src/components/Navbar.tsx',
    'src/components/Footer.tsx',
  ];

  it('正确解析多层级路径并渲染目录与文件节点', () => {
    render(
      <FileTree
        paths={samplePaths}
        selectedPath="src/App.tsx"
        onSelectPath={vi.fn()}
      />
    );

    // 验证根级文件与顶级目录存在
    expect(screen.getByText('package.json')).toBeDefined();
    expect(screen.getByText('README.md')).toBeDefined();
    expect(screen.getByText('src')).toBeDefined();
  });

  it('自动展开选中文件所在的祖先目录并将选中文件高亮', () => {
    render(
      <FileTree
        paths={samplePaths}
        selectedPath="src/components/Navbar.tsx"
        onSelectPath={vi.fn()}
      />
    );

    // 祖先目录 src 与 components 应自动展开，Navbar.tsx 应可见
    expect(screen.getByText('Navbar.tsx')).toBeDefined();

    const selectedNode = screen.getByRole('treeitem', { name: /Navbar\.tsx/i });
    expect(selectedNode.getAttribute('aria-selected')).toBe('true');
  });

  it('点击目录节点可折叠和重新展开子文件', () => {
    render(
      <FileTree
        paths={samplePaths}
        selectedPath="src/App.tsx"
        onSelectPath={vi.fn()}
      />
    );

    // 初始状态下 src 已展开，App.tsx 可见
    expect(screen.getByText('App.tsx')).toBeDefined();

    // 点击 src 目录进行折叠
    const srcDirNode = screen.getByRole('button', { name: /toggle-dir-src/i });
    fireEvent.click(srcDirNode);

    // 折叠后 App.tsx 不再在文档流中显示
    expect(screen.queryByText('App.tsx')).toBeNull();

    // 再次点击展开
    fireEvent.click(srcDirNode);
    expect(screen.getByText('App.tsx')).toBeDefined();
  });

  it('点击文件节点时触发 onSelectPath 回调并携带完整路径', () => {
    const handleSelect = vi.fn();
    render(
      <FileTree
        paths={samplePaths}
        selectedPath="package.json"
        onSelectPath={handleSelect}
      />
    );

    const readmeNode = screen.getByText('README.md');
    fireEvent.click(readmeNode);

    expect(handleSelect).toHaveBeenCalledWith('README.md');
  });

  it('当路径列表为空时展示暂无文件提示', () => {
    render(
      <FileTree
        paths={[]}
        onSelectPath={vi.fn()}
      />
    );

    expect(screen.getByText(/No files/i)).toBeDefined();
  });
});
