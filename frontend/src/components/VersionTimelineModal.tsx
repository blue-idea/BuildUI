import React, { useState } from 'react';
import { DiffViewer, FileDiffItem } from './DiffViewer';

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
}

export const VersionTimelineModal: React.FC<VersionTimelineModalProps> = ({
  isOpen,
  onClose,
  versions,
  onSelectVersion,
  onRollback,
}) => {
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [activeDiff, setActiveDiff] = useState<VersionDiffResult | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  if (!isOpen) return null;

  const handleSelect = async (hash: string) => {
    setSelectedHash(hash);
    setLoadingDiff(true);
    try {
      const res = await onSelectVersion(hash);
      setActiveDiff(res);
    } catch {
      setActiveDiff(null);
    } finally {
      setLoadingDiff(false);
    }
  };

  const handleRollbackClick = async () => {
    if (!selectedHash) return;
    setRollingBack(true);
    try {
      await onRollback(selectedHash);
      onClose();
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* 顶部标题栏 */}
        <div className="flex h-12 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <h2 className="text-sm font-semibold text-white">Version Time Machine</h2>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
              {versions.length} Snapshots
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close time machine"
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 主体分栏 */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* 左侧：版本快照时间线 */}
          <div className="border-r border-slate-800 bg-slate-950/60 overflow-y-auto p-3 space-y-2">
            {versions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No version snapshots yet.
              </div>
            ) : (
              versions.map((v) => {
                const isSelected = selectedHash === v.commitHash;
                const shortHash = v.commitHash.slice(0, 7);
                return (
                  <div
                    key={v.commitHash}
                    onClick={() => handleSelect(v.commitHash)}
                    className={`cursor-pointer rounded-lg border p-3 text-xs transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30 text-white shadow-sm'
                        : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-mono text-[11px] font-semibold text-cyan-400">
                        {shortHash}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-slate-200 leading-snug">
                      {v.message || 'Automated checkpoint'}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* 右侧：代码差异审查与回滚操作区 */}
          <div className="col-span-2 flex flex-col bg-slate-900/40 overflow-hidden">
            {/* 操作控制工具条 */}
            <div className="flex h-11 items-center justify-between border-b border-slate-800 px-4 text-xs">
              <span className="text-slate-400">
                {selectedHash ? `Commit: ${selectedHash.slice(0, 7)}` : 'Select a version to inspect diff'}
              </span>

              {selectedHash && (
                <button
                  type="button"
                  disabled={rollingBack}
                  onClick={handleRollbackClick}
                  className="rounded bg-rose-600 px-3 py-1 font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors disabled:opacity-50"
                >
                  {rollingBack ? 'Rolling back...' : 'Rollback to this version'}
                </button>
              )}
            </div>

            {/* 差异视图容器 */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingDiff ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mr-2" />
                  Loading diff...
                </div>
              ) : activeDiff ? (
                <DiffViewer files={activeDiff.files} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
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
