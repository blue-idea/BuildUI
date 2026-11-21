import React from 'react';
import { FileEdit, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { FileActionItem } from '../types/fileAction';
import { useI18n } from '../i18n/I18nContext';

export interface FileChangeCardProps {
  item: FileActionItem;
  onInspect?: (path: string) => void;
}

export const FileChangeCard: React.FC<FileChangeCardProps> = ({ item, onInspect }) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between p-3 my-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-blue-400/80 dark:hover:border-blue-500/80 transition-all group">
      {/* 左侧：文件图标 + 文件名及相对路径 */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/50 flex items-center justify-center shrink-0">
          <FileEdit className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
            {item.filename}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate font-mono">
            {item.path}
          </span>
        </div>
      </div>

      {/* 右侧：状态指示器与审查箭头 */}
      <div className="flex items-center gap-2 shrink-0">
        {item.status === 'writing' && (
          <div className="flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{t('chat.writing')}</span>
          </div>
        )}

        {item.status === 'completed' && (
          <div
            data-testid={`status-completed-${item.id}`}
            className="flex items-center text-emerald-500 dark:text-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}

        {/* 审查跳转箭头按钮 */}
        <button
          type="button"
          onClick={() => onInspect?.(item.path)}
          data-testid={`inspect-file-${item.id}`}
          title={t('chat.inspectFile')}
          className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
