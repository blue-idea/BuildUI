import React, { useState, useEffect } from 'react';
import { InspectedElement } from '../types/inspect';
import { formatTargetedPrompt, getLocalizedQuickActions } from '../utils/targetedPrompt';
import { useI18n } from '../i18n/I18nContext';
import { Wand2, X, Sparkles, CornerDownLeft, Code2, ChevronDown, ChevronUp, Layers } from 'lucide-react';

export interface LocalEditPopoverProps {
  element: InspectedElement;
  onCancel: () => void;
  onSubmit: (element: InspectedElement, formattedPrompt: string) => void;
  onJumpToCode?: (filePath: string, line?: number) => void;
}

export const LocalEditPopover: React.FC<LocalEditPopoverProps> = ({
  element,
  onCancel,
  onSubmit,
  onJumpToCode,
}) => {
  const { locale, t } = useI18n();
  const quickActions = getLocalizedQuickActions(locale);
  const [instruction, setInstruction] = useState('');
  const [showSnippet, setShowSnippet] = useState(false);

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

  const lineRangeText = element.codeRegion
    ? `Lines ${element.codeRegion.startLine}-${element.codeRegion.endLine}`
    : element.line
      ? `Line ${element.line}`
      : null;

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
              {lineRangeText && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {lineRangeText}
                </span>
              )}
            </div>
            {element.textSnippet && (
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                &quot;{element.textSnippet}&quot;
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onJumpToCode && (
            <button
              type="button"
              onClick={() => onJumpToCode(element.componentPath, element.codeRegion?.startLine ?? element.line)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 border border-purple-200/60 dark:border-purple-800 transition-colors cursor-pointer"
              title="Open in Code View"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{t('localEdit.jumpToCode')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 锁定的源代码区域折叠卡片 */}
      {element.codeRegion?.codeSnippet && (
        <div className="py-2.5 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('localEdit.targetCodeRegion')}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowSnippet(!showSnippet)}
              className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              {showSnippet ? (
                <>
                  <span>{t('localEdit.hideCode')}</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>{t('localEdit.viewCode')}</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
          {showSnippet && (
            <pre className="mt-2 max-h-36 overflow-auto p-2.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed border border-slate-800">
              <code>{element.codeRegion.codeSnippet}</code>
            </pre>
          )}
        </div>
      )}

      {/* 仿浏览器 DevTools 盒模型图解卡片 (Box Model Diagram) */}
      {element.boxModel && (
        <div
          data-testid="box-model-diagram"
          className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/80 dark:border-zinc-800 font-mono text-[11px]"
        >
          <div className="flex items-center justify-between pb-2 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('localEdit.boxModel')}</span>
            </span>
            <span className="text-slate-400">Chrome DevTools Style</span>
          </div>

          <div
            data-testid="box-model-margin"
            className="relative p-2 rounded-xl border border-dashed border-amber-500/70 bg-amber-500/10 text-amber-700 dark:text-amber-300 flex flex-col items-center gap-1"
          >
            <div className="w-full flex justify-between items-center text-[10px] select-none text-amber-600 dark:text-amber-400">
              <span className="font-sans text-[9px] uppercase tracking-wider font-semibold">margin</span>
              <span>{element.boxModel.margin.top}</span>
              <span />
            </div>

            <div className="w-full flex items-center justify-between gap-1.5">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 select-none">
                {element.boxModel.margin.left}
              </span>

              {/* Border Box */}
              <div
                data-testid="box-model-border"
                className="flex-1 p-2 rounded-lg border border-yellow-500/80 bg-yellow-500/15 text-yellow-800 dark:text-yellow-200 flex flex-col items-center gap-1"
              >
                <div className="w-full flex justify-between items-center text-[10px] select-none text-yellow-700 dark:text-yellow-400">
                  <span className="font-sans text-[9px] uppercase tracking-wider font-semibold">border</span>
                  <span>{element.boxModel.border.top}</span>
                  <span />
                </div>

                <div className="w-full flex items-center justify-between gap-1.5">
                  <span className="text-[10px] text-yellow-700 dark:text-yellow-400 select-none">
                    {element.boxModel.border.left}
                  </span>

                  {/* Padding Box */}
                  <div
                    data-testid="box-model-padding"
                    className="flex-1 p-2 rounded-md border border-emerald-500/70 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 flex flex-col items-center gap-1"
                  >
                    <div className="w-full flex justify-between items-center text-[10px] select-none text-emerald-700 dark:text-emerald-400">
                      <span className="font-sans text-[9px] uppercase tracking-wider font-semibold">padding</span>
                      <span>{element.boxModel.padding.top}</span>
                      <span />
                    </div>

                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 select-none">
                        {element.boxModel.padding.left}
                      </span>

                      {/* Content Box */}
                      <div
                        data-testid="box-model-content"
                        className="px-3 py-1 rounded bg-blue-500/25 border border-blue-500/80 text-blue-700 dark:text-blue-300 font-bold text-[11px] text-center select-none shadow-2xs whitespace-nowrap"
                      >
                        {Math.round(element.boxModel.content.width)} × {Math.round(element.boxModel.content.height)}
                      </div>

                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 select-none">
                        {element.boxModel.padding.right}
                      </span>
                    </div>

                    <div className="w-full text-center text-[10px] text-emerald-700 dark:text-emerald-400 select-none">
                      {element.boxModel.padding.bottom}
                    </div>
                  </div>

                  <span className="text-[10px] text-yellow-700 dark:text-yellow-400 select-none">
                    {element.boxModel.border.right}
                  </span>
                </div>

                <div className="w-full text-center text-[10px] text-yellow-700 dark:text-yellow-400 select-none">
                  {element.boxModel.border.bottom}
                </div>
              </div>

              <span className="text-[10px] text-amber-600 dark:text-amber-400 select-none">
                {element.boxModel.margin.right}
              </span>
            </div>

            <div className="w-full text-center text-[10px] text-amber-600 dark:text-amber-400 select-none">
              {element.boxModel.margin.bottom}
            </div>
          </div>
        </div>
      )}

      {/* 快捷操作药丸 */}
      <div className="py-3 flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          {t('localEdit.quickLabel')}
        </span>
        {quickActions.map((action) => (
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
            placeholder={t('localEdit.placeholder')}
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
            {t('localEdit.cancelEsc')}
          </button>

          <button
            type="submit"
            disabled={!instruction.trim()}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{t('localEdit.applyEdit')}</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};
