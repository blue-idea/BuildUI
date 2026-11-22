import { describe, it, expect } from 'vitest';
import { formatTargetedPrompt, DEFAULT_QUICK_ACTIONS } from './targetedPrompt';
import { InspectedElement } from '../types/inspect';

describe('targetedPrompt (TDD)', () => {
  const elementWithRegion: InspectedElement = {
    id: 'el-btn-1',
    tagName: 'button',
    componentPath: 'src/components/Header.tsx',
    line: 8,
    className: 'px-4 py-2 bg-blue-600',
    textSnippet: 'Login',
    codeRegion: {
      filePath: 'src/components/Header.tsx',
      startLine: 8,
      endLine: 13,
      codeSnippet: '<button className="px-4 py-2 bg-blue-600">\n  <span>Login</span>\n</button>',
      found: true,
    },
  };

  it('当具有完整代码区域时，装配包含起止行号、原始代码块与边界隔离铁律的高结构化 Prompt', () => {
    const prompt = formatTargetedPrompt(
      elementWithRegion,
      'Change background color to purple-600 and make it rounded-full'
    );

    expect(prompt).toContain('[Target Component: src/components/Header.tsx]');
    expect(prompt).toContain('[Code Region: Lines 8 to 13]');
    expect(prompt).toContain('[Original Code Snippet:');
    expect(prompt).toContain('<span>Login</span>');
    expect(prompt).toContain('[Instruction: Change background color to purple-600 and make it rounded-full]');
    expect(prompt).toContain('Update ONLY this specific container element');
  });

  it('当缺少代码区域时，优雅降级输出带选择器与说明的定向 Prompt', () => {
    const fallbackElement: InspectedElement = {
      id: 'el-div-1',
      tagName: 'div',
      componentPath: 'src/components/Card.tsx',
      className: 'p-4 rounded-xl shadow',
      textSnippet: 'Card Body',
    };

    const prompt = formatTargetedPrompt(fallbackElement, 'Add border-t border-slate-200');

    expect(prompt).toContain('src/components/Card.tsx');
    expect(prompt).toContain('<div class="p-4 rounded-xl shadow">');
    expect(prompt).toContain('Add border-t border-slate-200');
  });

  it('快捷预设列表包含常用模板函数', () => {
    expect(DEFAULT_QUICK_ACTIONS.length).toBeGreaterThanOrEqual(4);
    const colorAction = DEFAULT_QUICK_ACTIONS.find((a) => a.id === 'change-color');
    expect(colorAction).toBeDefined();

    const template = colorAction!.promptTemplate(elementWithRegion);
    expect(template).toContain('Change background color of <button>');
  });
});
