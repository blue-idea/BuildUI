import React, { useState, useEffect, useRef } from 'react';

export interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Theme' | 'App' | 'Action' | string;
  shortcut?: string;
  run: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  actions,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredActions = actions.filter((action) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      action.title.toLowerCase().includes(q) ||
      (action.subtitle && action.subtitle.toLowerCase().includes(q)) ||
      action.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredActions.length ? (prev + 1) % filteredActions.length : 0
      );
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredActions.length
          ? (prev - 1 + filteredActions.length) % filteredActions.length
          : 0
      );
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].run();
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* 顶部搜索框 */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 bg-slate-950/60">
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search actions..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* 命令动作列表 */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => {
                    action.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                        isSelected
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {action.category}
                    </span>
                    <span>{action.title}</span>
                  </div>

                  {action.shortcut && (
                    <kbd
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-blue-700/60 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                      }`}
                    >
                      {action.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 底部按键提示 */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-2 text-[11px] text-slate-500 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
