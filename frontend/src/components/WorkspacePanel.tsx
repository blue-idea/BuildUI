import React, { useEffect, useRef, useState } from 'react';
import {
  Eye,
  Code2,
  Globe,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  RotateCw,
  Play,
  Terminal,
  ChevronDown,
  ChevronUp,
  Loader2,
  Scan,
  AlertCircle,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { FileTree } from './FileTree';
import { CodeEditorViewer } from './CodeEditorViewer';
import { ComponentInspector } from './ComponentInspector';
import { locateCodeRegion } from '../utils/sourceLocator';
import type { InspectedElement } from '../types/inspect';
import type { DiagnosticItem } from '../services/wailsBridge';
import type { BlueprintDTO } from './BlueprintCard';

export function resolveNavigationUrl(rawInput: string, basePreviewUrl: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return basePreviewUrl;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const routePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  try {
    const base = basePreviewUrl || 'http://localhost:5173';
    return new URL(routePath, base).toString();
  } catch {
    return trimmed;
  }
}

export type WorkspaceView = 'preview' | 'code' | 'publish';
const phonePreviewSizes = {
  standard: { width: 390, height: 844 },
  compact: { width: 360, height: 800 },
};

export interface WorkspacePanelProps {
  activeView?: WorkspaceView;
  onViewChange?: (view: WorkspaceView) => void;
  isLoading?: boolean;
  loadingMessage?: string;
  previewUrl?: string;
  previewDoc?: string;
  previewKey?: number;
  nativePreview?: boolean;
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
  onRestart?: () => void;
  previewActionsDisabled?: boolean;
  onOpenExternal?: () => void;
  onPublish?: () => void;
  blueprint?: BlueprintDTO | null;
  onApproveBlueprint?: (chatId: number) => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  activeView = 'preview',
  onViewChange,
  isLoading = false,
  loadingMessage,
  previewUrl = 'http://localhost:5173',
  previewDoc,
  previewKey,
  nativePreview = false,
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
  onRestart,
  previewActionsDisabled = false,
  onOpenExternal,
  onPublish,
  blueprint,
  onApproveBlueprint,
}) => {
  const { t } = useI18n();
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isProblemsOpen, setIsProblemsOpen] = useState(true);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path || '');
  const [source, setSource] = useState<{ path: string; text: string; error: boolean } | null>(null);
  const [selectedInspectElement, setSelectedInspectElement] = useState<InspectedElement | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>(previewUrl || '');
  const [frameUrl, setFrameUrl] = useState<string>(previewUrl || '');
  const [addressInput, setAddressInput] = useState<string>(previewUrl || '');
  const [isAddressFocused, setIsAddressFocused] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewStage = useRef<HTMLDivElement>(null);
  const [phoneSize, setPhoneSize] = useState<keyof typeof phonePreviewSizes>('standard');
  const [phoneScale, setPhoneScale] = useState(1);
  const device = nativePreview ? phonePreviewSizes[phoneSize] : null;

  const activeFile = files.find((f) => f.path === selectedFilePath) || files[0];
  const codePaths = sourcePaths ?? files.map((file) => file.path);
  const activePath = codePaths.includes(selectedFilePath) ? selectedFilePath : codePaths[0];
  const previewOrigin = previewUrl && !previewDoc ? new URL(previewUrl).origin : '';

  useEffect(() => {
    if (previewUrl) {
      setActiveUrl(previewUrl);
      setFrameUrl(previewUrl);
      if (!isAddressFocused) {
        setAddressInput(previewUrl);
      }
    }
  }, [previewUrl]);

  useEffect(() => {
    // 路由事件只同步地址栏，切出预览时才记录下次载入的位置。
    if (activeView !== 'preview') setFrameUrl(activeUrl);
  }, [activeUrl, activeView]);

  useEffect(() => {
    const stage = previewStage.current;
    if (!device || !stage || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([{ contentRect }]) => {
      if (contentRect.width > 0 && contentRect.height > 0) {
        setPhoneScale(Math.min(1, contentRect.width / device.width, contentRect.height / device.height));
      }
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [activeView, device]);

  useEffect(() => {
    if (!isInspectMode) {
      setSelectedInspectElement(null);
    }
  }, [isInspectMode]);

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
    if (activeView !== 'preview') return;
    const receive = async (event: MessageEvent) => {
      if (previewOrigin && event.origin !== previewOrigin) return;
      if (iframeRef.current?.contentWindow && event.source && event.source !== iframeRef.current.contentWindow) return;

      const { type, path, element, pathname, url } = event.data ?? {};

      // 沙箱内部路由变化通知双向同步
      if (type === 'buildui:route-changed') {
        const newUrl = url || (pathname ? resolveNavigationUrl(pathname, previewUrl) : '');
        if (newUrl) {
          setActiveUrl(newUrl);
          if (!isAddressFocused) {
            setAddressInput(newUrl);
          }
        }
        return;
      }

      if (!isInspectMode) return;

      if (type === 'buildui:element-selected' && element) {
        const inspectedEl = { ...element } as InspectedElement;
        const targetPath = inspectedEl.componentPath;

        let sourceCode = '';
        if (onReadFile && targetPath) {
          try {
            sourceCode = await onReadFile(targetPath);
          } catch {
            sourceCode = '';
          }
        } else if (files && targetPath) {
          const matched = files.find((f) => f.path === targetPath || f.path.endsWith(targetPath));
          if (matched) sourceCode = matched.content;
        }

        if (sourceCode) {
          const region = locateCodeRegion({
            sourceCode,
            filePath: targetPath,
            line: inspectedEl.line,
            column: inspectedEl.column,
            tagName: inspectedEl.tagName,
            textSnippet: inspectedEl.textSnippet,
            className: inspectedEl.className,
          });
          inspectedEl.codeRegion = region;
        }

        setSelectedInspectElement(inspectedEl);
      } else if (type === 'buildui:source-selected' && typeof path === 'string') {
        onSelectComponent?.(path, `@${path}: `);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [activeView, files, isAddressFocused, isInspectMode, onReadFile, onSelectComponent, previewOrigin, previewUrl]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    const targetUrl = resolveNavigationUrl(addressInput, previewUrl);
    setActiveUrl(targetUrl);
    setFrameUrl(targetUrl);
    setAddressInput(targetUrl);
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setAddressInput(activeUrl || previewUrl);
      e.currentTarget.blur();
    }
  };

  const traversePreviewHistory = (direction: 'back' | 'forward') => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) return;
    try {
      frameWindow.history[direction]();
    } catch {
      // 跨域预览在自己的 iframe 中处理历史记录，避免重载预览。
      if (previewOrigin) {
        frameWindow.postMessage({ type: 'buildui:traverse-history', direction }, previewOrigin);
      }
    }
  };

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
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-2xs font-semibold'
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
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-2xs font-semibold'
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
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('workspace.publish')}</span>
          </button>
        </div>

        {/* 局部编辑模式切换按钮 */}
        {onToggleInspect && (
          <button
            type="button"
            onClick={onToggleInspect}
            disabled={!previewUrl && !previewDoc}
            aria-label="Toggle component inspector"
            title={t('header.inspect')}
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
            onClick={() => traversePreviewHistory('back')}
            title={t('workspace.back')}
            className="p-1 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => traversePreviewHistory('forward')}
            title={t('workspace.forward')}
            className="p-1 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenExternal ? () => onOpenExternal() : () => {
              const target = activeUrl || previewUrl;
              if (target) window.open(target, '_blank', 'noopener,noreferrer');
            }}
            title={t('workspace.openExternal')}
            className="p-1 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 地址输入栏 */}
        <form
          onSubmit={handleNavigate}
          className="flex-1 flex items-center min-w-0"
        >
          <div
            data-testid="browser-address"
            className="w-full flex items-center px-2.5 py-1 text-xs text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md font-mono focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all"
          >
            <input
              data-testid="browser-address-input"
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onFocus={() => setIsAddressFocused(true)}
              onBlur={() => setIsAddressFocused(false)}
              onKeyDown={handleAddressKeyDown}
              placeholder={previewDoc ? '/' : previewUrl || 'Preview is stopped'}
              disabled={!previewUrl && !previewDoc}
              className="w-full bg-transparent outline-none text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-mono text-xs"
            />
          </div>
        </form>

        {device && activeView === 'preview' && (
          <select
            aria-label={t('workspace.phonePreviewSize')}
            value={phoneSize}
            onChange={(event) => setPhoneSize(event.currentTarget.value as keyof typeof phonePreviewSizes)}
            className="shrink-0 rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {Object.entries(phonePreviewSizes).map(([key, size]) => (
              <option key={key} value={key}>{size.width} × {size.height}</option>
            ))}
          </select>
        )}

        {/* 刷新按钮 */}
        <button
          type="button"
          onClick={onReload}
          disabled={previewActionsDisabled}
          aria-label="Reload preview"
          title={t('workspace.reload')}
          className="p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            disabled={previewActionsDisabled}
            aria-label={t('workspace.restart')}
            title={t('workspace.restart')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-200/60 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t('workspace.restart')}</span>
          </button>
        )}
      </div>

      {/* 中间核心画布视图 */}
      <div className="flex-1 relative overflow-auto bg-slate-50/40 dark:bg-zinc-950/40">
        {activeView === 'preview' && (
          <div ref={previewStage} className="w-full h-full relative flex flex-col items-center justify-center p-6">
            {/* 组件审查模式覆盖层与局部定向编辑控制器 */}
            <ComponentInspector
              isActive={isInspectMode}
              selectedElement={selectedInspectElement}
              onClearSelectedElement={() => {
                setSelectedInspectElement(null);
                if (previewOrigin) {
                  iframeRef.current?.contentWindow?.postMessage({ type: 'buildui:clear-selection' }, previewOrigin);
                }
              }}
              onExit={() => onToggleInspect?.()}
              onSelectComponent={(p, pr) => onSelectComponent?.(p, pr)}
              onJumpToCode={(filePath, line) => {
                onViewChange?.('code');
                const matchingPath = codePaths.find(
                  (cp) => cp === filePath || cp.endsWith(filePath) || filePath.endsWith(cp)
                );
                setSelectedFilePath(matchingPath || filePath);
                if (line) setHighlightedLine(line);
              }}
            />

            {isLoading ? (
              <div className="flex flex-col items-center gap-4 text-center select-none">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <span role="status" className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {loadingMessage || t('workspace.startingApp')}
                </span>
              </div>
            ) : blueprint && !blueprint.approved ? (
              <div
                data-testid="blueprint-pending-guidance"
                className={device
                  ? 'shrink-0 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg ring-1 ring-white/10 flex flex-col items-center justify-center p-6 text-center select-none'
                  : 'max-w-md w-full rounded-2xl border border-slate-200/80 bg-white/95 p-6 text-center shadow-lg backdrop-blur-md select-none dark:border-zinc-800 dark:bg-zinc-900/95'}
                style={device ? { width: device.width * phoneScale, height: device.height * phoneScale } : undefined}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400 ring-1 ring-amber-500/20">
                  <Clock className="h-7 w-7" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-3">
                  {t('blueprint.pendingApprovalBadge')}
                </span>
                <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-100">
                  {blueprint.appName || t('blueprint.subtitle')}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400 px-4">
                  {t('blueprint.pendingGuidance')}
                </p>
                {onApproveBlueprint && (
                  <button
                    type="button"
                    data-testid="preview-approve-blueprint-btn"
                    onClick={() => onApproveBlueprint(blueprint.chatId)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-500 active:scale-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{t('blueprint.startBuilding')}</span>
                  </button>
                )}
              </div>
            ) : previewDoc || previewUrl ? (
              <div
                className={device ? 'shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-900/15 dark:ring-white/15' : 'h-full w-full'}
                style={device ? { width: device.width * phoneScale, height: device.height * phoneScale } : undefined}
              >
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  onLoad={syncInspector}
                  title="App live preview"
                  src={previewDoc ? undefined : frameUrl || previewUrl}
                  srcDoc={previewDoc}
                  sandbox={previewDoc ? undefined : 'allow-scripts allow-same-origin allow-forms'}
                  width={device?.width}
                  height={device?.height}
                  className={device ? 'block origin-top-left border-0 bg-white' : 'block h-full w-full rounded-lg border border-slate-200 bg-white shadow-xs dark:border-zinc-800'}
                  style={device ? { transform: `scale(${phoneScale})` } : undefined}
                />
              </div>
            ) : (
              <button type="button" onClick={onReload} disabled={previewActionsDisabled} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">
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
                                <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px] group-hover:underline font-medium">
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
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
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
