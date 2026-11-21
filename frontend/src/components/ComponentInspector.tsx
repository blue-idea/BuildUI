import React from 'react';

export interface ComponentInspectorProps {
  isActive: boolean;
  onExit: () => void;
  onSelectComponent: (componentPath: string, suggestedPrompt: string) => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  isActive,
  onExit,
  onSelectComponent,
}) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between border-b border-indigo-500/50 bg-indigo-950/90 px-4 py-2 text-xs text-indigo-100 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
        <span className="font-semibold text-white">Inspector Mode Active:</span>
        <span className="text-indigo-200">
          Click any preview element to inspect source component and inject prompt
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* 模拟元素检查按钮，兼顾单元测试与原型交互 */}
        <button
          type="button"
          onClick={() =>
            onSelectComponent('src/components/Navbar.tsx', '@src/components/Navbar.tsx: ')
          }
          aria-label="Inspect navbar element"
          className="rounded border border-indigo-700/60 bg-indigo-900/60 px-2 py-0.5 text-[11px] text-indigo-300 hover:bg-indigo-800 hover:text-white transition-colors"
        >
          Mock Navbar
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit inspect mode"
          className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm"
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export default ComponentInspector;
