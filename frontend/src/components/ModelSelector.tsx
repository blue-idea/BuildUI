import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Sparkles, Settings } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { parseConfiguredProviders, isProviderConfigured } from '../config/providers';

export interface ModelSelectorProps {
  /** 当前选中的项：'auto' 或 'configured' 或 'provider:<id>' */
  value: string;
  /** 选择项变更时的回调 */
  onChange: (value: string) => void;
  /** 设置中配置的提供商名称（向后兼容） */
  configuredProvider?: string;
  /** 设置中配置的模型名称（向后兼容） */
  configuredModel?: string;
  /** 全部系统设置字典，用于解析所有 provider 状态 */
  settings?: Record<string, string>;
  /** 点击管理服务商回调 */
  onOpenSettings?: () => void;
  /** 额外的样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 下拉浮层展开方向，默认为 top（向上展开） */
  placement?: 'top' | 'bottom';
}

interface ConfiguredOption {
  id: string; // 'provider:<id>' 或 'configured'
  provider: string;
  model: string;
  label: string;
}

/**
 * 模型选择下拉组件
 * 默认选中 auto，动态从当前设置中获取已配置的 Provider 及其模型，并提供快捷管理入口
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  configuredProvider,
  configuredModel,
  settings,
  onOpenSettings,
  className = '',
  disabled = false,
  placement = 'top',
}) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 动态从 settings 中解析所有已设置的服务商
  const configuredList = useMemo<ConfiguredOption[]>(() => {
    if (settings && Object.keys(settings).length > 0) {
      const allProviders = parseConfiguredProviders(settings);
      const configured = allProviders.filter(isProviderConfigured);

      if (configured.length > 0) {
        return configured.map((cp) => ({
          id: `provider:${cp.id}`,
          provider: cp.name,
          model: cp.model,
          label: `${cp.name} (${cp.model})`,
        }));
      }
    }

    // 回退到向后兼容 props
    if (configuredModel || configuredProvider) {
      return [
        {
          id: 'configured',
          provider: configuredProvider || 'Configured Provider',
          model: configuredModel || 'Default Model',
          label: configuredModel || configuredProvider || 'Configured Provider',
        },
      ];
    }
    return [];
  }, [settings, configuredProvider, configuredModel]);

  // 格式化当前触发按钮展示标签
  const displayLabel = useMemo(() => {
    if (value === 'auto') {
      return t('chat.modelAuto') || 'Auto';
    }
    if (value === 'configured') {
      return configuredModel || configuredProvider || 'Configured';
    }
    if (value.startsWith('provider:')) {
      const match = configuredList.find((opt) => opt.id === value);
      if (match) {
        return match.model || match.provider;
      }
      return value.replace('provider:', '');
    }
    return t('chat.modelAuto') || 'Auto';
  }, [value, configuredList, configuredModel, configuredProvider, t]);

  // 点击外部收起浮层
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

  const handleManageClick = () => {
    setIsOpen(false);
    onOpenSettings?.();
  };

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
        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-700/70 border border-slate-200 dark:border-zinc-600 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-650 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/60 disabled:opacity-50"
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
          className={`absolute ${placement === 'bottom' ? 'right-0 top-full mt-1.5' : 'left-0 bottom-full mb-1.5'} min-w-[230px] rounded-xl border border-slate-200/90 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100`}
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
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700/60'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="flex flex-col text-left truncate">
                <span className="truncate">Auto</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  {t('chat.modelAutoDesc') || 'Automatically routes to configured model'}
                </span>
              </div>
            </div>
            {value === 'auto' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
          </button>

          {/* 已配置的 Provider / Model 列表 */}
          {configuredList.length > 0 ? (
            configuredList.map((opt) => {
              const isSelected = value === opt.id || (value === 'configured' && configuredList.length === 1);
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 mt-0.5 text-xs rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  <div className="flex flex-col text-left truncate">
                    <span className="truncate font-mono text-[11px] font-medium">{opt.model}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 capitalize">
                      {opt.provider}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-2 py-1.5 text-[11px] text-slate-400 dark:text-zinc-500 italic">
              {t('chat.noProviderConfigured') || 'No provider configured in Settings'}
            </div>
          )}

          {/* 底部管理服务商操作项 */}
          <div className="border-t border-slate-100 dark:border-zinc-700 mt-1 pt-1">
            <button
              type="button"
              onClick={handleManageClick}
              aria-label="Manage Providers"
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700/60 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{t('chat.manageProviders') || 'Manage Providers...'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
