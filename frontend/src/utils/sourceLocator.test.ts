import { describe, it, expect } from 'vitest';
import { locateCodeRegion } from './sourceLocator';

describe('sourceLocator (TDD)', () => {
  const sampleComponent = `import React from 'react';

export const Header = () => {
  return (
    <header className="p-4 bg-slate-900 text-white">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">App Title</h1>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
        >
          <span>Login</span>
        </button>
      </div>
      <input type="text" placeholder="Search..." className="mt-2 border rounded" />
    </header>
  );
};
`;

  it('根据目标行号定位多行嵌套外层容器的完整起始与闭合标签范围', () => {
    // header 开始于第 5 行，结束于第 16 行
    const result = locateCodeRegion({
      sourceCode: sampleComponent,
      filePath: 'src/components/Header.tsx',
      line: 5,
      tagName: 'header',
    });

    expect(result.found).toBe(true);
    expect(result.startLine).toBe(5);
    expect(result.endLine).toBe(16);
    expect(result.codeSnippet).toContain('<header className="p-4 bg-slate-900 text-white">');
    expect(result.codeSnippet).toContain('</header>');
  });

  it('精确定位多行按钮容器的完整范围（第 8 行至第 13 行）', () => {
    const result = locateCodeRegion({
      sourceCode: sampleComponent,
      filePath: 'src/components/Header.tsx',
      line: 8,
      tagName: 'button',
    });

    expect(result.found).toBe(true);
    expect(result.startLine).toBe(8);
    expect(result.endLine).toBe(13);
    expect(result.codeSnippet).toContain('<button');
    expect(result.codeSnippet).toContain('</button>');
  });

  it('正确识别单行自闭合标签（第 15 行 input）', () => {
    const result = locateCodeRegion({
      sourceCode: sampleComponent,
      filePath: 'src/components/Header.tsx',
      line: 15,
      tagName: 'input',
    });

    expect(result.found).toBe(true);
    expect(result.startLine).toBe(15);
    expect(result.endLine).toBe(15);
    expect(result.codeSnippet).toBe(
      '      <input type="text" placeholder="Search..." className="mt-2 border rounded" />'
    );
  });

  it('当行号指向标签属性行时，自动回溯找到容器起始行并定位完整闭合标签', () => {
    // 第 10 行是 className="px-4 py-2..." 属性行，应自动识别为第 8 行开始至第 13 行结束的 button
    const result = locateCodeRegion({
      sourceCode: sampleComponent,
      filePath: 'src/components/Header.tsx',
      line: 10,
      tagName: 'button',
    });

    expect(result.found).toBe(true);
    expect(result.startLine).toBe(8);
    expect(result.endLine).toBe(13);
  });

  it('当缺失行号时，根据 tagName 与文本摘要语义搜索降级定位', () => {
    const result = locateCodeRegion({
      sourceCode: sampleComponent,
      filePath: 'src/components/Header.tsx',
      tagName: 'h1',
      textSnippet: 'App Title',
    });

    expect(result.found).toBe(true);
    expect(result.startLine).toBe(7);
    expect(result.endLine).toBe(7);
    expect(result.codeSnippet).toContain('<h1 className="text-xl font-bold">App Title</h1>');
  });

  it('对于空代码或无效查询，优雅返回降级结果而不抛出异常', () => {
    const result = locateCodeRegion({
      sourceCode: '',
      filePath: 'src/components/Unknown.tsx',
      line: 999,
      tagName: 'nonexistent',
    });

    expect(result.found).toBe(false);
    expect(result.startLine).toBe(1);
    expect(result.endLine).toBe(1);
  });
});
