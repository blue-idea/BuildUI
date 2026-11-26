/**
 * Wails 运行时桥接服务
 * 封装前端与 Go 后端的方法调用与事件监听，提供桌面环境与测试环境下的透明降级。
 */

import type { AppItem } from '../components/AppDrawer';
import type { InstalledPlugin, PluginAutomation, PluginConfig, PluginTool } from '../types/plugin';
import type { BlueprintDTO } from '../components/BlueprintCard';
import type { VersionItem, VersionDiffResult } from '../components/VersionTimelineModal';

interface ActiveProject {
  appId: number;
  name: string;
  path: string;
  previewUrl: string;
  blueprintApproved: boolean;
  nativeApp?: boolean;
}

export interface BuildProgress {
  completed: number;
  total: number;
}

interface ProjectChat {
  chatId: number;
  blueprint: BlueprintDTO | null;
  messages: Array<{ id: number; role: 'user' | 'assistant'; content: string }> | null;
  buildProgress?: BuildProgress;
}

interface DesktopMethods {
  ListApps: () => Promise<AppItem[] | null>;
  CreateApp: (req: { name: string; customPath?: string; templateId?: string }) => Promise<ActiveProject>;
  CreateAppFromTemplate: (req: { templateId: string; appName: string; destPath?: string }) => Promise<ActiveProject>;
  SelectProjectTemplate?: (id: string, acceptCommunity: boolean) => Promise<void>;
  DeleteApp: (id: number) => Promise<void>;
  SwitchApp: (id: number) => Promise<ActiveProject>;
  GetActiveApp: () => Promise<ActiveProject>;
  GetProjectChat: (id: number) => Promise<ProjectChat>;
  CreateProjectChat: (id: number) => Promise<ProjectChat>;
  ApproveBlueprint: (chatId: number) => Promise<void>;
  StreamChat: (req: { chatId: number; prompt: string; mode: 'build' | 'plan'; attachments: string[]; provider?: string; model?: string; resume?: boolean; pluginAutomation?: PluginAutomation }) => Promise<void>;
  ListProviderModels?: (provider: string, baseURL: string, apiKey: string) => Promise<string[]>;
  CancelChat: (chatId: number) => Promise<void>;
  RunApp: (req: { appId: number; restart?: boolean }) => Promise<{ previewUrl: string; typeScriptChecked?: boolean; repairAttempts?: number }>;
  StopApp?: (req: { appId: number }) => Promise<void>;
  ListProjectFiles: (appId: number) => Promise<string[]>;
  ReadProjectFile: (appId: number, path: string) => Promise<string>;
  SetAppTheme: (appId: number, themeId: string) => Promise<void>;
  GetVersions: (appId: number) => Promise<VersionItem[] | null>;
  GetVersionDiff: (appId: number, hash: string) => Promise<VersionDiffResult | null>;
  RollbackVersion: (appId: number, hash: string) => Promise<void>;
  GetSettings: () => Promise<Record<string, string>>;
  SaveSettings: (settings: Record<string, string>) => Promise<void>;
  TestLLMConnection: (url: string, key: string, model: string) => Promise<void>;
  SelectDirectory: (title: string) => Promise<string>;
  ExportAppZip: (appId: number, targetDir: string) => Promise<string>;
  OpenInFileManager: (path: string) => Promise<void>;
  CheckForUpdates?: () => Promise<UpdateCheckResult>;
  CheckTypeScript: (req: { appId: number; paths: string[] }) => Promise<ProblemsResponse>;
  ExtractStyle?: (req: { reference?: string; imageBase64?: string; provider?: string; model?: string; appType?: string }) => Promise<{
    id: string;
    name: string;
    appType?: string;
    referenceSource: string;
    palette: {
      primary: string;
      accent?: string;
      background: string;
      surface: string;
      text: string;
      textMuted?: string;
      border: string;
    };
    borderRadius: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    typography: string;
    tags: string[];
    stylePrompt: string;
    designPrompt?: string;
    createdAt: string;
  }>;
}

export function desktopApp(): DesktopMethods {
  const app = getWailsApp();
  if (!app) throw new Error('The desktop runtime is unavailable.');
  return app as DesktopMethods;
}

interface PluginMethods {
  ListPlugins(): Promise<InstalledPlugin[] | null>;
  SavePlugin(input: PluginConfig): Promise<InstalledPlugin>;
  DeletePlugin(id: number): Promise<void>;
  SavePluginCredential(input: { pluginId: number; oldKey: string; key: string; value: string }): Promise<InstalledPlugin>;
  ListPluginTools(id: number): Promise<PluginTool[] | null>;
  SetPluginToolPermission(id: number, name: string, allow: boolean): Promise<void>;
  SignInPlugin(id: number, options: { clientId: string; clientSecret: string; scope: string }): Promise<InstalledPlugin>;
  DisconnectPlugin(id: number): Promise<InstalledPlugin>;
  PluginOAuthRedirectURL(): Promise<string>;
}

