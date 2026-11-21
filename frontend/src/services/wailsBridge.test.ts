import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isWailsAvailable,
  fetchSettings,
  saveSettings,
  testLLMConnection,
  listApps,
  createApp,
  fetchVersions,
  fetchVersionDiff,
  exportAppZip,
} from './wailsBridge';

describe('Wails Bridge Client Service', () => {
  beforeEach(() => {
    // 重置全局 window.go
    delete (window as any).go;
    localStorage.clear();
  });

  it('detects Wails environment availability accurately', () => {
    expect(isWailsAvailable()).toBe(false);

    (window as any).go = {
      main: {
        App: {},
      },
    };
    expect(isWailsAvailable()).toBe(true);
  });

  it('falls back to default settings when Wails is not available', async () => {
    const settings = await fetchSettings();
    expect(settings['llm.provider']).toBe('openai');
    expect(settings['llm.base_url']).toBe('https://api.openai.com/v1');

    await saveSettings({
      'llm.provider': 'deepseek',
      'llm.base_url': 'https://api.deepseek.com/v1',
    });

    const persisted = await fetchSettings();
    expect(persisted['llm.provider']).toBe('deepseek');
  });

  it('delegates to window.go.main.App when running in desktop mode', async () => {
    const mockGetSettings = vi.fn().mockResolvedValue({
      'llm.provider': 'ollama',
      'llm.model': 'qwen2.5-coder',
    });

    (window as any).go = {
      main: {
        App: {
          GetSettings: mockGetSettings,
        },
      },
    };

    const res = await fetchSettings();
    expect(mockGetSettings).toHaveBeenCalledTimes(1);
    expect(res['llm.provider']).toBe('ollama');
  });

  it('provides safe fallbacks for apps, versions and exports', async () => {
    const apps = await listApps();
    expect(apps.length).toBeGreaterThanOrEqual(1);
    expect(apps[0].name).toBe('Pantry Planner');

    const created = await createApp('New Project', '/workspace/new-proj');
    expect(created.name).toBe('New Project');

    const versions = await fetchVersions(1);
    expect(versions.length).toBeGreaterThanOrEqual(1);

    const diff = await fetchVersionDiff(1, '03176f3');
    expect(diff).not.toBeNull();
    expect(diff?.commitHash).toBe('03176f3');

    const zipPath = await exportAppZip(1);
    expect(zipPath).toContain('.zip');
  });

  it('handles LLM connection tests gracefully', async () => {
    const res = await testLLMConnection('https://api.openai.com/v1', 'key', 'gpt-4o');
    expect(res).toBe('Connection established successfully');
  });
});
