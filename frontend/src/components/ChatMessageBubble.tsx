import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Palette,
  Layout,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ListChecks,
  Bot,
  FileCode2,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { FileChangeCard } from './FileChangeCard';
import { FileActionItem } from '../types/fileAction';
import {
  parseUserMessageForDisplay,
  sanitizeAssistantMessage,
} from '../utils/chatMessageParser';
import type { AttachmentItem } from '../App';

export interface ChatMessageBubbleProps {
  sender: 'user' | 'assistant';
  content: string;
  attachments?: AttachmentItem[];
  fileChanges?: FileActionItem[];
  onInspectFile?: (path: string) => void;
}

/**
 * 轻量安全文本格式化：仅处理 **加粗** 与 `行内代码`，不拼接 HTML 字符串，杜绝 XSS
 */
function renderInlineTokens(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-indigo-700 dark:bg-zinc-800 dark:text-indigo-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderFormattedAssistantText(raw: string): React.ReactNode {
  const cleaned = sanitizeAssistantMessage(raw);
  if (!cleaned) return null;
  const lines = cleaned.split(/\r?\n/);

  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed text-slate-700 dark:text-zinc-200">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-1" />;
        }
        const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={index} className="flex items-start gap-2 pl-1">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400 dark:bg-indigo-400" />
              <span className="flex-1">{renderInlineTokens(bulletMatch[1])}</span>
            </div>
          );
        }
        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (orderedMatch) {
          return (
            <div key={index} className="flex items-start gap-2 pl-1">
              <span className="mt-0.5 shrink-0 font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {orderedMatch[1]}.
              </span>
              <span className="flex-1">{renderInlineTokens(orderedMatch[2])}</span>
            </div>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap break-words">
            {renderInlineTokens(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  sender,
  content,
  attachments,
  fileChanges,
  onInspectFile,
}) => {
  const { t } = useI18n();
  const [showStyleSpec, setShowStyleSpec] = useState(false);

  if (sender === 'user') {
    const parsed = parseUserMessageForDisplay(content);

    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[94%] rounded-2xl rounded-br-md border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-violet-50/90 to-white px-4 py-3 text-[13px] leading-relaxed text-slate-800 shadow-xs dark:border-indigo-500/30 dark:from-indigo-950/75 dark:via-slate-900/90 dark:to-zinc-900 dark:text-indigo-100">
          {parsed.kind === 'local-edit' && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300">
                  <Wand2 className="h-3 w-3" />
                  <span>{t('chat.localEditTag')}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 ring-1 ring-slate-200/80 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-zinc-700">
                  <FileCode2 className="h-3 w-3 text-indigo-500" />
                  <span className="truncate max-w-[180px]">{parsed.componentPath}</span>
                </span>
                {parsed.tagName && (
                  <span className="rounded bg-indigo-100/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    &lt;{parsed.tagName}&gt;
                  </span>
                )}
                {parsed.lineRange && (
                  <span className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {parsed.lineRange}
                  </span>
                )}
              </div>
              <p className="font-medium text-slate-800 dark:text-zinc-100 whitespace-pre-wrap break-words">
                {parsed.instruction}
              </p>
            </div>
          )}

          {parsed.kind === 'guide-prompt' && (
            <div className="space-y-2.5">
              <p className="font-medium text-slate-900 dark:text-white whitespace-pre-wrap break-words">
                {parsed.coreGoal}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {parsed.platform && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                    <Layout className="h-3 w-3 text-indigo-500" />
                    <span>{parsed.platform.split('(')[0].trim()}</span>
                  </span>
                )}
                {parsed.templateName && parsed.templateName !== 'Blank Canvas' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                    <span>{t('chat.templateLabel')}: {parsed.templateName}</span>
                  </span>
                )}
                {parsed.styleName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100/80 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-300/60 dark:bg-violet-900/40 dark:text-violet-300 dark:ring-violet-700/50">
                    <Palette className="h-3 w-3" />
                    <span>{parsed.styleName}</span>
                  </span>
                )}
              </div>
              {parsed.stylePrompt && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowStyleSpec((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{showStyleSpec ? t('chat.hideStyleSpec') : t('chat.viewStyleSpec')}</span>
                    {showStyleSpec ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {showStyleSpec && (
                    <div className="mt-1.5 rounded-xl border border-indigo-200/70 bg-white/85 p-2.5 text-[11px] leading-relaxed text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-300">
                      {parsed.stylePrompt}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {parsed.kind === 'clarification-answers' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                <ListChecks className="h-3.5 w-3.5" />
                <span>{t('questionnaire.submittedTitle')}</span>
              </div>
              {parsed.skipped ? (
                <p className="text-xs text-slate-600 dark:text-zinc-300">{t('questionnaire.skippedSummary')}</p>
              ) : (
                <div className="space-y-1.5">
                  {parsed.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-white/80 px-2.5 py-1.5 text-xs ring-1 ring-indigo-100 dark:bg-zinc-800/70 dark:ring-zinc-700"
                    >
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">{item.question}</div>
                      <div className="mt-0.5 font-medium text-slate-800 dark:text-zinc-100">{item.answer}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {parsed.kind === 'blueprint-approval' && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{t('chat.approvedAndStarting')}</span>
            </div>
          )}

          {parsed.kind === 'plain' && (
            <p className="font-medium whitespace-pre-wrap break-words">{parsed.text}</p>
          )}

          {attachments && attachments.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-black/5"
                >
                  <img src={att.dataUrl} alt={att.name} className="w-28 h-20 object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 text-[9px] text-white truncate">
                    {att.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasText = sanitizeAssistantMessage(content).length > 0;
  const hasFiles = Boolean(fileChanges && fileChanges.length > 0);
  if (!hasText && !hasFiles) return null;

  return (
    <div className="flex flex-col items-start">
      {hasText && (
        <div className="max-w-[96%] rounded-2xl rounded-bl-md border border-slate-200/90 bg-white px-4 py-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Bot className="h-3 w-3" />
            </span>
            <span>{t('chat.assistantLabel')}</span>
          </div>
          {renderFormattedAssistantText(content)}
        </div>
      )}

      {hasFiles && (
        <div className="w-full mt-2 pl-2">
          {fileChanges!.map((fc) => (
            <FileChangeCard
              key={fc.id}
              item={fc}
              onInspect={onInspectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};
