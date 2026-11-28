import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatMessageBubble } from './ChatMessageBubble';
import { I18nProvider } from '../i18n/I18nContext';
import { formatTargetedPrompt } from '../utils/targetedPrompt';

describe('ChatMessageBubble Component (TDD)', () => {
  it('renders local edit user message cleanly without exposing code snippets', () => {
    const fullPrompt = formatTargetedPrompt(
      {
        id: 'el-1',
        tagName: 'button',
        componentPath: 'src/components/HeroBanner.tsx',
        line: 12,
        codeRegion: {
          filePath: 'src/components/HeroBanner.tsx',
          startLine: 12,
          endLine: 25,
          codeSnippet: '<button className="px-6 py-3 bg-indigo-600">Get Started</button>',
          found: true,
        },
      },
      '改成渐变绿按钮并加大圆角'
    );

    render(
      <I18nProvider initialLocale="zh">
        <ChatMessageBubble
          sender="user"
          content={fullPrompt}
        />
      </I18nProvider>
    );

    expect(screen.getByText('局部修改')).toBeDefined();
    expect(screen.getByText(/HeroBanner\.tsx/)).toBeDefined();
    expect(screen.getByText(/L12-25/)).toBeDefined();
    expect(screen.getByText('改成渐变绿按钮并加大圆角')).toBeDefined();
    // 绝对不能暴露源码和机器指令
    expect(screen.queryByText(/Original Code Snippet/i)).toBeNull();
    expect(screen.queryByText(/Get Started/)).toBeNull();
    expect(screen.queryByText(/Use Tailwind CSS exclusively/i)).toBeNull();
  });

  it('renders guide prompt with collapsible design system preset badge', () => {
    const prompt = `Create a high-quality Web Application (Responsive Browser):
• Core Goal: 构建个人播客社区
• Platform: Web Application (Responsive Browser)
• Design System & Palette: Cyberpunk Neon
• Base Starter Template: React

[Design System Style Prompt]
Design System & Visual Language Specification: Cyberpunk Neon (#00ffcc).`;

    render(
      <I18nProvider initialLocale="zh">
        <ChatMessageBubble sender="user" content={prompt} />
      </I18nProvider>
    );

    expect(screen.getByText('构建个人播客社区')).toBeDefined();
    expect(screen.getByText('Cyberpunk Neon')).toBeDefined();
    // 默认折叠预设原文
    expect(screen.queryByText(/Visual Language Specification/i)).toBeNull();

    // 点击展开查看
    fireEvent.click(screen.getByRole('button', { name: /查看设计规范/i }));
    expect(screen.getByText(/Visual Language Specification: Cyberpunk Neon/i)).toBeDefined();
  });

  it('sanitizes accidental xml tool blocks and renders assistant markdown safely', () => {
    const onInspect = vi.fn();
    render(
      <I18nProvider initialLocale="zh">
        <ChatMessageBubble
          sender="assistant"
          content={`已完成 **首页导航** 更新：\n- 增加深色模式切换\n<dyad-write path="src/App.tsx">console.log("hidden")</dyad-write>`}
          fileChanges={[
            {
              id: 'fc-1',
              filename: 'App.tsx',
              path: 'src/App.tsx',
              status: 'completed',
            },
          ]}
          onInspectFile={onInspect}
        />
      </I18nProvider>
    );

    expect(screen.getByText('首页导航')).toBeDefined();
    expect(screen.getByText('增加深色模式切换')).toBeDefined();
    expect(screen.queryByText(/console\.log/)).toBeNull();
    expect(screen.getByText('App.tsx')).toBeDefined();
  });

  it('uses restrained Apple System Blue tokens instead of indigo or violet across user and assistant bubbles', () => {
    const prompt = `Create a high-quality Web Application (Responsive Browser):
• Core Goal: 构建个人播客社区
• Platform: Web Application (Responsive Browser)
• Design System & Palette: Cyberpunk Neon
• Base Starter Template: React

[Design System Style Prompt]
Design System & Visual Language Specification: Cyberpunk Neon.`;

    const userRender = render(
      <I18nProvider initialLocale="zh">
        <ChatMessageBubble sender="user" content={prompt} />
      </I18nProvider>
    );
    expect(userRender.container.innerHTML).toContain('border-blue-200');
    expect(userRender.container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);

    const assistantRender = render(
      <I18nProvider initialLocale="zh">
        <ChatMessageBubble
          sender="assistant"
          content={`检查 \`src/App.tsx\`：\n- 更新导航栏\n1. 优化配色`}
        />
      </I18nProvider>
    );
    expect(assistantRender.container.innerHTML).toContain('text-blue-');
    expect(assistantRender.container.innerHTML).not.toMatch(/\b(purple|indigo|violet)-\d+/);
  });
});
