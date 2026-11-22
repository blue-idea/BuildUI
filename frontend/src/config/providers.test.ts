import { describe, it, expect } from 'vitest';
import {
  parseConfiguredProviders,
  serializeProviders,
  isProviderConfigured,
  type ProviderConfig,
} from './providers';

describe('Providers Configuration and Parser', () => {
  it('parses empty settings to default presets list', () => {
    const providers = parseConfiguredProviders({});
    expect(providers.length).toBeGreaterThanOrEqual(3);
    const ollama = providers.find((p) => p.id === 'ollama');
    expect(ollama).toBeDefined();
    expect(ollama?.url).toBe('http://localhost:11434/v1');
    expect(ollama?.key).toBe('');
    expect(ollama?.model).toBe('qwen2.5-coder');
  });

  it('correctly identifies configured providers including Ollama without API key', () => {
    // 兼容本地 Ollama：只需要 url 和 model，不需要 key
    const ollamaConfig: ProviderConfig = {
      id: 'ollama',
      name: 'Ollama (Local)',
      url: 'http://localhost:11434/v1',
      key: '',
      model: 'qwen2.5-coder',
    };
    expect(isProviderConfigured(ollamaConfig)).toBe(true);

    // 缺少 url 和 model 则视为未配置
    const emptyConfig: ProviderConfig = {
      id: 'custom',
      name: 'Custom',
      url: '',
      key: '',
      model: '',
    };
    expect(isProviderConfigured(emptyConfig)).toBe(false);

    // 常规 HTTP Provider 有 url、key 和 model
    const openaiConfig: ProviderConfig = {
      id: 'openai',
      name: 'OpenAI',
      url: 'https://api.openai.com/v1',
      key: 'sk-test-key',
      model: 'gpt-4o',
    };
    expect(isProviderConfigured(openaiConfig)).toBe(true);
  });

  it('parses saved settings with custom and preset providers', () => {
    const settings: Record<string, string> = {
      'llm.provider_ids': 'openai,my_ollama',
      'llm.providers.openai.name': 'OpenAI Official',
      'llm.providers.openai.base_url': 'https://api.openai.com/v1',
      'llm.providers.openai.api_key': 'sk-123',
      'llm.providers.openai.model': 'gpt-4o',
      'llm.providers.my_ollama.name': 'My Home Ollama',
      'llm.providers.my_ollama.base_url': 'http://192.168.1.100:11434/v1',
      'llm.providers.my_ollama.api_key': '',
      'llm.providers.my_ollama.model': 'llama3.2',
    };

    const providers = parseConfiguredProviders(settings);
    expect(providers).toHaveLength(2);

    const openai = providers.find((p) => p.id === 'openai');
    expect(openai?.name).toBe('OpenAI Official');
    expect(openai?.key).toBe('sk-123');

    const ollama = providers.find((p) => p.id === 'my_ollama');
    expect(ollama?.name).toBe('My Home Ollama');
    expect(ollama?.url).toBe('http://192.168.1.100:11434/v1');
    expect(ollama?.key).toBe('');
    expect(ollama?.model).toBe('llama3.2');
  });

  it('serializes providers into standard settings dictionary', () => {
    const providers: ProviderConfig[] = [
      {
        id: 'ollama',
        name: 'Local Ollama',
        url: 'http://localhost:11434/v1',
        key: '',
        model: 'qwen2.5-coder',
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        url: 'https://api.deepseek.com/v1',
        key: 'sk-deepseek',
        model: 'deepseek-chat',
      },
    ];

    const serialized = serializeProviders(providers, 'ollama', { 'workspace.dir': '/workspace' });
    expect(serialized['llm.active_provider']).toBe('ollama');
    expect(serialized['llm.provider_ids']).toBe('ollama,deepseek');
    expect(serialized['llm.providers.ollama.base_url']).toBe('http://localhost:11434/v1');
    expect(serialized['llm.providers.ollama.api_key']).toBe('');
    expect(serialized['llm.providers.ollama.model']).toBe('qwen2.5-coder');
    expect(serialized['llm.providers.deepseek.api_key']).toBe('sk-deepseek');
    // 兼容字段
    expect(serialized['llm.provider']).toBe('ollama');
    expect(serialized['llm.base_url']).toBe('http://localhost:11434/v1');
    expect(serialized['workspace.dir']).toBe('/workspace');
  });
});
