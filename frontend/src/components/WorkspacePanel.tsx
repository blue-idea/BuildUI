import React, { useEffect, useRef, useState } from 'react';
import {
  Eye,
  Code2,
  Globe,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  RotateCw,
  Terminal,
  ChevronDown,
  ChevronUp,
  Loader2,
  Scan,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { FileTree } from './FileTree';
import { CodeEditorViewer } from './CodeEditorViewer';
import { ComponentInspector } from './ComponentInspector';
import type { DiagnosticItem } from '../services/wailsBridge';

export type WorkspaceView = 'preview' | 'code' | 'publish';

export interface WorkspacePanelProps {
  activeView?: WorkspaceView;
  onViewChange?: (view: WorkspaceView) => void;
  isLoading?: boolean;
  previewUrl?: string;
  previewDoc?: string;
  previewKey?: number;
  files?: Array<{ path: string; content: string }>;
  sourcePaths?: string[];
  sourceRevision?: number;
  focusedFile?: string;
  onReadFile?: (path: string) => Promise<string>;
  systemLogs?: string[];
  diagnostics?: DiagnosticItem[];
  onSelectDiagnostic?: (diagnostic: DiagnosticItem) => void;
  isInspectMode?: boolean;
  onToggleInspect?: () => void;
  onSelectComponent?: (path: string, prompt: string) => void;
  onReload?: () => void;
  onOpenExternal?: () => void;
  onPublish?: () => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  activeView = 'preview',
  onViewChange,
  isLoading = false,
  previewUrl = 'http://localhost:5173',
  previewDoc,
  previewKey,
  files = [],
  sourcePaths,
  sourceRevision,
  focusedFile,
  onReadFile,
  systemLogs = [],
  diagnostics = [],
  onSelectDiagnostic,
  isInspectMode = false,
  onToggleInspect,
  onSelectComponent,
  onReload,
  onOpenExternal,
  onPublish,
}) => {
  const { t } = useI18n();
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isProblemsOpen, setIsProblemsOpen] = useState(true);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path || '');
  const [source, setSource] = useState<{ path: string; text: string; error: boolean } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeFile = files.find((f) => f.path === selectedFilePath) || files[0];
  const codePaths = sourcePaths ?? files.map((file) => file.path);
  const activePath = codePaths.includes(selectedFilePath) ? selectedFilePath : codePaths[0];
  const previewOrigin = previewUrl && !previewDoc ? new URL(previewUrl).origin : '';

  useEffect(() => {
    if (focusedFile) setSelectedFilePath(focusedFile);
  }, [focusedFile]);

  useEffect(() => {
    if (activeView !== 'code' || !activePath || !onReadFile) return;
    let current = true;
    setSource(null);
    onReadFile(activePath).then(
      (text) => { if (current) setSource({ path: activePath, text, error: false }); },
      (error: unknown) => {
        if (current) setSource({ path: activePath, text: error instanceof Error ? error.message : String(error), error: true });
      },
    );
    return () => { current = false; };
  }, [activePath, activeView, onReadFile, sourceRevision]);

  const syncInspector = () => {
    if (previewOrigin) {
      iframeRef.current?.contentWindow?.postMessage({ type: 'buildui:inspect-mode', active: isInspectMode }, previewOrigin);
    }
  };

  useEffect(syncInspector, [previewOrigin, isInspectMode, activeView, previewKey]);
  useEffect(() => {
    if (!isInspectMode || !previewOrigin || activeView !== 'preview') return;
    const receive = (event: MessageEvent) => {
      if (event.origin !== previewOrigin || event.source !== iframeRef.current?.contentWindow) return;
      const { type, path } = event.data ?? {};
      if (type === 'buildui:source-selected' && typeof path === 'string') {
        onSelectComponent?.(path, `@${path}: `);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [activeView, isInspectMode, onSelectComponent, previewOrigin]);

  const handleSelectDiagnostic = (diag: DiagnosticItem) => {
    if (diag.file) {
      const matchingPath = codePaths.find(
        (p) => p === diag.file || p.endsWith(diag.file) || diag.file.endsWith(p)
      );
      if (matchingPath) {
        setSelectedFilePath(matchingPath);
      } else {
        setSelectedFilePath(diag.file);
      }
    }
    setHighlightedLine(diag.line);
    onSelectDiagnostic?.(diag);
  };

  return (
    <section className="flex-1 h-full flex flex-col bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 overflow-hidden transition-colors">
      {/* 顶部工具栏：分段控制器（Preview | Code | Publish） + 组件审查切换 */}
      <div className="h-11 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 backdrop-blur select-none">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/60 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60">
          <button
            type="button"
            data-testid="tab-preview"
            onClick={() => onViewChange?.('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeView === 'preview'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('workspace.preview')}</span>
          </button>

          <button
            type="button"
            data-testid="tab-code"
            onClick={() => onViewChange?.('code')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeView === 'code'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{t('workspace.code')}</span>
          </button>

          <button
            type="button"
            data-testid="tab-publish"
            onClick={() => onViewChange?.('publish')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeView === 'publish'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('workspace.publish')}</span>
          </button>
        </div>

        {/* 组件审查模式切换按钮 */}
        {onToggleInspect && (
          <button
            type="button"
            onClick={onToggleInspect}
            disabled={!previewUrl && !previewDoc}
            aria-label="Toggle component inspector"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all ${
              isInspectMode
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('header.inspect')}</span>
          </button>
        )}
      </div>

      {/* 拟真浏览器地址栏 */}
      <div className="h-10 px-3 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2 bg-slate-50/30 dark:bg-zinc-900/30">
        <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500">
          <button
            type="button"
            title={t('workspace.back')}
            className="p-1 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title={t('workspace.forward')}
            className="p-1 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenExternal}
            title={t('workspace.openExternal')}
            className="p-1 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 地址输入栏 */}
        <div
          data-testid="browser-address"
          className="flex-1 flex items-center px-2.5 py-1 text-xs text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md font-mono"
        >
          <span className="truncate">{previewDoc ? '/' : previewUrl || 'Preview is stopped'}</span>
        </div>

        {/* 刷新按钮 */}
        <button
          type="button"
          onClick={onReload}
          aria-label="Reload preview"
          title={t('workspace.reload')}
          className="p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 中间核心画布视图 */}
      <div className="flex-1 relative overflow-auto bg-slate-50/40 dark:bg-zinc-950/40">
        {activeView === 'preview' && (
          <div className="w-full h-full relative flex flex-col items-center justify-center p-6">
            {/* 组件审查模式覆盖层与局部定向编辑控制器 */}
            <ComponentInspector
              isActive={isInspectMode}
              onExit={() => onToggleInspect?.()}
              onSelectComponent={(p, pr) => onSelectComponent?.(p, pr)}
            />

            {isLoading ? (
              <div className="flex flex-col items-center gap-4 text-center select-none">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {t('workspace.startingApp')}
                </span>
              </div>
            ) : previewDoc || previewUrl ? (
              <iframe
                key={previewKey}
                ref={iframeRef}
                onLoad={syncInspector}
                title="App live preview"
                src={previewDoc ? undefined : previewUrl}
                srcDoc={previewDoc}
                sandbox={previewDoc ? undefined : 'allow-scripts allow-same-origin allow-forms'}
                className="w-full h-full rounded-lg border border-slate-200 dark:border-zinc-800 shadow-xs bg-white"
              />
            ) : (
              <button type="button" onClick={onReload} className="text-sm font-medium text-purple-600">
                Start preview
              </button>
            )}
          </div>
        )}

        {activeView === 'code' && (
          <div
            data-testid="code-review-layout"
            className="w-full h-full flex overflow-hidden"
          >
            {/* 左侧：目录文件树 */}
            <div
              data-testid="code-file-tree"
              className="w-64 shrink-0 h-full border-r border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 flex flex-col overflow-hidden select-none"
            >
              <FileTree
                paths={codePaths}
                selectedPath={activePath}
                onSelectPath={(path) => {
                  setSelectedFilePath(path);
                  setHighlightedLine(null);
                }}
              />
            </div>

            {/* 右侧：文件内容展示区（适配明暗主题） */}
            <div
              data-testid="code-file-content"
              className="flex-1 h-full flex flex-col overflow-hidden bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors"
            >
              {/* 右侧顶部：当前文件路径信息条 */}
              {activePath && (
                <div className="h-9 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400 bg-slate-100/70 dark:bg-zinc-900/60 shrink-0 select-none">
                  <span className="truncate text-slate-700 dark:text-zinc-200 font-medium">
                    {activePath}
                  </span>
                </div>
              )}

              {/* 代码展示主体 */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {source?.error && source.path === activePath ? (
                  <div className="flex-1 p-4 overflow-auto font-mono text-xs">
                    <p role="alert" className="text-rose-600 dark:text-rose-400">{source.text}</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <CodeEditorViewer
                      code={
                        sourcePaths && activePath
                          ? (source?.path === activePath ? source.text : 'Loading source…')
                          : activeFile?.content ?? t('workspace.noFileLoaded')
                      }
                      filePath={activePath}
                      highlightedLine={highlightedLine}
                      diagnostics={diagnostics}
                      onLineClick={(line) => setHighlightedLine(line)}
                    />
                  </div>
                )}

                {/* 错误诊断问题面板（适配明暗主题） */}
                {diagnostics && diagnostics.length > 0 && (
                  <div
                    data-testid="diagnostics-panel"
                    className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs flex flex-col shrink-0 select-none max-h-48 transition-colors"
                  >
                    <button
                      type="button"
                      data-testid="diagnostics-toggle"
                      onClick={() => setIsProblemsOpen(!isProblemsOpen)}
                      className="w-full h-8 px-3 flex items-center justify-between bg-slate-100/90 dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-300 font-sans hover:bg-slate-200/80 dark:hover:bg-zinc-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                        <span>{t('workspace.problems')} ({diagnostics.length})</span>
                      </div>
                      {isProblemsOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                      )}
                    </button>

                    {isProblemsOpen && (
                      <div className="overflow-y-auto max-h-40 divide-y divide-slate-200/80 dark:divide-zinc-800/60 p-1">
                        {diagnostics.map((diag, idx) => (
                          <div
                            key={idx}
                            data-testid={`diagnostic-item-${idx}`}
                            onClick={() => handleSelectDiagnostic(diag)}
                            className="px-2.5 py-1.5 flex items-start gap-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800/70 rounded cursor-pointer transition-colors text-slate-700 dark:text-zinc-200 group"
                          >
                            {diag.severity === 'error' ? (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-purple-600 dark:text-purple-300 text-[11px] group-hover:underline font-medium">
                                  {diag.file}:{diag.line}:{diag.column}
                                </span>
                                <span
                                  className={`text-[10px] px-1 py-0.2 rounded uppercase font-semibold ${
                                    diag.severity === 'error'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                  }`}
                                >
                                  {diag.severity}
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-zinc-300 text-xs mt-0.5 font-sans break-words">
                                {diag.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'publish' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-100 mb-2">
              {t('workspace.publish')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
              {t('workspace.publishDesc')}
            </p>
            <button
              type="button"
              onClick={onPublish}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
            >
              {t('workspace.exportZipBtn')}
            </button>
          </div>
        )}
      </div>

      {/* 底部可折叠 System Messages 日志控制台抽屉 */}
      <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all select-none">
        <button
          type="button"
          data-testid="system-messages-toggle"
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          className="w-full h-9 px-3 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-2 font-medium">
            <Terminal className="w-3.5 h-3.5" />
            <span>{t('workspace.systemMessages')}</span>
            {systemLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500">
                {systemLogs.length}
              </span>
            )}
          </div>
          {isConsoleOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {isConsoleOpen && (
          <div
            data-testid="system-messages-drawer"
            className="h-44 p-3 bg-slate-950 text-slate-200 font-mono text-xs overflow-y-auto border-t border-slate-800"
          >
            {systemLogs.length > 0 ? (
              systemLogs.map((log, index) => (
                <div key={index} className="py-0.5 leading-relaxed text-slate-300">
                  <span className="text-slate-500 select-none mr-2">[{index + 1}]</span>
                  {log}
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic py-2">
                {t('workspace.emptyConsole')}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
