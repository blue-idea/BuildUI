import React, { useState, useEffect } from 'react';
import { InspectedElement } from '../types/inspect';
import { DEFAULT_QUICK_ACTIONS, formatTargetedPrompt } from '../utils/targetedPrompt';
import { Wand2, X, Sparkles, CornerDownLeft } from 'lucide-react';

export interface LocalEditPopoverProps {
  element: InspectedElement;
  onCancel: () => void;
  onSubmit: (element: InspectedElement, formattedPrompt: string) => void;
}

export const LocalEditPopover: React.FC<LocalEditPopoverProps> = ({
  element,
  onCancel,
  onSubmit,
}) => {
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!instruction.trim()) return;

    const fullPrompt = formatTargetedPrompt(element, instruction.trim());
    onSubmit(element, fullPrompt);
  };

  const handleQuickAction = (templateStr: string) => {
    setInstruction(templateStr);
  };

  return (
    <div
      data-testid="local-edit-popover"
      className="absolute top-14 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 元素标题与关闭按钮 */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                &lt;{element.tagName}&gt;
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-xs">
                {element.componentPath}
              </span>
            </div>
            {element.textSnippet && (
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                &quot;{element.textSnippet}&quot;
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 快捷操作药丸 */}
      <div className="py-3 flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Quick:
        </span>
        {DEFAULT_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleQuickAction(action.promptTemplate(element))}
            className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-950/50 dark:hover:text-blue-300 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700 transition-colors cursor-pointer"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* 局部提示词输入表单 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            autoFocus
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe what to change for this specific element (e.g. Change color, add icon, make rounded)..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none transition-all"
          />
          <span className="absolute right-2.5 bottom-2.5 text-[10px] text-slate-400 dark:text-zinc-500 select-none">
            Ctrl+Enter
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel (Esc)
          </button>

          <button
            type="submit"
            disabled={!instruction.trim()}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Apply Edit</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};
