/**
 * 大模型提供商（Provider）配置项及解析工具
 * 集中管理所有 Provider 预设、常量与配置格式化
 */

export interface ProviderConfig {
  /** 唯一标识符，例如 'openai', 'ollama', 'provider_1700000000' */
  id: string;
  /** 提供商展示名称，例如 'OpenAI (Official)', 'Ollama (Local)' */
  name: string;
  /** 服务端点 URL（兼容 HTTP/HTTPS 与本地 Ollama） */
  url: string;
  /** API 鉴权密钥（对于本地 Ollama 或免认证反向代理可选/可为空） */
  key: string;
  /** 模型名称，例如 'gpt-4o', 'qwen2.5-coder' */
  model: string;
  /** 是否为自定义添加的提供商 */
  isCustom?: boolean;
}

export const CUSTOM_PROVIDER_PRESET: ProviderConfig = {
  id: 'custom',
  name: 'Custom (OpenAI-compatible)',
  url: '',
  key: '',
  model: '',
  isCustom: true,
};

/** 默认常用预设清单 */
export const DEFAULT_PROVIDER_PRESETS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI (Official)',
    url: 'https://api.openai.com/v1',
    key: '',
    model: 'gpt-4o',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://api.deepseek.com/v1',
    key: '',
    model: 'deepseek-chat',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    url: 'http://localhost:11434/v1',
    key: '', // 本地 Ollama 无需 API Key
    model: 'qwen2.5-coder',
  },
  CUSTOM_PROVIDER_PRESET,
];

/**
 * 规范化大模型端点 Base URL
 * 自动剥离末尾可能误填的 /chat/completions 或 /models 路径与多余斜杠
 */
export function normalizeBaseUrl(rawUrl: string): string {
  let u = (rawUrl || '').trim();
  let changed = true;
  while (changed) {
    changed = false;
    u = u.replace(/\/+$/, '');
    if (u.endsWith('/chat/completions')) {
      u = u.slice(0, -'/chat/completions'.length);
      changed = true;
    } else if (u.endsWith('/models')) {
      u = u.slice(0, -'/models'.length);
      changed = true;
    }
  }
  return u;
}

/**
 * 判断指定 Provider 是否已经完成有效设置
 * 规则：
 * 1. 本地 Ollama 只要配置了 URL 与 Model 即为有效（无需 Key）
 * 2. 其它 Provider 若有 URL 和 Key，或者有 URL 和 Model，亦视为有效配置
 */
export function isProviderConfigured(provider: ProviderConfig): boolean {
  const url = provider.url.trim();
  const model = provider.model.trim();
  const key = provider.key.trim();

  // 若 URL 和模型名称都已具备，则已构成有效端点（支持 Ollama 和无 Key 代理）
  if (url && model) {
    return true;
  }

  // 若有 API Key 且有端点或模型（或预设自带）
  if (key && (url || model)) {
    return true;
  }

  return false;
}

/**
 * 从全局设置中解析已配置的 Provider 列表
 */
export function parseConfiguredProviders(settings: Record<string, string> = {}): ProviderConfig[] {
  const result: ProviderConfig[] = [];
  const presetMap = new Map(DEFAULT_PROVIDER_PRESETS.map((p) => [p.id, p]));

  // 如果保存了 provider_ids 显式列表
  const rawIds = settings['llm.provider_ids'];
  const providerIds = rawIds
    ? rawIds.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_PROVIDER_PRESETS.map((p) => p.id);

  // 同时也检查 settings 中是否有自定义的 llm.providers.<id>.base_url
  const discoveredIds = new Set<string>(providerIds);
  Object.keys(settings).forEach((k) => {
    const match = k.match(/^llm\.providers\.([^.]+)\.(base_url|url)$/);
    if (match && match[1]) {
      discoveredIds.add(match[1]);
    }
  });

  discoveredIds.forEach((id) => {
    const preset = presetMap.get(id);
    const prefix = `llm.providers.${id}.`;
    const isLegacy = settings['llm.provider'] === id;

    const name =
      settings[prefix + 'name'] ||
      preset?.name ||
      id.charAt(0).toUpperCase() + id.slice(1);

    const url =
      settings[prefix + 'base_url'] ||
      settings[prefix + 'url'] ||
      (isLegacy ? settings['llm.base_url'] : '') ||
      preset?.url ||
      '';

    const key =
      settings[prefix + 'api_key'] ||
      settings[prefix + 'key'] ||
      (isLegacy ? settings['llm.api_key'] : '') ||
      preset?.key ||
      '';

    const model =
      settings[prefix + 'model'] ||
      (isLegacy ? settings['llm.model'] : '') ||
      preset?.model ||
      '';

    result.push({
      id,
      name,
      url,
      key,
      model,
      isCustom: !preset || Boolean(preset.isCustom),
    });
  });

  return result;
}

/**
 * 将 Provider 列表与当前激活项序列化并合并入 settings 字典
 */
export function serializeProviders(
  providers: ProviderConfig[],
  activeProviderId: string,
  extraSettings: Record<string, string> = {}
): Record<string, string> {
  const nextSettings: Record<string, string> = { ...extraSettings };

  const activeProvider =
    providers.find((p) => p.id === activeProviderId) ||
    providers[0] || {
      id: 'openai',
      name: 'OpenAI',
      url: 'https://api.openai.com/v1',
      key: '',
      model: 'gpt-4o',
    };

  nextSettings['llm.active_provider'] = activeProvider.id;
  nextSettings['llm.provider_ids'] = providers.map((p) => p.id).join(',');

  // 写入所有 provider 的配置
  providers.forEach((p) => {
    const prefix = `llm.providers.${p.id}.`;
    nextSettings[prefix + 'name'] = p.name.trim();
    nextSettings[prefix + 'base_url'] = normalizeBaseUrl(p.url);
    nextSettings[prefix + 'api_key'] = p.key.trim();
    nextSettings[prefix + 'model'] = p.model.trim();
  });

  // 写入旧版兼容全局字段
  nextSettings['llm.provider'] = activeProvider.id;
  nextSettings['llm.base_url'] = normalizeBaseUrl(activeProvider.url);
  nextSettings['llm.api_key'] = activeProvider.key.trim();
  nextSettings['llm.model'] = activeProvider.model.trim();

  return nextSettings;
}
