import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Sparkles, Settings } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

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
}

interface ConfiguredOption {
  id: string; // 'provider:openai' 或 'configured'
  provider: string;
  model: string;
  label: string;
}

const KNOWN_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o' },
  { id: 'deepseek', name: 'DeepSeek', defaultModel: 'deepseek-chat' },
  { id: 'ollama', name: 'Ollama', defaultModel: 'qwen2.5-coder' },
  { id: 'custom', name: 'Custom', defaultModel: 'gpt-4o' },
];

/**
 * 模型选择下拉组件
 * 默认选中 auto，可动态列出所有已配置的服务商及其模型，并提供管理设置快捷入口
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
}) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 解析所有已配置服务商
  const configuredList = useMemo<ConfiguredOption[]>(() => {
    if (settings) {
      const list: ConfiguredOption[] = [];
      KNOWN_PROVIDERS.forEach((kp) => {
        const prefix = `llm.providers.${kp.id}.`;
        const isLegacy = settings['llm.provider'] === kp.id;
        const apiKey = settings[prefix + 'api_key'] || (isLegacy ? settings['llm.api_key'] : '') || '';
        const baseURL = settings[prefix + 'base_url'] || (isLegacy ? settings['llm.base_url'] : '') || '';
        const model =
          settings[prefix + 'model'] ||
          (isLegacy ? settings['llm.model'] : '') ||
          kp.defaultModel;

        // 若配置了 API Key，或为无需 API Key 的 Ollama/自定义端点
        const isConfigured = Boolean(apiKey || (kp.id === 'ollama' && baseURL) || (baseURL && kp.id === 'custom'));
        if (isConfigured) {
          list.push({
            id: `provider:${kp.id}`,
            provider: kp.name,
            model: model || kp.defaultModel,
            label: `${kp.name} (${model || kp.defaultModel})`,
          });
        }
      });
      if (list.length > 0) {
        return list;
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
          className="absolute left-0 bottom-full mb-1.5 min-w-[230px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
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
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium'
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
                    <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
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