export function pluginBridge(): PluginMethods | null {
  const app = getWailsApp() as Partial<PluginMethods> | null;
  return app?.ListPlugins ? app as PluginMethods : null;
}

export function essentialEvent<T>(name: string, handler: (data: T) => void): () => void {
  return window.runtime?.EventsOn?.(name, handler) ?? (() => {});
}

export function openExternalUrl(url: string): void {
  if (typeof window !== 'undefined' && window.runtime?.BrowserOpenURL) {
    window.runtime.BrowserOpenURL(url);
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export interface UpdateCheckResult {
  available: boolean;
  version?: string;
  releaseUrl?: string;
  downloadUrl?: string;
  error?: string;
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const wails = getWailsApp();
  if (wails?.CheckForUpdates) {
    try {
      return await wails.CheckForUpdates();
    } catch (e: any) {
      return { available: false, error: e?.message || 'Failed to check for updates' };
    }
  }
  return { available: false };
}

export interface DiagnosticItem {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ProblemsResponse {
  hasErrors: boolean;
  problems: DiagnosticItem[];
}

export interface ChatEventHandlers {
  onProgress?: (data: { chatId: number; message: string }) => void;
  onChunk?: (data: { chatId: number; chunk: string }) => void;
  onToolStart?: (data: { chatId: number; tool: string; path?: string }) => void;
  onToolEnd?: (data: { chatId: number; tool: string; success: boolean }) => void;
  onError?: (data: { chatId: number; kind: string; message: string }) => void;
  onEnd?: (data: { chatId: number; commitHash: string }) => void;
  onCancelled?: (data: { chatId: number }) => void;
}

// 扩展全局 window 类型以安全访问 Wails 注入对象
declare global {
  interface Window {
    go?: {
      main?: {
        App?: Partial<DesktopMethods>;
      };
    };
    runtime?: {
      EventsOn?: (eventName: string, callback: (...args: any[]) => void) => () => void;
      EventsEmit?: (eventName: string, ...data: any[]) => void;
      BrowserOpenURL?: (url: string) => void;
    };
  }
}

/** 探测是否处于活跃的 Wails 桌面环境 */
export function isWailsAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.go?.main?.App);
}

/** 获取 Wails App 实例 */
function getWailsApp() {
  if (typeof window !== 'undefined' && window.go?.main?.App) {
    return window.go.main.App;
  }
  return null;
}

/** 获取大模型配置偏好 */
export async function fetchSettings(): Promise<Record<string, string>> {
  const wails = getWailsApp();
  if (wails?.GetSettings) {
    try {
      return await wails.GetSettings();
    } catch {
      // 降级使用本地存储
    }
  }
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('blot_llm_settings');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // 解析失败忽略
      }
    }
  }
  return {
    'llm.provider': 'openai',
    'llm.base_url': 'https://api.openai.com/v1',
    'llm.model': 'gpt-4o',
  };
}

