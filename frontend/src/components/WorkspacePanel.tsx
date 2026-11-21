import React, { useState } from 'react';
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
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export type WorkspaceView = 'preview' | 'code' | 'publish';

export interface WorkspacePanelProps {
  activeView?: WorkspaceView;
  onViewChange?: (view: WorkspaceView) => void;
  isLoading?: boolean;
  previewUrl?: string;
  files?: Array<{ path: string; content: string }>;
  systemLogs?: string[];
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
  files = [],
  systemLogs = [],
  isInspectMode = false,
  onToggleInspect,
  onSelectComponent,
  onReload,
  onOpenExternal,
  onPublish,
}) => {
  const { t } = useI18n();
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path || '');

  const activeFile = files.find((f) => f.path === selectedFilePath) || files[0];

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
            aria-label="Toggle component inspector"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all ${
              isInspectMode
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspect</span>
          </button>
        )}
      </div>

      {/* 拟真浏览器地址栏 */}
      <div className="h-10 px-3 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2 bg-slate-50/30 dark:bg-zinc-900/30">
        <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500">
          <button
            type="button"
            title="Back"
            className="p-1 hover:text-slate-700 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Forward"
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
          <span>/</span>
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
            {/* 组件审查模式覆盖层 */}
            {isInspectMode && (
              <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between p-2 rounded-lg bg-purple-600/90 text-white text-xs shadow-md backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Inspector Mode Active:</span>
                  <span className="text-purple-200 text-[11px]">
                    Click any preview element to inspect source component and inject prompt
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectComponent?.('src/components/Navbar.tsx', '@src/components/Navbar.tsx: ')}
                  aria-label="Inspect navbar element"
                  className="px-2 py-0.5 rounded bg-white text-purple-700 font-medium hover:bg-purple-50 transition-colors text-[11px]"
                >
                  Mock Navbar
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center gap-4 text-center select-none">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {t('workspace.startingApp')}
                </span>
              </div>
            ) : (
              <iframe
                title="App live preview"
                src={previewUrl}
                className="w-full h-full rounded-lg border border-slate-200 dark:border-zinc-800 shadow-xs bg-white"
              />
            )}
          </div>
        )}

        {activeView === 'code' && (
          <div className="w-full h-full flex flex-col">
            {files.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 overflow-x-auto text-xs font-mono">
                {files.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      (selectedFilePath || files[0]?.path) === file.path
                        ? 'bg-white dark:bg-zinc-800 font-semibold text-purple-600 dark:text-purple-300 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {file.path.split('/').pop()}
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs bg-slate-900 text-slate-100">
              <pre>{activeFile ? activeFile.content : '// No file loaded.'}</pre>
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
              Export production-ready bundle or deploy directly to cloud hosting platforms (Vercel, Netlify).
            </p>
            <button
              type="button"
              onClick={onPublish}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
            >
              Export Standalone Zip
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
