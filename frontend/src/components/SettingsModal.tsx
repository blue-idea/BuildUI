import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings?: Record<string, string>;
  onSave?: (settings: Record<string, string>) => Promise<void> | void;
  onTestConnection?: (baseURL: string, apiKey: string, model: string) => Promise<string | boolean>;
}

const PRESETS: Record<string, { baseURL: string; model: string }> = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  ollama: {
    baseURL: 'http://localhost:11434/v1',
    model: 'qwen2.5-coder',
  },
  custom: {
    baseURL: '',
    model: '',
  },
};

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI (Official)' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'ollama', name: 'Ollama (Local)' },
  { id: 'custom', name: 'Custom (OpenAI-compatible)' },
];

interface ProviderCredentials {
  baseURL: string;
  apiKey: string;
  model: string;
}

const buildInitialConfigs = (settings: Record<string, string>): Record<string, ProviderCredentials> => {
  const configs: Record<string, ProviderCredentials> = {};
  PROVIDERS.forEach(({ id }) => {
    const prefix = `llm.providers.${id}.`;
    const isLegacy = settings['llm.provider'] === id;
    configs[id] = {
      baseURL:
        settings[prefix + 'base_url'] ||
        (isLegacy ? settings['llm.base_url'] : '') ||
        PRESETS[id]?.baseURL ||
        '',
      apiKey:
        settings[prefix + 'api_key'] ||
        (isLegacy ? settings['llm.api_key'] : '') ||
        '',
      model:
        settings[prefix + 'model'] ||
        (isLegacy ? settings['llm.model'] : '') ||
        PRESETS[id]?.model ||
        '',
    };
  });
  return configs;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialSettings = {},
  onSave,
  onTestConnection,
}) => {
  const { t } = useI18n();

  const serializedSettings = useMemo(() => JSON.stringify(initialSettings || {}), [initialSettings]);

  // 当前全局默认活跃的提供商
  const [activeProvider, setActiveProvider] = useState<string>('openai');
  // 当前正在查看/编辑的选项卡提供商
  const [currentTab, setCurrentTab] = useState<string>('openai');

  // 各服务商的隔离表单数据
  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderCredentials>>(() =>
    buildInitialConfigs(initialSettings || {})
  );

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const parsed: Record<string, string> = initialSettings || {};
    const defaultActive = parsed['llm.active_provider'] || parsed['llm.provider'] || 'openai';
    setActiveProvider(defaultActive);
    setCurrentTab(defaultActive);
    setProviderConfigs(buildInitialConfigs(parsed));
  }, [serializedSettings]);

  if (!isOpen) return null;

  const currentConfig = providerConfigs[currentTab] || {
    baseURL: '',
    apiKey: '',
    model: '',
  };

  const handleFieldChange = (field: keyof ProviderCredentials, val: string) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [currentTab]: {
        ...prev[currentTab],
        [field]: val,
      },
    }));
    setTestResult(null);
  };

  const handleTabSwitch = (providerId: string) => {
    setCurrentTab(providerId);
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!onTestConnection) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(currentConfig.baseURL, currentConfig.apiKey, currentConfig.model);
      if (typeof res === 'string') {
        setTestResult({ success: true, message: res });
      } else {
        setTestResult({ success: true, message: 'Connection established successfully' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({ success: false, message: msg || 'Failed to connect to LLM server' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (onSave) {
        // 构建全量隔离持久化映射
        const payload: Record<string, string> = {
          'llm.active_provider': activeProvider,
          'llm.provider': activeProvider,
          'llm.base_url': providerConfigs[activeProvider]?.baseURL || '',
          'llm.api_key': providerConfigs[activeProvider]?.apiKey || '',
          'llm.model': providerConfigs[activeProvider]?.model || '',
        };

        // 按 Provider 独立前缀写入
        PROVIDERS.forEach(({ id }) => {
          const cfg = providerConfigs[id];
          if (cfg) {
            payload[`llm.providers.${id}.base_url`] = cfg.baseURL;
            payload[`llm.providers.${id}.api_key`] = cfg.apiKey;
            payload[`llm.providers.${id}.model`] = cfg.model;
          }
        });

        await onSave(payload);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-semibold text-white">{t('modals.settingsTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 顶部服务商选项卡 (Tabs) */}
        <div role="tablist" aria-label="Provider Tabs" className="mt-4 flex space-x-1 border-b border-slate-800 pb-2">
          {PROVIDERS.map((p) => {
            const isSelected = currentTab === p.id;
            const isDefault = activeProvider === p.id;
            return (
              <button
                key={p.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                onClick={() => handleTabSwitch(p.id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span>{p.name.split(' ')[0]}</span>
                {isDefault && (
                  <span className="ml-1.5 px-1 py-0.2 text-[9px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                    Default
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-sm">
          {/* 隐藏兼容下拉框供辅助或测试快捷选择 */}
          <div className="hidden">
            <label htmlFor="llm-provider-select" className="block text-xs font-medium text-slate-300">
              {t('modals.providerLabel')}
            </label>
            <select
              id="llm-provider-select"
              value={currentTab}
              onChange={(e) => handleTabSwitch(e.target.value)}
              aria-label={t('modals.providerLabel')}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 设为全局默认活跃 Provider 单选勾选 */}
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-2.5 border border-slate-800">
            <div className="text-xs text-slate-300">
              <span className="font-medium text-white">{PROVIDERS.find((p) => p.id === currentTab)?.name}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Use as primary LLM for Auto mode in chat</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveProvider(currentTab)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                activeProvider === currentTab
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {activeProvider === currentTab ? '✓ Active Default' : 'Set as Default'}
            </button>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300">{t('modals.baseUrlLabel')}</label>
            <input
              type="text"
              value={currentConfig.baseURL}
              onChange={(e) => handleFieldChange('baseURL', e.target.value)}
              placeholder={PRESETS[currentTab]?.baseURL || 'https://api.openai.com/v1'}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-medium text-slate-300">{t('modals.apiKeyLabel')}</label>
            <input
              type="password"
              value={currentConfig.apiKey}
              onChange={(e) => handleFieldChange('apiKey', e.target.value)}
              placeholder="sk-..."
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono text-xs"
            />
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300">{t('modals.modelLabel')}</label>
            <input
              type="text"
              value={currentConfig.model}
              onChange={(e) => handleFieldChange('model', e.target.value)}
              placeholder={PRESETS[currentTab]?.model || 'gpt-4o'}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono text-xs"
            />
          </div>

          {/* 测试连接反馈信息 */}
          {testResult && (
            <div
              className={`rounded-lg p-2.5 text-xs ${
                testResult.success
                  ? 'border border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                  : 'border border-rose-800/60 bg-rose-950/40 text-rose-300'
              }`}
            >
              {testResult.success ? '✓ ' : '✗ '}
              {testResult.message}
            </div>
          )}

          {/* 底部按钮栏 */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={testing}
              onClick={handleTest}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            >
              {testing ? t('modals.testing') : t('modals.testConnection')}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {saving ? t('common.loading') : t('modals.saveSettings')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
