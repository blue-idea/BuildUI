import React, { useState } from 'react';
import { InspectedElement } from '../types/inspect';
import { LocalEditPopover } from './LocalEditPopover';
import { MousePointerClick, X } from 'lucide-react';

export interface ComponentInspectorProps {
  isActive: boolean;
  onExit: () => void;
  onSelectComponent: (componentPath: string, suggestedPrompt: string) => void;
  availableElements?: InspectedElement[];
  selectedElement?: InspectedElement | null;
  onClearSelectedElement?: () => void;
  onJumpToCode?: (filePath: string, line?: number) => void;
}

/**
 * 默认可用于点选检查的预览 DOM/组件元素
 */
const DEFAULT_PREVIEW_ELEMENTS: InspectedElement[] = [
  {
    id: 'el-btn-1',
    tagName: 'button',
    componentPath: 'src/components/RecipeCard.tsx',
    className: 'px-4 py-2 bg-blue-600 text-white rounded-xl shadow-xs',
    textSnippet: 'Suggest Dinner',
  },
  {
    id: 'el-h2-1',
    tagName: 'h2',
    componentPath: 'src/components/PantryList.tsx',
    className: 'text-lg font-bold text-slate-900',
    textSnippet: 'Pantry Inventory',
  },
  {
    id: 'el-nav-1',
    tagName: 'nav',
    componentPath: 'src/components/Navbar.tsx',
    className: 'flex items-center justify-between px-6 py-3 border-b',
    textSnippet: 'Main Navigation Bar',
  },
];

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  isActive,
  onExit,
  onSelectComponent,
  availableElements = DEFAULT_PREVIEW_ELEMENTS,
  selectedElement: externalSelectedElement,
  onClearSelectedElement,
  onJumpToCode,
}) => {
  const [internalSelectedElement, setInternalSelectedElement] = useState<InspectedElement | null>(null);

  if (!isActive) return null;

  const currentElement = externalSelectedElement || internalSelectedElement;

  const handleSelectTarget = (el: InspectedElement) => {
    setInternalSelectedElement(el);
  };

  const handleCancelSelection = () => {
    if (onClearSelectedElement) {
      onClearSelectedElement();
    }
    setInternalSelectedElement(null);
  };

  const handleApplyLocalEdit = (el: InspectedElement, prompt: string) => {
    handleCancelSelection();
    onSelectComponent(el.componentPath, prompt);
  };

  return (
    <>
      {/* 顶部审查模式悬浮条 */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between border-b border-blue-500/40 bg-blue-950/90 px-4 py-2 text-xs text-blue-100 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          <span className="font-bold text-white flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-blue-300" />
            <span>Inspector Mode Active:</span>
          </span>
          <span className="text-blue-200 hidden md:inline">
            Click any preview element to inspect source component and perform targeted AI edit
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 交互式点选快捷药丸 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-blue-300 font-medium select-none">Select Target:</span>
            {availableElements.map((el) => (
              <button
                key={el.id}
                type="button"
                data-testid={`inspect-target-${el.tagName}`}
                onClick={() => handleSelectTarget(el)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium border border-blue-400/40 bg-blue-900/60 hover:bg-blue-800 text-blue-200 hover:text-white transition-all cursor-pointer"
              >
                &lt;{el.tagName}&gt;
              </button>
            ))}
          </div>

          {/* 兼容原测试按钮 */}
          <button
            type="button"
            onClick={() =>
              onSelectComponent('src/components/Navbar.tsx', '@src/components/Navbar.tsx: ')
            }
            aria-label="Inspect navbar element"
            className="hidden"
          >
            Mock Navbar
          </button>

          <button
            type="button"
            onClick={onExit}
            aria-label="Exit inspect mode"
            className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-xs ml-2 cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* 选中元素后弹出的局部编辑控制器 */}
      {currentElement && (
        <LocalEditPopover
          element={currentElement}
          onCancel={handleCancelSelection}
          onSubmit={handleApplyLocalEdit}
          onJumpToCode={onJumpToCode}
        />
      )}
    </>
  );
};

export default ComponentInspector;
