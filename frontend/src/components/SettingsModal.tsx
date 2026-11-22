import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  HardDrive,
  Folder,
  Palette,
  Sliders,
  X,
  RefreshCw,
  FolderOpen,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useMacOSTheme } from '../context/ThemeContext';
import { selectDirectory } from '../services/wailsBridge';

export type SettingsNavTab = 'models' | 'workspace' | 'appearance' | 'general';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings?: Record<string, string>;
  onSave?: (settings: Record<string, string>) => Promise<void> | void;
  onTestConnection?: (baseURL: string, apiKey: string, model: string) => Promise<string | boolean>;
  onSelectDirectory?: () => Promise<string | undefined> | void;
  defaultWorkspaceDir?: string;
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
  onSelectDirectory,
  defaultWorkspaceDir = '/workspace/default-app',
}) => {
  const { t, locale, setLocale } = useI18n();
  // 接入 macOS 主题 Hook 获取暗黑模式状态与切换方法
  const { isDark, toggleTheme } = useMacOSTheme();

  const serializedSettings = useMemo(() => JSON.stringify(initialSettings || {}), [initialSettings]);

  // 左侧导航大选项卡
  const [activeNavTab, setActiveNavTab] = useState<SettingsNavTab>('models');

  // 当前全局默认活跃的大模型服务商
  const [activeProvider, setActiveProvider] = useState<string>('openai');
  // 当前正在查看/编辑的服务商选项卡
  const [currentProviderTab, setCurrentProviderTab] = useState<string>('openai');

  // 本地工作区存储路径
  const [workspaceDir, setWorkspaceDir] = useState<string>(() => {
    return initialSettings['workspace.dir'] || defaultWorkspaceDir;
  });

  // 各服务商的隔离表单数据
  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderCredentials>>(() =>
    buildInitialConfigs(initialSettings || {})
  );

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const parsed: Record<string, string> = JSON.parse(serializedSettings);
    const defaultActive = parsed['llm.active_provider'] || parsed['llm.provider'] || 'openai';
    setActiveProvider(defaultActive);
    setCurrentProviderTab(defaultActive);
    setProviderConfigs(buildInitialConfigs(parsed));
    setWorkspaceDir(parsed['workspace.dir'] || defaultWorkspaceDir);
  }, [serializedSettings, defaultWorkspaceDir]);

  if (!isOpen) return null;

  const currentConfig = providerConfigs[currentProviderTab] || {
    baseURL: '',
    apiKey: '',
    model: '',
  };

  const handleFieldChange = (field: keyof ProviderCredentials, val: string) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [currentProviderTab]: {
        ...prev[currentProviderTab],
        [field]: val,
      },
    }));
    setTestResult(null);
  };

  const handleProviderSwitch = (providerId: string) => {
    setCurrentProviderTab(providerId);
    setTestResult(null);
  };

  const handleSelectWorkspaceFolder = async () => {
    try {
      if (onSelectDirectory) {
        const selected = await onSelectDirectory();
        if (selected) {
          setWorkspaceDir(selected);
          return;
        }
      }
      const dir = await selectDirectory(t('settingsModal.workspaceTitle'));
      if (dir) {
        setWorkspaceDir(dir);
      }
    } catch (e) {
      console.warn('Failed to select workspace directory:', e);
    }
  };

  const handleResetWorkspaceDir = () => {
    setWorkspaceDir(defaultWorkspaceDir);
  };

  const handleTest = async () => {
    if (!onTestConnection) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(currentConfig.baseURL, currentConfig.apiKey, currentConfig.model);
      if (typeof res === 'string') {
        setTestResult({ success: true, message: res });
      } else if (res === true) {
        setTestResult({ success: true, message: 'Connection successful' });
      } else {
        setTestResult({ success: false, message: 'Connection failed' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (onSave) {
        const payload: Record<string, string> = {
          'workspace.dir': workspaceDir.trim(),
          'llm.active_provider': activeProvider,
          'llm.provider': activeProvider,
          'llm.base_url': providerConfigs[activeProvider]?.baseURL || '',
          'llm.api_key': providerConfigs[activeProvider]?.apiKey || '',
          'llm.model': providerConfigs[activeProvider]?.model || '',
        };

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

  const navItems = [
    {
      id: 'models' as const,
      testId: 'settings-nav-models',
      label: t('settingsModal.tabModels'),
      icon: Sparkles,
    },
    {
      id: 'workspace' as const,
      testId: 'settings-nav-workspace',
      label: t('settingsModal.tabWorkspace'),
      icon: HardDrive,
    },
    {
      id: 'appearance' as const,
      testId: 'settings-nav-appearance',
      label: t('settingsModal.tabAppearance'),
      icon: Palette,
    },
    {
      id: 'general' as const,
      testId: 'settings-nav-general',
      label: t('settingsModal.tabGeneral'),
      icon: Sliders,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl h-[560px] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-zinc-100 transition-colors">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-950/60 select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500/80 inline-block" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {t('settingsModal.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('settingsModal.closeAria')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 左右分栏主体 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧垂直选项卡导航 */}
          <aside
            role="tablist"
            aria-label="Settings Navigation Tabs"
            className="w-52 shrink-0 bg-slate-50/70 dark:bg-zinc-950/60 border-r border-slate-200 dark:border-zinc-800 p-3 flex flex-col justify-between select-none"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeNavTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    data-testid={item.testId}
                    aria-selected={isSelected}
                    onClick={() => setActiveNavTab(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="px-2 py-1 text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
              BuildUI v0.1.0
            </div>
          </aside>

          {/* 右侧表单内容区域 */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
            <form onSubmit={handleSave} className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 1. 大模型服务 (Models & LLM) */}
                {activeNavTab === 'models' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                        {t('modals.settingsTitle')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {t('settingsModal.modelsDesc')}
                      </p>
                    </div>

                    {/* 服务商切换选项卡 */}
                    <div
                      role="tablist"
                      aria-label="Provider Tabs"
                      className="flex space-x-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2"
                    >
                      {PROVIDERS.map((p) => {
                        const isSelected = currentProviderTab === p.id;
                        const isDefault = activeProvider === p.id;
                        return (
                          <button
                            key={p.id}
                            role="tab"
                            type="button"
                            aria-selected={isSelected}
                            onClick={() => handleProviderSwitch(p.id)}
                            className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              isSelected
                                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs border border-slate-200/80 dark:border-zinc-700'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60'
                            }`}
                          >
                            <span>{p.name.split(' ')[0]}</span>
                            {isDefault && (
                              <span className="ml-1.5 px-1 py-0.2 text-[9px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">
                                Default
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* 兼容下拉框 */}
                    <div className="hidden">
                      <label htmlFor="llm-provider-select" className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                        {t('modals.providerLabel')}
                      </label>
                      <select
                        id="llm-provider-select"
                        value={currentProviderTab}
                        onChange={(e) => handleProviderSwitch(e.target.value)}
                        aria-label={t('modals.providerLabel')}
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 设为全局默认活跃 Provider */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-zinc-800/40 p-3 border border-slate-200 dark:border-zinc-800">
                      <div className="text-xs text-slate-700 dark:text-zinc-300">
                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                          {PROVIDERS.find((p) => p.id === currentProviderTab)?.name}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          Use as primary LLM for Auto mode in chat
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveProvider(currentProviderTab)}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                          activeProvider === currentProviderTab
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-600'
                        }`}
                      >
                        {activeProvider === currentProviderTab ? '✓ Active Default' : 'Set as Default'}
                      </button>
                    </div>

                    {/* Base URL */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                        {t('modals.baseUrlLabel')}
                      </label>
                      <input
                        type="text"
                        value={currentConfig.baseURL}
                        onChange={(e) => handleFieldChange('baseURL', e.target.value)}
                        placeholder={PRESETS[currentProviderTab]?.baseURL || 'https://api.openai.com/v1'}
                        className="mt-1 w-full rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                        {t('modals.apiKeyLabel')}
                      </label>
                      <input
                        type="password"
                        value={currentConfig.apiKey}
                        onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                        placeholder="sk-..."
                        className="mt-1 w-full rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-all"
                      />
                    </div>

                    {/* Model Name */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                        {t('modals.modelLabel')}
                      </label>
                      <input
                        type="text"
                        value={currentConfig.model}
                        onChange={(e) => handleFieldChange('model', e.target.value)}
                        placeholder={PRESETS[currentProviderTab]?.model || 'gpt-4o'}
                        className="mt-1 w-full rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-all"
                      />
                    </div>

                    {/* 测试连通性反馈 */}
                    {testResult && (
                      <div
                        className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                          testResult.success
                            ? 'border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                            : 'border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        <span>{testResult.success ? '✓' : '✗'}</span>
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. 存储与本地工作区设置 (Storage & Workspace) */}
                {activeNavTab === 'workspace' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                        {t('settingsModal.workspaceTitle')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {t('settingsModal.workspaceDesc')}
                      </p>
                    </div>

                    {/* 工作区存储路径输入组 */}
                    <div className="space-y-2">
                      <label
                        htmlFor="workspace-dir-input"
                        className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
                      >
                        {t('settingsModal.workspaceDirLabel')}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Folder className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="workspace-dir-input"
                            data-testid="workspace-dir-input"
                            type="text"
                            value={workspaceDir}
                            onChange={(e) => setWorkspaceDir(e.target.value)}
                            placeholder={t('settingsModal.workspaceDirPlaceholder')}
                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-800/60 pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          data-testid="browse-workspace-btn"
                          onClick={handleSelectWorkspaceFolder}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700/80 transition-colors shrink-0 shadow-2xs"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>{t('settingsModal.browseFolder')}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {t('settingsModal.workspaceDirHelp')}
                      </p>
                    </div>

                    {/* 重置默认工作区路径快捷按钮 */}
                    <div className="pt-2">
                      <button
                        type="button"
                        data-testid="reset-workspace-btn"
                        onClick={handleResetWorkspaceDir}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{t('settingsModal.resetDefault')}</span>
                      </button>
                    </div>

                    {/* 存储路径卡片展示 */}
                    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/30 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-zinc-200">
                        <HardDrive className="w-4 h-4 text-blue-500" />
                        <span>Storage Persistence Status</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1">
                        <div>• Active Workspace: <span className="font-mono text-slate-700 dark:text-zinc-300">{workspaceDir || defaultWorkspaceDir}</span></div>
                        <div>• Storage Type: Local File System with Git auto-versioning</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. 外观与主题 (Appearance) */}
                {activeNavTab === 'appearance' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                        {t('settingsModal.appearanceTitle')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {t('settingsModal.appearanceDesc')}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                        {t('settingsModal.themeModeLabel')}
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-w-sm">
                        <button
                          type="button"
                          data-testid="theme-mode-light"
                          onClick={() => {
                            if (isDark) toggleTheme();
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            !isDark
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-2xs'
                              : 'border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <Sun className="w-4 h-4 text-amber-500" />
                          <div>
                            <div className="text-xs font-medium">{t('settingsModal.themeModeLight')}</div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400">Clean MacOS Bright</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          data-testid="theme-mode-dark"
                          onClick={() => {
                            if (!isDark) toggleTheme();
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            isDark
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-2xs'
                              : 'border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <Moon className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="text-xs font-medium">{t('settingsModal.themeModeDark')}</div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400">High Contrast Slate</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. 通用偏好 (General) */}
                {activeNavTab === 'general' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                        {t('settingsModal.generalTitle')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {t('settingsModal.generalDesc')}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                        {t('language.toggle')}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLocale('zh')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            locale === 'zh'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>中文 (简体)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocale('en')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            locale === 'en'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>English</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 底部按钮栏 */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 px-6 py-3 select-none">
                <div>
                  {activeNavTab === 'models' && (
                    <button
                      type="button"
                      disabled={testing}
                      onClick={handleTest}
                      className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 shadow-2xs"
                    >
                      {testing ? t('modals.testing') : t('modals.testConnection')}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-3.5 py-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-medium text-white shadow-2xs active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? t('common.loading') : t('modals.saveSettings')}
                  </button>
                </div>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
};
