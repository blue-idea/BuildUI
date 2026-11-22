import React, { useState } from 'react';
import { DiffViewer, FileDiffItem } from './DiffViewer';
import { useI18n } from '../i18n/I18nContext';

export interface VersionItem {
  id: number;
  commitHash: string;
  message: string;
  createdAt: string;
}

export interface VersionDiffResult {
  commitHash: string;
  message: string;
  files: FileDiffItem[];
}

export interface VersionTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionItem[];
  onSelectVersion: (hash: string) => Promise<VersionDiffResult | null>;
  onRollback: (hash: string) => Promise<void>;
  rollbackDisabled?: boolean;
}

export const VersionTimelineModal: React.FC<VersionTimelineModalProps> = ({
  isOpen,
  onClose,
  versions,
  onSelectVersion,
  onRollback,
  rollbackDisabled = false,
}) => {
  const { t } = useI18n();
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [activeDiff, setActiveDiff] = useState<VersionDiffResult | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelect = async (hash: string) => {
    setSelectedHash(hash);
    setError('');
    setActiveDiff(null);
    setLoadingDiff(true);
    try {
      const res = await onSelectVersion(hash);
      setActiveDiff(res);
    } catch (error) {
      setActiveDiff(null);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingDiff(false);
    }
  };

  const handleRollbackClick = async () => {
    if (!selectedHash || rollbackDisabled || loadingDiff) return;
    setError('');
    setRollingBack(true);
    try {
      await onRollback(selectedHash);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl text-slate-800 dark:text-zinc-100 overflow-hidden transition-colors">
        {/* 顶部标题栏 */}
        <div className="flex h-12 items-center justify-between border-b border-slate-200 dark:border-zinc-800 px-5 bg-slate-50/70 dark:bg-zinc-950/60 select-none">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-sm shadow-cyan-500/50" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{t('modals.versionTitle')}</h2>
            <span className="rounded-full bg-slate-200/80 dark:bg-zinc-800 px-2 py-0.5 text-[10px] text-slate-600 dark:text-zinc-400 font-medium">
              {t('modals.snapshotsCount').replace('{count}', String(versions.length))}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close time machine"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <p role="alert" className="px-5 py-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60">
            {error}
          </p>
        )}

        {/* 主体分栏 */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* 左侧：版本快照时间线 */}
          <div className="border-r border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 overflow-y-auto p-3 space-y-2">
            {versions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-zinc-500">
                {t('modals.noSnapshots')}
              </div>
            ) : (
              versions.map((v) => {
                const isSelected = selectedHash === v.commitHash;
                const shortHash = v.commitHash.slice(0, 7);
                return (
                  <div
                    key={v.commitHash}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select version ${shortHash}`}
                    onClick={() => handleSelect(v.commitHash)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(v.commitHash);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                      isSelected
                        ? 'border-blue-500 dark:border-blue-500/80 bg-blue-50/80 dark:bg-blue-950/30 text-slate-900 dark:text-zinc-50 shadow-sm'
                        : 'border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        {shortHash}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-slate-800 dark:text-zinc-200 font-medium leading-snug">
                      {v.message || 'Automated checkpoint'}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* 右侧：代码差异审查与回滚操作区 */}
          <div className="col-span-2 flex flex-col bg-white dark:bg-zinc-900/40 overflow-hidden">
            {/* 操作控制工具条 */}
            <div className="flex h-11 items-center justify-between border-b border-slate-200 dark:border-zinc-800 px-4 text-xs bg-slate-50/40 dark:bg-zinc-950/30 text-slate-500 dark:text-zinc-400">
              <span>
                {selectedHash ? `Commit: ${selectedHash.slice(0, 7)}` : 'Select a version to inspect diff'}
              </span>

              {selectedHash && (
                <button
                  type="button"
                  disabled={rollingBack || rollbackDisabled || loadingDiff}
                  onClick={handleRollbackClick}
                  className="rounded-xl bg-rose-600 px-3 py-1 font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors disabled:opacity-50"
                >
                  {rollingBack ? t('modals.rollingBack') : t('modals.rollbackBtn')}
                </button>
              )}
            </div>

            {/* 差异视图容器 */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingDiff ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-2" />
                  Loading diff...
                </div>
              ) : activeDiff ? (
                <DiffViewer files={activeDiff.files} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
                  Select a version checkpoint from the timeline on the left to inspect file changes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionTimelineModal;
