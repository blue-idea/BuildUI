import React, { useState } from 'react';
import { InspectedElement } from '../types/inspect';
import { LocalEditPopover } from './LocalEditPopover';
import { MousePointerClick, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

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
    boxModel: {
      margin: { top: 8, right: 8, bottom: 8, left: 8 },
      border: { top: 1, right: 1, bottom: 1, left: 1 },
      padding: { top: 8, right: 16, bottom: 8, left: 16 },
      content: { width: 120, height: 36 },
      rect: { top: 140, left: 220, width: 154, height: 54, x: 220, y: 140 },
    },
  },
  {
    id: 'el-h2-1',
    tagName: 'h2',
    componentPath: 'src/components/PantryList.tsx',
    className: 'text-lg font-bold text-slate-900',
    textSnippet: 'Pantry Inventory',
    boxModel: {
      margin: { top: 16, right: 0, bottom: 8, left: 0 },
      border: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      content: { width: 260, height: 28 },
      rect: { top: 80, left: 220, width: 260, height: 28, x: 220, y: 80 },
    },
  },
  {
    id: 'el-nav-1',
    tagName: 'nav',
    componentPath: 'src/components/Navbar.tsx',
    className: 'flex items-center justify-between px-6 py-3 border-b',
    textSnippet: 'Main Navigation Bar',
    boxModel: {
      margin: { top: 0, right: 0, bottom: 12, left: 0 },
      border: { top: 0, right: 0, bottom: 1, left: 0 },
      padding: { top: 12, right: 24, bottom: 12, left: 24 },
      content: { width: 640, height: 48 },
      rect: { top: 20, left: 20, width: 688, height: 73, x: 20, y: 20 },
    },
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
  const { t } = useI18n();
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
      {/* 顶部审查模式悬浮条（浅色/深色双模毛玻璃材质） */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between border-b border-blue-200/80 dark:border-blue-500/30 bg-white/85 dark:bg-zinc-900/85 px-4 py-2 text-xs text-slate-700 dark:text-zinc-200 shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-top-2 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t('localEdit.modeBannerTitle')}</span>
          </span>
          <span className="text-slate-500 dark:text-zinc-400 hidden md:inline">
            {t('localEdit.modeBannerDesc')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 交互式点选快捷药丸 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium select-none">{t('localEdit.selectTarget')}</span>
            {availableElements.map((el) => (
              <button
                key={el.id}
                type="button"
                data-testid={`inspect-target-${el.tagName}`}
                onClick={() => handleSelectTarget(el)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium border border-blue-200/80 dark:border-blue-500/35 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-all cursor-pointer"
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
            <span>{t('localEdit.exit')}</span>
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
