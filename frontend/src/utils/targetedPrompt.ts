import { InspectedElement, QuickActionPreset } from '../types/inspect';

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
 * 组装结构化定向局部编辑 Prompt
 */
export const formatTargetedPrompt = (
  element: InspectedElement,
  instruction: string
): string => {
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
