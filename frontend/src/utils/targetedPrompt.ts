import { InspectedElement, QuickActionPreset } from '../types/inspect';
import type { Locale } from '../i18n/types';

export interface PendingLocalEdit {
  componentPath: string;
  tagName?: string;
  lineRange?: string;
  instruction: string;
  /** 保留完整底层结构化提示词模板，确保提交时发给大模型的代码片段不丢失 */
  rawPrompt: string;
}

/**
 * 局部编辑常用快捷指令预设
 */
export const DEFAULT_QUICK_ACTIONS: QuickActionPreset[] = [
  {
    id: 'change-color',
    label: 'Change Color',
    promptTemplate: (el) =>
      `Change background color of <${el.tagName}> to primary brand color (e.g. blue-600) with proper contrast.`,
  },
  {
    id: 'update-text',
    label: 'Update Text',
    promptTemplate: (el) =>
      `Update text copy of <${el.tagName}> "${el.textSnippet || ''}" to modern, clear phrasing.`,
  },
  {
    id: 'adjust-spacing',
    label: 'Adjust Spacing',
    promptTemplate: (el) =>
      `Adjust padding and spacing for <${el.tagName}> to improve breathing room (e.g. py-2.5 px-4).`,
  },
  {
    id: 'rounded-full',
    label: 'Rounded Full',
    promptTemplate: (el) =>
      `Make <${el.tagName}> rounded-full with soft transition and subtle shadow.`,
  },
];

/**
 * 根据当前语言返回本地化快捷操作预设（英文保持原测试契约文案）
 */
export const getLocalizedQuickActions = (locale: Locale): QuickActionPreset[] => {
  if (locale !== 'zh') {
    return DEFAULT_QUICK_ACTIONS;
  }
  return [
    {
      id: 'change-color',
      label: '调整配色',
      promptTemplate: (el) =>
        `将 <${el.tagName}> 的背景配色调整为主品牌色并保持清晰的文字对比度。`,
    },
    {
      id: 'update-text',
      label: '修改文案',
      promptTemplate: (el) =>
        `将 <${el.tagName}> 的文案"${el.textSnippet || ''}"优化为更自然、清晰的表达。`,
    },
    {
      id: 'adjust-spacing',
      label: '调整间距',
      promptTemplate: (el) =>
        `调整 <${el.tagName}> 的内外边距与留白呼吸感（例如增加适度 padding）。`,
    },
    {
      id: 'rounded-full',
      label: '胶囊圆角',
      promptTemplate: (el) =>
        `将 <${el.tagName}> 改为圆润胶囊造型并添加柔和的阴影过渡效果。`,
    },
  ];
};

/**
 * 从结构化局部编辑提示词中提取用于前端展示与二次编辑的精简草稿（不暴露大段源码）
 */
export const extractLocalEditDraft = (
  rawPrompt: string,
  fallbackPath = ''
): PendingLocalEdit | null => {
  const trimmed = rawPrompt.trim();
  if (!trimmed) return null;

  const targetMatch = trimmed.match(/\[Target Component:\s*([^\]]+)\]/);
  const regionMatch = trimmed.match(/\[Code Region:\s*Lines\s+(\d+)\s+to\s+(\d+)\]/i);
  const instructionMatch = trimmed.match(/\[Instruction:\s*([\s\S]*?)\](?:\s*\n\[Requirements:|\s*$)/);

  if (targetMatch) {
    const componentPath = targetMatch[1].trim();
    const tagMatch = trimmed.match(/<([a-zA-Z0-9-]+)/);
    return {
      componentPath,
      tagName: tagMatch?.[1],
      lineRange: regionMatch ? `L${regionMatch[1]}-${regionMatch[2]}` : undefined,
      instruction: instructionMatch ? instructionMatch[1].trim() : '',
      rawPrompt: trimmed,
    };
  }

  const fallbackHeader = trimmed.match(/^@\[([^\]]+)\]\s*Local Edit:/m);
  if (fallbackHeader) {
    const componentPath = fallbackHeader[1].trim();
    const tagMatch = trimmed.match(/-\s*Target Element:\s*<([^\s>]+)/);
    const directiveMatch = trimmed.match(/-\s*Directive:\s*(.+)/);
    return {
      componentPath,
      tagName: tagMatch?.[1],
      instruction: directiveMatch ? directiveMatch[1].trim() : '',
      rawPrompt: trimmed,
    };
  }

  if (fallbackPath) {
    return {
      componentPath: fallbackPath,
      instruction: trimmed.replace(new RegExp(`^@${fallbackPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:?\\s*`), ''),
      rawPrompt: trimmed,
    };
  }

  return null;
};

/**
 * 组装结构化定向局部编辑 Prompt
 */
export const formatTargetedPrompt = (
  element: InspectedElement,
  instruction: string
): string => {
  if (element.codeRegion && element.codeRegion.found) {
    const { startLine, endLine, codeSnippet } = element.codeRegion;
    return [
      `[Target Component: ${element.componentPath}]`,
      `[Code Region: Lines ${startLine} to ${endLine}]`,
      `[Original Code Snippet:`,
      '```tsx',
      codeSnippet,
      '```]',
      `[Instruction: ${instruction.trim()}]`,
      `[Requirements:`,
      `1. Update ONLY this specific container element and its styling in ${element.componentPath}.`,
      `2. Keep all surrounding components, imports, and state unchanged.`,
      `3. Use Tailwind CSS exclusively.`,
      ']',
    ].join('\n');
  }

  // 缺少代码片段时的降级格式
  const parts = [
    `@[${element.componentPath}] Local Edit:`,
    `- Target Element: <${element.tagName}${element.className ? ` class="${element.className}"` : ''}>`,
  ];

  if (element.textSnippet) {
    parts.push(`- Current Text: "${element.textSnippet}"`);
  }

  parts.push(`- Directive: ${instruction.trim()}`);
  parts.push(`- Scope: Only modify this targeted element in ${element.componentPath}. Preserve other layouts.`);

  return parts.join('\n');
};
