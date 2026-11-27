import type { Locale } from '../i18n/types';
import type { ClarificationQuestion } from '../services/wailsBridge';
import { extractLocalEditDraft, type PendingLocalEdit } from './targetedPrompt';

export type ParsedUserMessage =
  | {
      kind: 'local-edit';
      componentPath: string;
      lineRange?: string;
      tagName?: string;
      instruction: string;
    }
  | {
      kind: 'guide-prompt';
      coreGoal: string;
      platform?: string;
      styleName?: string;
      templateName?: string;
      stylePrompt?: string;
    }
  | {
      kind: 'clarification-answers';
      items: Array<{ question: string; answer: string }>;
      skipped: boolean;
    }
  | {
      kind: 'blueprint-approval';
    }
  | {
      kind: 'plain';
      text: string;
    };

const BLUEPRINT_APPROVAL_PREFIXES = [
  'Implement the approved blueprint and the original user request.',
  'Implement the approved blueprint',
];

/**
 * 解析用户消息供左侧会话气泡美观展示：
 * - 局部编辑：隐藏 [Original Code Snippet] 等大段代码与 [Requirements] 机器模板，仅保留定位与指令
 * - 首页引导组装提示词：提炼核心需求与平台/模板/设计系统预设标签，可折叠查看风格 Prompt
 * - 澄清回答：展示为干净的偏好摘要
 */
export function parseUserMessageForDisplay(content: string): ParsedUserMessage {
  const trimmed = content.trim();
  if (!trimmed) {
    return { kind: 'plain', text: '' };
  }

  if (BLUEPRINT_APPROVAL_PREFIXES.some((prefix) => trimmed === prefix)) {
    return { kind: 'blueprint-approval' };
  }

  if (trimmed.startsWith('[Clarification Skipped]')) {
    return { kind: 'clarification-answers', items: [], skipped: true };
  }

  if (trimmed.startsWith('[Clarification Answers]')) {
    const lines = trimmed.split(/\r?\n/).slice(1);
    const items: Array<{ question: string; answer: string }> = [];
    for (const line of lines) {
      const cleaned = line.replace(/^\d+\.\s*/, '').trim();
      if (!cleaned) continue;
      const sepIndex = cleaned.indexOf(':');
      if (sepIndex > 0) {
        items.push({
          question: cleaned.slice(0, sepIndex).trim(),
          answer: cleaned.slice(sepIndex + 1).trim(),
        });
      }
    }
    return { kind: 'clarification-answers', items, skipped: false };
  }

  if (trimmed.includes('[Target Component:') || /^@\[[^\]]+\]\s*Local Edit:/m.test(trimmed)) {
    const draft = extractLocalEditDraft(trimmed);
    if (draft) {
      return {
        kind: 'local-edit',
        componentPath: draft.componentPath,
        lineRange: draft.lineRange,
        tagName: draft.tagName,
        instruction: draft.instruction || trimmed,
      };
    }
  }

  if (/^Create a high-quality\b/m.test(trimmed) && trimmed.includes('• Core Goal:')) {
    const coreMatch = trimmed.match(/• Core Goal:\s*(.+)/);
    const platformMatch = trimmed.match(/• Platform:\s*(.+)/);
    const styleMatch = trimmed.match(/• Design System & Palette:\s*(.+)/);
    const templateMatch = trimmed.match(/• Base Starter Template:\s*(.+)/);
    const styleMarker = '[Design System Style Prompt]';
    const markerIdx = trimmed.indexOf(styleMarker);
    const stylePrompt =
      markerIdx >= 0 ? trimmed.slice(markerIdx + styleMarker.length).trim() : undefined;

    return {
      kind: 'guide-prompt',
      coreGoal: coreMatch ? coreMatch[1].trim() : trimmed,
      platform: platformMatch?.[1]?.trim(),
      styleName: styleMatch?.[1]?.trim(),
      templateName: templateMatch?.[1]?.trim(),
      stylePrompt: stylePrompt || undefined,
    };
  }

  return { kind: 'plain', text: content };
}

/**
 * 将用户在底部输入框最终确认的修改指令回填进完整局部编辑 Prompt，确保底层源码片段不丢失
 */
export function buildLocalEditSubmission(
  context: PendingLocalEdit,
  editedInstruction: string
): string {
  const cleanInstruction = editedInstruction.trim();
  const raw = context.rawPrompt;

  if (/\[Instruction:\s*[\s\S]*?\]/.test(raw)) {
    return raw.replace(/\[Instruction:\s*[\s\S]*?\]/, `[Instruction: ${cleanInstruction}]`);
  }
  if (/-\s*Directive:\s*.*/.test(raw)) {
    return raw.replace(/-\s*Directive:\s*.*/, `- Directive: ${cleanInstruction}`);
  }
  return `@${context.componentPath}: ${cleanInstruction}`;
}

/**
 * 将用户在澄清选项卡片中的回答（含可选自定义补充）组装成结构化提示词
 */
export function formatClarificationAnswersPrompt(
  questions: ClarificationQuestion[],
  answers: Record<string, string | string[]>,
  locale: Locale
): string {
  const lines = ['[Clarification Answers]'];
  questions.forEach((q, idx) => {
    const val = answers[q.id];
    const customVal = answers[`${q.id}__custom`];
    const custom = typeof customVal === 'string' ? customVal.trim() : '';
    const sep = locale === 'zh' ? '、' : ', ';
    let answerText = Array.isArray(val) ? val.filter(Boolean).join(sep) : (val || '').trim();
    if (custom) {
      const note = locale === 'zh' ? `补充：${custom}` : `Note: ${custom}`;
      answerText = answerText ? `${answerText}（${note}）` : custom;
    }
    if (!answerText) {
      answerText = locale === 'zh' ? '按默认推荐' : 'Use default recommendation';
    }
    lines.push(`${idx + 1}. ${q.question}: ${answerText}`);
  });
  return lines.join('\n');
}

/**
 * 清理助手消息中可能存在的 XML 工具标签，避免大段代码直接堆砌在左侧气泡内
 */
export function sanitizeAssistantMessage(content: string): string {
  return content
    .replace(/<dyad-write\b[^>]*>[\s\S]*?<\/dyad-write>/gi, '')
    .replace(/<dyad-add-dependency\b[^>]*>[\s\S]*?<\/dyad-add-dependency>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
