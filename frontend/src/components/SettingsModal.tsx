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
  Plus,
  Trash2,
  Server,
  Layers,
  Edit2,
  Check,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useMacOSTheme } from '../context/ThemeContext';
import { selectDirectory } from '../services/wailsBridge';
import {
  ProviderConfig,
  DEFAULT_PROVIDER_PRESETS,
  parseConfiguredProviders,
  serializeProviders,
  isProviderConfigured,
} from '../config/providers';

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
  const { isDark, toggleTheme } = useMacOSTheme();

  const serializedSettings = useMemo(() => JSON.stringify(initialSettings || {}), [initialSettings]);

  // 左侧导航大选项卡
  const [activeNavTab, setActiveNavTab] = useState<SettingsNavTab>('models');

  // 当前默认/激活的服务商 ID
  const [activeProvider, setActiveProvider] = useState<string>('openai');

  // 所有提供商配置列表（统一管理内置预设与用户自定义/设置的 Provider）
  const [providers, setProviders] = useState<ProviderConfig[]>(() =>
    parseConfiguredProviders(initialSettings)
  );

  // 当前正在编辑的 Provider ID
  const [editingProviderId, setEditingProviderId] = useState<string>('openai');

  // 临时编辑中的表单状态（统一三要素：URL, Key, Model Name 以及 Name）
  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    url: string;
    key: string;
    model: string;
    isCustom?: boolean;
  }>({
    id: 'openai',
    name: 'OpenAI (Official)',
    url: 'https://api.openai.com/v1',
    key: '',
    model: 'gpt-4o',
  });

  // 本地工作区存储路径
  const [workspaceDir, setWorkspaceDir] = useState<string>(() => {
    return initialSettings['workspace.dir'] || defaultWorkspaceDir;
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // 初始化与重载 settings
  useEffect(() => {
    const parsed: Record<string, string> = JSON.parse(serializedSettings);
    const parsedProviders = parseConfiguredProviders(parsed);
    setProviders(parsedProviders);

    const defaultActive =
      parsed['llm.active_provider'] || parsed['llm.provider'] || (parsedProviders[0]?.id ?? 'openai');
    setActiveProvider(defaultActive);

    // 默认进入当前激活项或第一个提供商的编辑视图
    const target = parsedProviders.find((p) => p.id === defaultActive) || parsedProviders[0];
    if (target) {
      setEditingProviderId(target.id);
      setEditForm({
        id: target.id,
        name: target.name,
        url: target.url,
        key: target.key,
        model: target.model,
        isCustom: target.isCustom,
      });
    }
    setWorkspaceDir(parsed['workspace.dir'] || defaultWorkspaceDir);
  }, [serializedSettings, defaultWorkspaceDir]);

  if (!isOpen) return null;

  // 切换当前编辑的 Provider
  const handleSelectEditingProvider = (providerId: string) => {
    // 先将当前正在修改的值同步回 providers 列表，避免切换丢失
    setProviders((prev) =>
      prev.map((p) => (p.id === editForm.id ? { ...p, ...editForm } : p))
    );

    const target = providers.find((p) => p.id === providerId);
    if (target) {
      setEditingProviderId(target.id);
      setEditForm({
        id: target.id,
        name: target.name,
        url: target.url,
        key: target.key,
        model: target.model,
        isCustom: target.isCustom,
      });
    } else {
      // 若为预设但当前不在列表中
      const preset = DEFAULT_PROVIDER_PRESETS.find((p) => p.id === providerId);
      if (preset) {
        setEditingProviderId(preset.id);
        setEditForm({ ...preset });
      }
    }
    setTestResult(null);
  };

  // 添加新 Provider 交互
  const handleAddNewProvider = (presetId?: string) => {
    // 暂存当前编辑内容
    setProviders((prev) =>
      prev.map((p) => (p.id === editForm.id ? { ...p, ...editForm } : p))
    );

    let targetId = presetId || 'ollama';
    // 若列表中已存在该 targetId，则追加后缀
    if (providers.some((p) => p.id === targetId)) {
      targetId = `${targetId}_${Date.now()}`;
    }

    const preset = DEFAULT_PROVIDER_PRESETS.find((p) => p.id === presetId);

    const newProvider: ProviderConfig = {
      id: targetId,
      name: preset?.name || 'Local Ollama',
      url: preset?.url || 'http://localhost:11434/v1',
      key: preset?.key || '',
      model: preset?.model || 'qwen2.5-coder',
      isCustom: true,
    };

    setProviders((prev) => [...prev, newProvider]);
    setEditingProviderId(newProvider.id);
    setEditForm({ ...newProvider });
    setTestResult(null);
  };

  // 保存当前单项表单到 providers 列表
  const handleApplyCurrentProvider = () => {
    setProviders((prev) => {
      const exists = prev.some((p) => p.id === editForm.id);
      if (exists) {
        return prev.map((p) => (p.id === editForm.id ? { ...p, ...editForm } : p));
      }
      return [...prev, { ...editForm }];
    });
  };

  // 删除指定的 Provider
  const handleDeleteProvider = (id: string) => {
    setProviders((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      // 若删除的是当前默认激活的，则把激活项转移给剩余第一个
      if (activeProvider === id && filtered.length > 0) {
        setActiveProvider(filtered[0].id);
      }
      // 若删除的是当前正在编辑的
      if (editingProviderId === id && filtered.length > 0) {
        setEditingProviderId(filtered[0].id);
        setEditForm({ ...filtered[0] });
      }
      return filtered;
    });
  };

  // 选择本地工作区目录
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

  // 测试当前 Provider 的连通性（统一使用 URL, Key, Model Name）
  const handleTest = async () => {
    if (!onTestConnection) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(editForm.url, editForm.key, editForm.model);
      if (typeof res === 'string') {
        setTestResult({ success: true, message: res });
      } else if (res === true) {
        setTestResult({ success: true, message: 'Connection established successfully' });
      } else {
        setTestResult({ success: false, message: 'Connection failed' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  // 提交并保存所有设置
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 同步当前正在编辑的项到列表
      const latestProviders = providers.map((p) =>
        p.id === editForm.id ? { ...p, ...editForm } : p
      );
      if (!latestProviders.some((p) => p.id === editForm.id)) {
        latestProviders.push({ ...editForm });
      }

      if (onSave) {
        const payload = serializeProviders(latestProviders, activeProvider, {
          'workspace.dir': workspaceDir.trim(),
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

  // 兼容旧测试所需的预设列表
  const legacyPresetProviders = [
    { id: 'openai', name: 'OpenAI (Official)' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'ollama', name: 'Ollama (Local)' },
    { id: 'custom', name: 'Custom (OpenAI-compatible)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl h-[620px] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-zinc-100 transition-colors">
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
          {/* 左侧垂直导航 */}
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

          {/* 右侧主配置内容 */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
            <form onSubmit={handleSave} className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. 大模型 Provider 偏好设置页 */}
                {activeNavTab === 'models' && (
                  <div className="space-y-6">
                    {/* 页面头部：标题与快速添加按钮 */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 pb-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                          {t('modals.settingsTitle')}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          Configure LLM endpoints, local Ollama servers, and authentication keys.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          data-testid="add-provider-btn"
                          onClick={() => handleAddNewProvider()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Provider</span>
                        </button>
                      </div>
                    </div>

                    {/* 已设置的 Provider 列表（Configured Providers List） */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Configured Providers
                        </label>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                          {providers.filter(isProviderConfigured).length} Active Configured
                        </span>
                      </div>

                      <div
                        data-testid="configured-providers-list"
                        className="grid grid-cols-1 md:grid-cols-2 gap-2.5"
                      >
                        {providers.map((p) => {
                          const isConfigured = isProviderConfigured(p);
                          const isDefault = activeProvider === p.id;
                          const isEditing = editingProviderId === p.id;
                          const isOllama = p.id.includes('ollama') || p.url.includes('11434');

                          return (
                            <div
                              key={p.id}
                              className={`p-3 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                                isEditing
                                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-2xs'
                                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-slate-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-zinc-100">
                                    <Server className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span className="truncate max-w-[150px]">{p.name}</span>
                                    {isDefault ? (
                                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full flex items-center gap-0.5">
                                        <Check className="w-2.5 h-2.5" />
                                        Default
                                      </span>
                                    ) : isConfigured ? (
                                      <span className="px-1.5 py-0.5 text-[9px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 rounded-full">
                                        Ready
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectEditingProvider(p.id)}
                                      title="Edit configuration"
                                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    {providers.length > 1 && (
                                      <button
                                        type="button"
                                        data-testid={`delete-provider-${p.id}`}
                                        onClick={() => handleDeleteProvider(p.id)}
                                        title="Delete provider"
                                        className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 dark:hover:bg-rose-950/50 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-0.5 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                                  <div className="truncate" title={p.url || 'No URL configured'}>
                                    <span className="text-slate-400 dark:text-zinc-500 mr-1">URL:</span>
                                    {p.url || '(none)'}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 dark:text-zinc-500">Model:</span>
                                    <span className="text-slate-700 dark:text-zinc-300 font-semibold truncate">
                                      {p.model || '(none)'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                                    {p.key ? (
                                      <span className="text-slate-500">Key: ••••••••</span>
                                    ) : isOllama ? (
                                      <span className="text-emerald-600 dark:text-emerald-400">
                                        No Key (Local Ollama)
                                      </span>
                                    ) : (
                                      <span className="text-amber-600 dark:text-amber-400">
                                        No Key (Open HTTP)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
                                {!isDefault ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveProvider(p.id)}
                                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                  >
                                    Set as Default
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    ✓ Active Default
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleSelectEditingProvider(p.id)}
                                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                                >
                                  {isEditing ? 'Configuring ↓' : 'Edit'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 兼容旧测试保留的 Tabs 与 下拉框 */}
                    <div
                      role="tablist"
                      aria-label="Provider Tabs"
                      className="flex space-x-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto"
                    >
                      {legacyPresetProviders.map((lp) => {
                        const isSelected = editingProviderId === lp.id;
                        return (
                          <button
                            key={lp.id}
                            role="tab"
                            type="button"
                            aria-selected={isSelected}
                            onClick={() => handleSelectEditingProvider(lp.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              isSelected
                                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs border border-slate-200 dark:border-zinc-700'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                            }`}
                          >
                            <span>{lp.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="hidden">
                      <label
                        htmlFor="llm-provider-select"
                        className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
                      >
                        {t('modals.providerLabel')}
                      </label>
                      <select
                        id="llm-provider-select"
                        value={editingProviderId}
                        onChange={(e) => handleSelectEditingProvider(e.target.value)}
                        aria-label="Select Provider"
                      >
                        {legacyPresetProviders.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 统一 Provider 配置表单：URL, Key, 模型名称 */}
                    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/30 p-4 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                            Configure Provider: {editForm.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          data-testid="save-provider-config-btn"
                          onClick={handleApplyCurrentProvider}
                          className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-650 transition-colors shadow-2xs"
                        >
                          Apply to List
                        </button>
                      </div>

                      {/* 1. Provider Name */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                          Provider Name
                        </label>
                        <input
                          type="text"
                          data-testid="provider-name-input"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="e.g. OpenAI, Ollama (Local), Internal Proxy"
                          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>

                      {/* 2. URL (Base URL，统一使用 url，兼容 http:// 与本地 ollama) */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                          {t('modals.baseUrlLabel')}
                        </label>
                        <input
                          type="text"
                          data-testid="provider-url-input"
                          value={editForm.url}
                          onChange={(e) => {
                            setEditForm({ ...editForm, url: e.target.value });
                            setTestResult(null);
                          }}
                          placeholder={
                            editForm.id.includes('deepseek')
                              ? 'https://api.deepseek.com/v1'
                              : editForm.id.includes('ollama')
                              ? 'http://localhost:11434/v1'
                              : 'https://api.openai.com/v1'
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-all"
                        />
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">
                          Supports HTTP/HTTPS endpoints and local Ollama (e.g. http://localhost:11434/v1).
                        </span>
                      </div>

                      {/* 3. Key (API Key，统一使用 key，本地 ollama 或免认证 http 代理可为空) */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                            {t('modals.apiKeyLabel')}
                          </label>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                            (Optional for local Ollama or no-auth proxies)
                          </span>
                        </div>
                        <input
                          type="password"
                          data-testid="provider-key-input"
                          value={editForm.key}
                          onChange={(e) => {
                            setEditForm({ ...editForm, key: e.target.value });
                            setTestResult(null);
                          }}
                          placeholder="sk-..."
                          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-all"
                        />
                      </div>

                      {/* 4. Model Name (统一使用模型名称) */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                          {t('modals.modelLabel')}
                        </label>
                        <input
                          type="text"
                          data-testid="provider-model-input"
                          value={editForm.model}
                          onChange={(e) => {
                            setEditForm({ ...editForm, model: e.target.value });
                            setTestResult(null);
                          }}
                          placeholder={
                            editForm.id.includes('ollama')
                              ? 'qwen2.5-coder'
                              : editForm.id.includes('deepseek')
                              ? 'deepseek-chat'
                              : 'gpt-4o'
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-all"
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
                  </div>
                )}

                {/* 2. 存储与本地工作区设置 */}
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
                  </div>
                )}

                {/* 3. 外观与主题 */}
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

                {/* 4. 通用偏好 */}
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

              {/* 底部操作按钮栏 */}
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
