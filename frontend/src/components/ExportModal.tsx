import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  onExportZip: () => Promise<string>;
  onRevealInFileManager: (path: string) => Promise<void>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  appName,
  onExportZip,
  onRevealInFileManager,
}) => {
  const { t } = useI18n();
  const [exporting, setExporting] = useState(false);
  const [exportedPath, setExportedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const out = await onExportZip();
      setExportedPath(out);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  };

  const handleReveal = async () => {
    if (!exportedPath) return;
    try {
      await onRevealInFileManager(exportedPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl text-slate-800 dark:text-zinc-100 transition-colors">
        {/* 标题 */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <h2 id="export-modal-title" className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              {t('modals.exportTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 主体内容 */}
        <div className="mt-4 space-y-4 text-xs">
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 p-3.5">
            <div className="text-slate-500 dark:text-zinc-400 font-medium">Application Name:</div>
            <div className="mt-1 font-semibold text-sm text-slate-900 dark:text-zinc-100">{appName}</div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
              Export as an independent, fully self-contained project archive ready to deploy or distribute. Temporary artifacts like <code className="bg-slate-200/60 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-1 py-0.5 rounded font-mono">node_modules</code>, <code className="bg-slate-200/60 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-1 py-0.5 rounded font-mono">.git</code>, and build caches are automatically excluded.
            </div>
          </div>

          {/* 成功导出反馈 */}
          {exportedPath && (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-emerald-800 dark:text-emerald-300">
              <div className="font-semibold flex items-center gap-1.5">
                <span>✓</span>
                <span>Exported successfully to:</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-emerald-900 dark:text-emerald-200 break-all select-all">
                {exportedPath}
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="rounded-xl border border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-rose-800 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-4 text-xs">
          <div>
            {exportedPath && (
              <button
                type="button"
                onClick={handleReveal}
                aria-label={t('modals.revealBtn')}
                className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t('modals.revealBtn')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={handleExport}
              aria-label={t('modals.exportZip')}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-1.5 font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {exporting ? t('common.loading') : t('modals.exportZip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
