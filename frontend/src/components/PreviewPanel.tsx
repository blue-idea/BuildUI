import React from 'react';
import { ComponentInspector } from './ComponentInspector';

export interface PreviewPanelProps {
  previewUrl: string;
  status: 'idle' | 'starting' | 'running' | 'error';
  consoleErrors?: string[];
  isInspectMode?: boolean;
  onToggleInspect?: () => void;
  onSelectComponent?: (componentPath: string, suggestedPrompt: string) => void;
  onReload: () => void;
  onStop: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  previewUrl,
  status,
  consoleErrors = [],
  isInspectMode = false,
  onToggleInspect,
  onSelectComponent,
  onReload,
  onStop,
}) => {
  return (
    <div className="flex h-full w-full flex-col border-l border-slate-800 bg-slate-900 text-slate-100">
      {/* 顶部工具栏 */}
      <div className="flex h-11 items-center justify-between border-b border-slate-800 px-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              status === 'running'
                ? 'bg-emerald-400'
                : status === 'starting'
                  ? 'animate-pulse bg-amber-400'
                  : status === 'error'
                    ? 'bg-rose-500'
                    : 'bg-slate-500'
            }`}
          />
          <span className="font-medium text-slate-300">Preview</span>
          {previewUrl && (
            <span className="truncate text-slate-400 font-mono text-[11px]">
              {previewUrl}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Toggle component inspector"
            onClick={onToggleInspect}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              isInspectMode
                ? 'bg-indigo-600 text-white font-semibold'
                : 'border border-indigo-900/50 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 hover:text-white'
            }`}
          >
            {isInspectMode ? 'Inspecting' : 'Inspect'}
          </button>
          <button
            type="button"
            aria-label="Reload preview"
            onClick={onReload}
            className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Reload
          </button>
          <button
            type="button"
            aria-label="Stop preview"
            onClick={onStop}
            className="rounded px-2 py-1 text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors"
          >
            Stop
          </button>
        </div>
      </div>

      {/* 核心展示区 */}
      <div className="relative flex-1 bg-white">
        {/* 审查模式控制条与浮层 */}
        <ComponentInspector
          isActive={isInspectMode}
          onExit={() => onToggleInspect?.()}
          onSelectComponent={(p, pr) => onSelectComponent?.(p, pr)}
        />
        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-slate-300 z-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="mt-3 text-sm">Starting preview server...</p>
          </div>
        )}

        {status === 'running' && previewUrl ? (
          <iframe
            title="App live preview"
            src={previewUrl}
            className="h-full w-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          status !== 'starting' && (
            <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-500 text-sm">
              Server not running
            </div>
          )
        )}
      </div>

      {/* 底部 Console 抽屉 */}
      {consoleErrors.length > 0 && (
        <div className="max-h-40 overflow-y-auto border-t border-rose-900/50 bg-rose-950/30 p-2 font-mono text-xs text-rose-300">
          <div className="font-semibold text-rose-400 pb-1">Console Errors:</div>
          {consoleErrors.map((err, idx) => (
            <div key={idx} className="whitespace-pre-wrap py-0.5">
              {err}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
