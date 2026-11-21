import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface ModelSelectorProps {
  /** 当前选中的项：'auto' 或 'configured' */
  value: string;
  /** 选择项变更时的回调 */
  onChange: (value: string) => void;
  /** 设置中配置的提供商名称（如 deepseek, openai） */
  configuredProvider?: string;
  /** 设置中配置的模型名称（如 deepseek-v4-flash, gpt-4o） */
  configuredModel?: string;
  /** 额外的样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 模型选择下拉组件
 * 默认选中 auto，可选择在设置中配置的 provider/model
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  configuredProvider,
  configuredModel,
  className = '',
  disabled = false,
}) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 格式化展示标签
  const configuredLabel = configuredModel || configuredProvider || 'Configured Provider';
  const displayLabel = value === 'configured' && (configuredModel || configuredProvider)
    ? configuredLabel
    : t('chat.modelAuto') || 'Auto';

  // 点击外部自动收起下拉浮层
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const hasConfigured = Boolean(configuredModel || configuredProvider);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* 触发按钮 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Model selector"
        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-700/70 border border-slate-200 dark:border-zinc-600 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-650 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50"
      >
        <span className="truncate max-w-[140px]">{displayLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 下拉浮层 */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Model options"
          className="absolute left-0 bottom-full mb-1.5 min-w-[220px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {t('chat.selectModelProvider') || 'Select Model / Provider'}
          </div>

          {/* 自动选项 (默认) */}
          <button
            type="button"
            role="option"
            aria-selected={value === 'auto'}
            onClick={() => handleSelect('auto')}
            className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors ${
              value === 'auto'
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium'
                : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700/60'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              <div className="flex flex-col text-left truncate">
                <span className="truncate">Auto</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  {t('chat.modelAutoDesc') || 'Automatically routes to configured model'}
                </span>
              </div>
            </div>
            {value === 'auto' && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />}
          </button>

          {/* 配置的 Provider / Model 选项 */}
          {hasConfigured ? (
            <button
              type="button"
              role="option"
              aria-selected={value === 'configured'}
              onClick={() => handleSelect('configured')}
              className={`w-full flex items-center justify-between px-2 py-1.5 mt-0.5 text-xs rounded-lg transition-colors ${
                value === 'configured'
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium'
                  : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700/60'
              }`}
            >
              <div className="flex flex-col text-left truncate">
                <span className="truncate font-mono text-[11px] font-medium">{configuredLabel}</span>
                {configuredProvider && (
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 capitalize">
                    {configuredProvider}
                  </span>
                )}
              </div>
              {value === 'configured' && (
                <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              )}
            </button>
          ) : (
            <div className="px-2 py-1.5 text-[11px] text-slate-400 dark:text-zinc-500 italic">
              {t('chat.noProviderConfigured') || 'No provider configured in Settings'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
