import React, { useState } from 'react';

export interface FileDiffItem {
  path: string;
  status: 'added' | 'modified' | 'deleted' | string;
  additions: number;
  deletions: number;
  hunks: string[];
}

export interface DiffViewerProps {
  files: FileDiffItem[];
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ files }) => {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(() => {
    // 默认展开所有文件
    const initial: Record<string, boolean> = {};
    files.forEach((f) => {
      initial[f.path] = true;
    });
    return initial;
  });

  const toggleExpand = (path: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  if (!files || files.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-slate-500">
        No file changes in this commit.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono text-xs">
      {files.map((file) => {
        const isExpanded = expandedFiles[file.path];
        return (
          <div
            key={file.path}
            className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/80"
          >
            {/* 文件头部 */}
            <div
              onClick={() => toggleExpand(file.path)}
              className="flex cursor-pointer items-center justify-between bg-slate-100 dark:bg-zinc-900/80 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-200/70 dark:hover:bg-zinc-800/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{file.path}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    file.status === 'added'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                      : file.status === 'deleted'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/60'
                  }`}
                >
                  {file.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                {file.additions > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
                )}
                {file.deletions > 0 && (
                  <span className="text-rose-600 dark:text-rose-400">-{file.deletions}</span>
                )}
              </div>
            </div>

            {/* 代码差异区块 */}
            {isExpanded && file.hunks && file.hunks.length > 0 && (
              <div className="max-h-72 overflow-x-auto overflow-y-auto p-2 bg-slate-950 text-[11px] leading-relaxed">
                {file.hunks.map((hunk, idx) => (
                  <div key={idx} className="whitespace-pre">
                    {hunk.split('\n').map((line, lIdx) => {
                      if (!line && lIdx === hunk.split('\n').length - 1) return null;
                      const isAdd = line.startsWith('+') && !line.startsWith('+++');
                      const isDel = line.startsWith('-') && !line.startsWith('---');
                      const isHunkHeader = line.startsWith('@@');

                      return (
                        <div
                          key={lIdx}
                          className={`px-2 py-0.5 ${
                            isAdd
                              ? 'bg-emerald-950/60 text-emerald-300 font-medium'
                              : isDel
                                ? 'bg-rose-950/60 text-rose-300 font-medium'
                                : isHunkHeader
                                  ? 'bg-blue-950/40 text-blue-400 text-[10px]'
                                  : 'text-slate-400'
                          }`}
                        >
                          {line}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
