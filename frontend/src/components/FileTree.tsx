import React, { useState, useEffect, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  Files,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  children: FileTreeNode[];
}

export interface FileTreeProps {
  paths: string[];
  selectedPath?: string;
  onSelectPath: (path: string) => void;
  className?: string;
}

/**
 * 将平铺的文件路径列表构建为多层级的目录树节点
 */
export function buildTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode = { id: '', name: '', path: '', isDir: true, children: [] };

  paths.forEach((rawPath) => {
    const normalized = rawPath.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\//, '');
    if (!normalized) return;
    const parts = normalized.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isDir = index < parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');
      let child = current.children.find((c) => c.name === part && c.isDir === isDir);

      if (!child) {
        child = {
          id: currentPath,
          name: part,
          path: currentPath,
          isDir,
          children: [],
        };
        current.children.push(child);
      }
      current = child;
    });
  });

  // 排序规则：目录在前（按字母升序），文件在后（按字母升序）
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.isDir) sortNodes(node.children);
    });
  };

  sortNodes(root.children);
  return root.children;
}

/**
 * 根据文件后缀匹配对应图标
 */
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'vue':
    case 'svelte':
    case 'go':
    case 'py':
    case 'json':
    case 'html':
    case 'css':
      return <FileCode2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    case 'md':
    case 'txt':
    case 'doc':
      return <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    default:
      return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
};

export const FileTree: React.FC<FileTreeProps> = ({
  paths,
  selectedPath,
  onSelectPath,
  className = '',
}) => {
  const { t } = useI18n();
  const treeData = useMemo(() => buildTree(paths), [paths]);

  // 维护目录展开状态：默认展开所有路径包含的目录
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    paths.forEach((rawPath) => {
      const normalized = rawPath.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\//, '');
      const parts = normalized.split('/');
      for (let i = 1; i < parts.length; i++) {
        initial[parts.slice(0, i).join('/')] = true;
      }
    });
    return initial;
  });

  // 当外部传入或切换 selectedPath 时，自动将祖先各级目录标记为展开
  useEffect(() => {
    if (!selectedPath) return;
    const normalized = selectedPath.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\//, '');
    const parts = normalized.split('/');
    if (parts.length > 1) {
      setExpandedDirs((prev) => {
        let changed = false;
        const next = { ...prev };
        for (let i = 1; i < parts.length; i++) {
          const dir = parts.slice(0, i).join('/');
          if (!next[dir]) {
            next[dir] = true;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [selectedPath]);

  const toggleDir = (dirPath: string) => {
    setExpandedDirs((prev) => ({
      ...prev,
      [dirPath]: !prev[dirPath],
    }));
  };

  // 递归渲染目录树节点
  const renderNodes = (nodes: FileTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      if (node.isDir) {
        const isExpanded = !!expandedDirs[node.path];
        return (
          <div key={node.id} className="select-none">
            <button
              type="button"
              aria-label={`toggle-dir-${node.name}`}
              onClick={() => toggleDir(node.path)}
              style={{ paddingLeft: `${depth * 14 + 10}px` }}
              className="w-full flex items-center gap-1.5 py-1 pr-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-md transition-colors text-left"
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                )}
              </span>
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-blue-500/80 dark:text-blue-400/80 shrink-0" />
              )}
              <span className="truncate font-medium">{node.name}</span>
            </button>

            {isExpanded && node.children && node.children.length > 0 && (
              <div className="flex flex-col">
                {renderNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      // 文件节点
      const isSelected = selectedPath === node.path;
      return (
        <button
          key={node.id}
          type="button"
          role="treeitem"
          aria-selected={isSelected ? 'true' : 'false'}
          onClick={() => onSelectPath(node.path)}
          style={{ paddingLeft: `${depth * 14 + 24}px` }}
          className={`w-full flex items-center gap-2 py-1 pr-2 text-xs rounded-md transition-all text-left font-mono ${
            isSelected
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          {getFileIcon(node.name)}
          <span className="truncate">{node.name}</span>
        </button>
      );
    });
  };

  if (!paths || paths.length === 0) {
    return (
      <div className={`p-4 text-center text-xs text-slate-400 dark:text-zinc-500 ${className}`}>
        {t('workspace.noFiles', 'No files in project.')}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full select-none ${className}`}>
      {/* 顶部标题区 */}
      <div className="h-9 px-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0 bg-slate-50/80 dark:bg-zinc-900/80">
        <div className="flex items-center gap-1.5 font-medium">
          <Files className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{t('workspace.files', 'Files')}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 font-mono text-slate-600 dark:text-zinc-400">
          {paths.length}
        </span>
      </div>

      {/* 目录树展示区 */}
      <div role="tree" className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {renderNodes(treeData)}
      </div>
    </div>
  );
};
