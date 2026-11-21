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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
        {/* 标题 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <h2 id="export-modal-title" className="text-base font-semibold text-white">{t('modals.exportTitle')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 主体内容 */}
        <div className="mt-4 space-y-4 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-slate-400 font-medium">Application Name:</div>
            <div className="mt-1 font-semibold text-sm text-slate-100">{appName}</div>
            <div className="mt-2 text-[11px] text-slate-500 leading-relaxed">
              Export as an independent, fully self-contained project archive ready to deploy or distribute. Temporary artifacts like <code className="text-slate-400">node_modules</code>, <code className="text-slate-400">.git</code>, and build caches are automatically excluded.
            </div>
          </div>

          {/* 成功导出反馈 */}
          {exportedPath && (
            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-3 text-emerald-300">
              <div className="font-semibold flex items-center gap-1.5">
                <span>✓</span>
                <span>Exported successfully to:</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-emerald-200 break-all select-all">
                {exportedPath}
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
          <div>
            {exportedPath && (
              <button
                type="button"
                onClick={handleReveal}
                aria-label={t('modals.revealBtn')}
                className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {t('modals.revealBtn')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-slate-400 hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={handleExport}
              aria-label={t('modals.exportZip')}
              className="rounded bg-blue-600 px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
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
