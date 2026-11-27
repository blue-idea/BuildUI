import { describe, it, expect } from 'vitest';
import {
  parseUserMessageForDisplay,
  buildLocalEditSubmission,
  formatClarificationAnswersPrompt,
} from './chatMessageParser';
import { extractLocalEditDraft, formatTargetedPrompt } from './targetedPrompt';
import type { InspectedElement } from '../types/inspect';

describe('chatMessageParser & local edit clean display (TDD)', () => {
  const sampleElement: InspectedElement = {
    id: 'el-btn-1',
    tagName: 'button',
    componentPath: 'src/components/Header.tsx',
    line: 8,
    className: 'px-4 py-2 bg-blue-600',
    textSnippet: 'Login',
    codeRegion: {
      filePath: 'src/components/Header.tsx',
      startLine: 8,
      endLine: 18,
      codeSnippet: `<button className="px-4 py-2 bg-blue-600">\n  <span>Login</span>\n  <svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg>\n</button>`,
      found: true,
    },
  };

  it('局部编辑展示层必须完全隐藏大段引用代码和机器指令，仅展示组件定位和修改说明', () => {
    const fullPrompt = formatTargetedPrompt(sampleElement, '把按钮改成渐变紫并加上圆角');

    const parsed = parseUserMessageForDisplay(fullPrompt);
    expect(parsed.kind).toBe('local-edit');
    if (parsed.kind === 'local-edit') {
      expect(parsed.componentPath).toBe('src/components/Header.tsx');
      expect(parsed.lineRange).toBe('L8-18');
      expect(parsed.instruction).toBe('把按钮改成渐变紫并加上圆角');
      expect(parsed.instruction).not.toContain('Original Code Snippet');
      expect(parsed.instruction).not.toContain('<svg viewBox=');
      expect(parsed.instruction).not.toContain('Requirements');
    }
  });

  it('从局部编辑提示词抽取草稿后，二次编辑指令再组装仍保留完整底层代码片段给大模型', () => {
    const fullPrompt = formatTargetedPrompt(sampleElement, 'Change background color');
    const draft = extractLocalEditDraft(fullPrompt, 'src/components/Header.tsx');

    expect(draft).not.toBeNull();
    expect(draft!.instruction).toBe('Change background color');
    expect(draft!.componentPath).toBe('src/components/Header.tsx');
    expect(draft!.lineRange).toBe('L8-18');

    const rebuilt = buildLocalEditSubmission(draft!, '把文字改成“立即开始”');
    expect(rebuilt).toContain('[Target Component: src/components/Header.tsx]');
    expect(rebuilt).toContain('[Code Region: Lines 8 to 18]');
    expect(rebuilt).toContain('<svg viewBox="0 0 24 24">');
    expect(rebuilt).toContain('[Instruction: 把文字改成“立即开始”]');
  });

  it('首页组装提示词提炼出核心需求、平台、模板和可折叠设计系统预设', () => {
    const guidePrompt = `Create a high-quality Web Application (Responsive Browser):
• Core Goal: 做一个播客管理与播放站点
• Platform: Web Application (Responsive Browser)
• Design System & Palette: Cyberpunk Neon
• Base Starter Template: React
• Implementation Requirements:
  - Clean modular React 19 + Tailwind CSS

[Design System Style Prompt]
Design System & Visual Language Specification: Cyberpunk Neon. Electric cyan (#00ffcc) on pitch black.`;

    const parsed = parseUserMessageForDisplay(guidePrompt);
    expect(parsed.kind).toBe('guide-prompt');
    if (parsed.kind === 'guide-prompt') {
      expect(parsed.coreGoal).toBe('做一个播客管理与播放站点');
      expect(parsed.platform).toBe('Web Application (Responsive Browser)');
      expect(parsed.styleName).toBe('Cyberpunk Neon');
      expect(parsed.templateName).toBe('React');
      expect(parsed.stylePrompt).toContain('Electric cyan (#00ffcc)');
    }
  });

  it('格式化并解析澄清问卷提交摘要', () => {
    const formatted = formatClarificationAnswersPrompt(
      [
        {
          id: 'q1',
          question: '核心页面模块？',
          type: 'multi_choice',
          options: ['首页看板', '播放列表'],
        },
        {
          id: 'q2',
          question: '界面风格偏好？',
          type: 'single_choice',
          options: ['卡片流', '紧凑表格'],
        },
      ],
      {
        q1: ['首页看板', '播放列表'],
        q1__custom: '加上暗色播放器条',
        q2: '卡片流',
      },
      'zh'
    );

    expect(formatted).toContain('[Clarification Answers]');
    expect(formatted).toContain('首页看板、播放列表（补充：加上暗色播放器条）');

    const parsed = parseUserMessageForDisplay(formatted);
    expect(parsed.kind).toBe('clarification-answers');
    if (parsed.kind === 'clarification-answers') {
      expect(parsed.skipped).toBe(false);
      expect(parsed.items).toHaveLength(2);
      expect(parsed.items[0].question).toBe('核心页面模块？');
      expect(parsed.items[0].answer).toContain('加上暗色播放器条');
    }
  });
});