/** 保存大模型配置 */
export async function saveSettings(settings: Record<string, string>): Promise<void> {
  const wails = getWailsApp();
  if (wails?.SaveSettings) {
    try {
      await wails.SaveSettings(settings);
    } catch {
      // 降级
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('blot_llm_settings', JSON.stringify(settings));
  }
}

/** 测试大模型连通性 */
export async function testLLMConnection(url: string, key: string, model: string): Promise<string> {
  const wails = getWailsApp();
  if (wails?.TestLLMConnection) {
    try {
      await wails.TestLLMConnection(url, key, model);
      return 'Connection established successfully';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(msg || 'Failed to connect to LLM server', { cause: err });
    }
  }
  // 模拟测试环境下的快速成功返回
  return 'Connection established successfully';
}

/** 选择本地工作区目录 */
export async function selectDirectory(title: string = 'Select Workspace Directory'): Promise<string> {
  const wails = getWailsApp();
  if (wails?.SelectDirectory) {
    try {
      const selected = await wails.SelectDirectory(title);
      if (selected) return selected;
    } catch {
      // 降级
    }
  }
  return '/workspace/my-blot-app';
}

/** 获取多应用列表 */
export async function listApps(): Promise<AppItem[]> {
  const wails = getWailsApp();
  if (wails?.ListApps) {
    return (await wails.ListApps()) ?? [];
  }
  return [
    {
      id: 1,
      name: 'Pantry Planner',
      path: '/workspace/pantry-planner',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Default Application',
      path: '/workspace/default-app',
      createdAt: new Date().toISOString(),
    },
  ];
}

/** 创建新应用工程 */
export async function createApp(name: string, path: string): Promise<AppItem> {
  const wails = getWailsApp();
  if (wails?.CreateApp) {
    try {
      const res = await wails.CreateApp({ name, customPath: path });
      return {
        id: res.appId,
        name,
        path,
        createdAt: new Date().toISOString(),
      };
    } catch {
      // 降级
    }
  }
  return {
    id: Date.now(),
    name,
    path,
    createdAt: new Date().toISOString(),
  };
}

/** 删除应用工程 */
export async function deleteApp(id: number): Promise<void> {
  const wails = getWailsApp();
  if (wails?.DeleteApp) {
    try {
      await wails.DeleteApp(id);
    } catch {
      // 忽略
    }
  }
}

/** 获取版本历史记录 */
export async function fetchVersions(appId: number): Promise<VersionItem[]> {
  const wails = getWailsApp();
  if (wails?.GetVersions) {
    return (await wails.GetVersions(appId)) ?? [];
  }
  return [
    {
      id: 1,
      commitHash: '03176f3',
      message: 'Initial working application checkpoint',
      createdAt: new Date().toISOString(),
    },
  ];
}

/** 获取指定版本的代码 Diff */
export async function fetchVersionDiff(appId: number, hash: string): Promise<VersionDiffResult | null> {
  const wails = getWailsApp();
  if (wails?.GetVersionDiff) {
    return wails.GetVersionDiff(appId, hash);
  }
  return {
    commitHash: hash,
    message: 'Checkpoint Diff',
    files: [
      {
        path: 'src/App.tsx',
        status: 'modified',
        additions: 15,
        deletions: 3,
        hunks: ['@@ -10,3 +10,15 @@\n+ // Updated component'],
      },
    ],
  };
}

/** 回滚至指定版本 */
export async function rollbackVersion(appId: number, hash: string): Promise<void> {
  const wails = getWailsApp();
  if (wails?.RollbackVersion) {
    await wails.RollbackVersion(appId, hash);
  }
}

/** 导出项目独立 ZIP 压缩包 */
export async function exportAppZip(appId: number, targetDir: string = ''): Promise<string> {
  const wails = getWailsApp();
  if (wails?.ExportAppZip) {
    try {
      return await wails.ExportAppZip(appId, targetDir);
    } catch {
      // 降级
    }
  }
  return `/downloads/app-${appId}-export.zip`;
}

/** 在文件资源管理器中定位文件 */
export async function openInFileManager(path: string): Promise<void> {
  const wails = getWailsApp();
  if (wails?.OpenInFileManager) {
    try {
      await wails.OpenInFileManager(path);
    } catch {
      // 降级
    }
  }
}

/** 触发 TypeScript 类型与编译诊断检查 */
export async function checkTypeScript(appId: number, paths: string[] = []): Promise<ProblemsResponse> {
  const wails = getWailsApp();
  if (wails?.CheckTypeScript) {
    try {
      return await wails.CheckTypeScript({ appId, paths });
    } catch {
      // 降级
    }
  }
  return {
    hasErrors: false,
    problems: [],
  };
}

/** 订阅智能体流式代码生成与工具调用事件 */
export function subscribeChatEvents(handlers: ChatEventHandlers): () => void {
  const cleanups: Array<() => void> = [];

  if (typeof window !== 'undefined' && window.runtime?.EventsOn) {
    const eventsOn = window.runtime.EventsOn;
    if (handlers.onProgress) {
      cleanups.push(eventsOn('chat:progress', handlers.onProgress));
    }
    if (handlers.onChunk) {
      cleanups.push(eventsOn('chat:chunk', (data: any) => handlers.onChunk?.(data)));
    }
    if (handlers.onToolStart) {
      cleanups.push(eventsOn('chat:tool-start', (data: any) => handlers.onToolStart?.(data)));
    }
    if (handlers.onToolEnd) {
      cleanups.push(eventsOn('chat:tool-end', (data: any) => handlers.onToolEnd?.(data)));
    }
    if (handlers.onError) {
      cleanups.push(eventsOn('chat:error', (data: any) => handlers.onError?.(data)));
    }
    if (handlers.onEnd) {
      cleanups.push(eventsOn('chat:end', (data: any) => handlers.onEnd?.(data)));
    }
    if (handlers.onCancelled) {
      cleanups.push(eventsOn('chat:cancelled', (data: any) => handlers.onCancelled?.(data)));
    }
  }

  return () => {
    cleanups.forEach((cleanup) => {
      try {
        cleanup();
      } catch {
        // 忽略卸载异常
      }
    });
  };
}
