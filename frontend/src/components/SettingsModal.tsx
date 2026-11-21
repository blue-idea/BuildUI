import React, { useState, useEffect } from 'react';
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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialSettings = {},
  onSave,
  onTestConnection,
}) => {
  const { t } = useI18n();
  const [provider, setProvider] = useState<string>(initialSettings['llm.provider'] || 'openai');
  const [baseURL, setBaseURL] = useState<string>(
    initialSettings['llm.base_url'] || PRESETS['openai'].baseURL
  );
  const [apiKey, setApiKey] = useState<string>(initialSettings['llm.api_key'] || '');
  const [model, setModel] = useState<string>(
    initialSettings['llm.model'] || PRESETS['openai'].model
  );

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSettings['llm.provider']) {
      setProvider(initialSettings['llm.provider']);
      setBaseURL(initialSettings['llm.base_url'] || '');
      setApiKey(initialSettings['llm.api_key'] || '');
      setModel(initialSettings['llm.model'] || '');
    }
  }, [initialSettings]);

  if (!isOpen) return null;

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextProvider = e.target.value;
    setProvider(nextProvider);
    if (PRESETS[nextProvider]) {
      setBaseURL(PRESETS[nextProvider].baseURL);
      setModel(PRESETS[nextProvider].model);
    }
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!onTestConnection) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(baseURL, apiKey, model);
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
        await onSave({
          'llm.provider': provider,
          'llm.base_url': baseURL,
          'llm.api_key': apiKey,
          'llm.model': model,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
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

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-sm">
          {/* 提供方选择 */}
          <div>
            <label htmlFor="llm-provider-select" className="block text-xs font-medium text-slate-300">
              {t('modals.providerLabel')}
            </label>
            <select
              id="llm-provider-select"
              value={provider}
              onChange={handleProviderChange}
              aria-label={t('modals.providerLabel')}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="openai">OpenAI (Official)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="custom">Custom (OpenAI-compatible)</option>
            </select>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300">{t('modals.baseUrlLabel')}</label>
            <input
              type="text"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder={PRESETS[provider]?.baseURL || 'https://api.openai.com/v1'}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-medium text-slate-300">{t('modals.apiKeyLabel')}</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono text-xs"
            />
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300">{t('modals.modelLabel')}</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o"
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
