import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeEditorViewer } from './CodeEditorViewer';

describe('CodeEditorViewer Component (TDD)', () => {
  const sampleCode = [
    'import React from "react";',
    '// Simple counter component',
    'export const Counter = () => {',
    '  const count = 42;',
    '  return <div className="counter">{count}</div>;',
    '};',
  ].join('\n');

  it('渲染每行对应的行号指示栏，并具有不可选中文本特性与等宽对齐', () => {
    render(<CodeEditorViewer code={sampleCode} filePath="src/Counter.tsx" />);

    // 验证每一行号独立存在（1 到 6）
    for (let i = 1; i <= 6; i++) {
      const lineNum = screen.getByTestId(`code-line-number-${i}`);
      expect(lineNum).toBeDefined();
      expect(lineNum.textContent?.trim()).toBe(String(i));
      expect(lineNum.className).toContain('select-none');
    }
  });

  it('分词引擎针对关键字、字符串、注释与 JSX 语法正确着色', () => {
    render(<CodeEditorViewer code={sampleCode} filePath="src/Counter.tsx" />);

    // 验证关键字（import, export, const, return）渲染为对应的 syntax-keyword 元素
    const keywords = screen.getAllByTestId('token-keyword');
    expect(keywords.length).toBeGreaterThanOrEqual(4);
    const keywordTexts = keywords.map((k) => k.textContent);
    expect(keywordTexts).toContain('import');
    expect(keywordTexts).toContain('export');
    expect(keywordTexts).toContain('const');
    expect(keywordTexts).toContain('return');

    // 验证字符串 ("react")
    const strings = screen.getAllByTestId('token-string');
    expect(strings.some((s) => s.textContent?.includes('"react"'))).toBe(true);

    // 验证注释 (// Simple counter component)
    const comments = screen.getAllByTestId('token-comment');
    expect(comments.some((c) => c.textContent?.includes('Simple counter component'))).toBe(true);

    // 验证 JSX 标签/属性
    const tags = screen.getAllByTestId('token-tag');
    expect(tags.some((t) => t.textContent?.includes('div'))).toBe(true);
  });

  it('传入 highlightedLine 时为目标代码行赋予高亮属性与居中滚动', () => {
    // 模拟 Element.prototype.scrollIntoView
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const { rerender } = render(
      <CodeEditorViewer code={sampleCode} filePath="src/Counter.tsx" highlightedLine={4} />
    );

    const line4 = screen.getByTestId('code-line-4');
    expect(line4.getAttribute('data-highlighted-line')).toBe('true');
    expect(scrollIntoViewMock).toHaveBeenCalled();

    // 切换至第 2 行高亮
    rerender(
      <CodeEditorViewer code={sampleCode} filePath="src/Counter.tsx" highlightedLine={2} />
    );

    const line2 = screen.getByTestId('code-line-2');
    expect(line2.getAttribute('data-highlighted-line')).toBe('true');
    expect(line4.getAttribute('data-highlighted-line')).toBeNull();
  });

  it('当某行存在诊断错误时，行号栏与代码行展示错误标记', () => {
    const mockDiagnostics = [
      {
        file: 'src/Counter.tsx',
        line: 4,
        column: 9,
        message: 'Cannot find name "count"',
        severity: 'error' as const,
      },
    ];

    render(
      <CodeEditorViewer
        code={sampleCode}
        filePath="src/Counter.tsx"
        diagnostics={mockDiagnostics}
      />
    );

    // 第 4 行应包含错误标志
    const line4 = screen.getByTestId('code-line-4');
    expect(line4.getAttribute('data-has-error')).toBe('true');

    const errorMarker = screen.getByTestId('line-error-marker-4');
    expect(errorMarker).toBeDefined();
  });

  it('支持点击行号触发 onLineClick 回调', () => {
    const handleLineClick = vi.fn();
    render(
      <CodeEditorViewer
        code={sampleCode}
        filePath="src/Counter.tsx"
        onLineClick={handleLineClick}
      />
    );

    const lineNum3 = screen.getByTestId('code-line-number-3');
    fireEvent.click(lineNum3);
    expect(handleLineClick).toHaveBeenCalledWith(3);
  });

  it('支持当前主题（深色、浅色）配色自适应，具备明暗色样式类', () => {
    render(<CodeEditorViewer code={sampleCode} filePath="src/Counter.tsx" />);

    const viewer = screen.getByTestId('code-editor-viewer');
    // 验证外层容器同时具备浅色与深色类名
    expect(viewer.className).toContain('bg-white');
    expect(viewer.className).toContain('dark:bg-zinc-950');

    // 验证行号指示栏具备明暗自适应边框与底色
    const lineGutter = screen.getByTestId('code-line-number-1');
    expect(lineGutter.className).toContain('border-slate-200');
    expect(lineGutter.className).toContain('dark:border-zinc-800');

    // 验证分词 Token 同时具备浅色与深色颜色定义
    const keywordToken = screen.getAllByTestId('token-keyword')[0];
    expect(keywordToken.className).toContain('text-purple-600');
    expect(keywordToken.className).toContain('dark:text-purple-400');
  });
});
