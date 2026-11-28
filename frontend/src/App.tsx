import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BlueprintCard, BlueprintDTO } from './components/BlueprintCard';
import { QuestionnaireCard, QuestionItem } from './components/QuestionnaireCard';
import { SettingsModal } from './components/SettingsModal';
import { ModelSelector } from './components/ModelSelector';
import { VersionTimelineModal, VersionItem } from './components/VersionTimelineModal';
import { AppDrawer, AppItem, ProjectPlatform, inferAppPlatform } from './components/AppDrawer';
import { ExportModal } from './components/ExportModal';
import { CommandPalette, CommandAction } from './components/CommandPalette';
import { UpdateNotifier } from './components/UpdateNotifier';
import { MacOSWindowHeader } from './components/MacOSWindowHeader';
import { LeftDock, DockTab } from './components/LeftDock';
import {
  BLANK_PROJECT_TEMPLATE,
  LOCAL_PROJECT_TEMPLATES,
  NATIVE_APP_TEMPLATE,
  SELECTED_TEMPLATE_KEY,
  getProjectTemplatePlatform,
} from './config/projectTemplates';
import { HomeGuideView, GuideCustomizationOptions } from './components/HomeGuideView';
import { TemplateCenterView } from './components/TemplateCenterView';
import { ComponentCenterView } from './components/ComponentCenterView';
import { StyleCenterView } from './components/StyleCenterView';
import { ProjectsCenterView } from './components/ProjectsCenterView';
import { ProjectDeleteCooldownMap } from './config/projectDelete';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { WorkspacePanel, WorkspaceView, type PreviewCaptureContext } from './components/WorkspacePanel';
import { FileActionItem } from './types/fileAction';
import { ThemePreset } from './components/ThemeSelector';
import { getBenchmarkThemePresets } from './utils/styleExtractor';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { generateSandboxDoc } from './utils/sandboxTemplate';
import { generateSafeAppName } from './utils/appName';
import { parseConfiguredProviders } from './config/providers';
import { DEFAULT_HOME_STYLE } from './config/homeStyle';
import { SCREENSHOT_AUTO_CAPTURE_DELAY_MS } from './config/screenshot';
import { extractLocalEditDraft, type PendingLocalEdit } from './utils/targetedPrompt';
import { buildLocalEditSubmission, formatClarificationAnswersPrompt } from './utils/chatMessageParser';
import {
  captureHtmlDocumentScreenshot,
  loadPersistedProjectThumbnails,
  removePersistedProjectThumbnail,
  savePersistedProjectThumbnail,
} from './utils/projectScreenshot';
import {
  fetchSettings,
  saveSettings,
  testLLMConnection,
  selectDirectory,
  fetchVersionDiff,
  rollbackVersion,
  exportAppZip,
  openInFileManager,
  subscribeChatEvents,
  type BuildProgress,
  desktopApp,
  essentialEvent,
  isWailsAvailable,
  DiagnosticItem,
} from './services/wailsBridge';
import { Plus, Send, Square, Hammer, ChevronDown, Wand2, X, Sparkles, FolderKanban, FolderOpen } from 'lucide-react';
import { MACOS_CONTROLS, MACOS_FLAT_CARD } from './config/macosFlatUi';
import type { PluginAutomation } from './types/plugin';

export interface AttachmentItem {
  id: string;
  name: string;
  dataUrl: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  attachments?: AttachmentItem[];
  fileChanges?: FileActionItem[];
}

export interface AppProps {
  initialDockTab?: DockTab;
}

const STYLE_TEMPLATES_STORAGE_KEY = 'blot_style_templates';
const DELETED_PRESETS_STORAGE_KEY = 'blot_deleted_preset_ids';

const loadPersistedStyleTemplates = (): ThemePreset[] => {
  try {
    const raw = localStorage.getItem(STYLE_TEMPLATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to parse persisted style templates:', err);
  }
  return [];
};

const savePersistedStyleTemplates = (templates: ThemePreset[]) => {
  try {
    const customTemplates = templates.filter(
      (t) => t.id.startsWith('style-') || t.id.startsWith('custom-')
    );
    localStorage.setItem(STYLE_TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
  } catch (err) {
    console.error('Failed to save persisted style templates:', err);
  }
};

const loadDeletedPresetIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (err) {
    console.error('Failed to parse deleted preset ids:', err);
  }
  return new Set();
};

const saveDeletedPresetIds = (deletedIds: Set<string>) => {
  try {
    localStorage.setItem(DELETED_PRESETS_STORAGE_KEY, JSON.stringify(Array.from(deletedIds)));
  } catch (err) {
    console.error('Failed to save deleted preset ids:', err);
  }
};

const getBuiltinThemePresets = (): ThemePreset[] => [
  {
    id: 'dark-slate',
    name: 'Midnight Slate',
    appType: 'web',
    primary: '#3b82f6',
    background: '#020617',
    stylePrompt:
      'Design System & Visual Language Specification: Midnight Slate. Primary blue (#3b82f6) on deep dark slate (#020617). High readability with refined borders and clean spacing.',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    appType: 'web',
    primary: '#00ffcc',
    background: '#0a0a12',
    stylePrompt:
      'Design System & Visual Language Specification: Cyberpunk Neon. High energy electric cyan (#00ffcc) on deep pitch black (#0a0a12). Sharp modern edges and glowing highlights.',
  },
  {
    id: 'forest-emerald',
    name: 'Forest Emerald',
    appType: 'web',
    primary: '#10b981',
    background: '#051b14',
    stylePrompt:
      'Design System & Visual Language Specification: Forest Emerald. Calming organic emerald green (#10b981) on deep evergreen obsidian (#051b14). Natural harmonious feel.',
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    appType: 'web',
    primary: '#f97316',
    background: '#1a0f0a',
    stylePrompt:
      'Design System & Visual Language Specification: Sunset Glow. Warm radiant orange (#f97316) on rich twilight dusk (#1a0f0a). High warmth and inviting mood.',
  },
  {
    id: 'clean-light',
    name: 'Minimalist Light',
    appType: 'web',
    primary: '#2563eb',
    background: '#ffffff',
    stylePrompt:
      'Design System & Visual Language Specification: Minimalist Light. Clean corporate blue (#2563eb) on pristine crisp white (#ffffff). Generous whitespace and light borders.',
  },
  ...getBenchmarkThemePresets(),
];

const AppContent: React.FC<AppProps> = ({ initialDockTab = 'home' }) => {
  const { locale, t } = useI18n();
  const desktop = isWailsAvailable();

  const [activeDockTab, setActiveDockTab] = useState<DockTab>(initialDockTab);
  const [pluginListRevision, setPluginListRevision] = useState(0);
  const [previousDockTab, setPreviousDockTab] = useState<DockTab>('home');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('preview');
  const [activeAppId, setActiveAppId] = useState<number>(desktop ? 0 : 1);
  const [apps, setApps] = useState<AppItem[]>(() => {
    if (desktop) return [];
    const savedThumbs = loadPersistedProjectThumbnails();
    return [
      {
        id: 1,
        name: 'Pantry Planner',
        path: '/workspace/pantry-planner',
        createdAt: new Date().toISOString(),
        thumbnailUrl: savedThumbs[1],
      },
      {
        id: 2,
        name: 'Default Application',
        path: '/workspace/default-app',
        createdAt: new Date().toISOString(),
        thumbnailUrl: savedThumbs[2],
      },
    ];
  });
  const [capturingAppId, setCapturingAppId] = useState<number | null>(null);
  // 按项目 ID 维护的删除冷静期截止时间戳，跨页签切换时不丢失，且项目删除后自动取消
  const [projectDeleteCooldowns, setProjectDeleteCooldowns] = useState<ProjectDeleteCooldownMap>({});
  const autoCapturedAppIdsRef = useRef<Set<number>>(new Set());
  const autoCaptureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeApp = apps.find((a) => a.id === activeAppId);
  const readProjectFile = useCallback((path: string) => desktopApp().ReadProjectFile(activeAppId, path), [activeAppId]);

  const [messages, setMessages] = useState<ChatMessage[]>(desktop ? [] : [
    {
      id: 'msg-user-1',
      sender: 'user',
      content: 'Build a pantry recipe planner that suggests dinners from what I have',
    },
    {
      id: 'msg-assistant-1',
      sender: 'assistant',
      content: "Welcome to Blot-UI. I'll set up your pantry planner with an ingredient list and dinner ideas ranked by what you can already make.",
      fileChanges: [
        {
          id: 'fc-1',
          filename: 'PantryList.tsx',
          path: 'src/components/PantryList.tsx',
          status: 'completed',
        },
        {
          id: 'fc-2',
          filename: 'RecipeCard.tsx',
          path: 'src/components/RecipeCard.tsx',
          status: 'writing',
        },
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [pendingLocalEdit, setPendingLocalEdit] = useState<PendingLocalEdit | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollEndRef = useRef<HTMLDivElement>(null);
  const [buildMode, setBuildMode] = useState<'build' | 'plan'>('build');
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [extraSandboxItems, setExtraSandboxItems] = useState<string[]>([]);
  const [blueprint, setBlueprint] = useState<BlueprintDTO | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionItem[] | null>(null);
  const [clarificationSummary, setClarificationSummary] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState(desktop ? '' : 'http://localhost:5173');
  const [nativePreview, setNativePreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [sourcePaths, setSourcePaths] = useState<string[]>([]);
  const [sourceRevision, setSourceRevision] = useState(0);
  const [focusedFile, setFocusedFile] = useState('');
  const [projectError, setProjectError] = useState('');
  const [isChangingProject, setIsChangingProject] = useState(desktop);
  const chatID = useRef(0);
  const projectID = useRef(0);
  const turn = useRef<{ id: string; commit: string; cancelled: boolean } | null>(null);
  const [isStartingApp, setIsStartingApp] = useState(false);
  const [previewProgress, setPreviewProgress] = useState('');
  const previewRequest = useRef<{ appId: number } | null>(null);
  const pendingPreviewStops = useRef(new Map<number, Promise<void>>());
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState('');
  const [buildProgress, setBuildProgress] = useState<BuildProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportTargetAppId, setExportTargetAppId] = useState<number | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>(desktop ? [] : [
    {
      file: 'src/components/RecipeCard.tsx',
      line: 3,
      column: 14,
      message: 'Unused component import or prop type declaration.',
      severity: 'warning',
    },
  ]);
  const [systemLogs, setSystemLogs] = useState<string[]>(desktop ? [] : [
    'Vite dev server listening on http://localhost:5173',
    'Compiled src/components/PantryList.tsx in 14ms',
    'Updating AST module for src/components/RecipeCard.tsx',
  ]);

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [workspaceDir, setWorkspaceDir] = useState<string>(desktop ? '' : '/workspace/default-app');
  const [versions, setVersions] = useState<VersionItem[]>(desktop ? [] : [
    {
      id: 1,
      commitHash: '03176f3',
      message: 'Initial working application checkpoint',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [themePresets, setThemePresets] = useState<ThemePreset[]>(() => {
    const deletedIds = loadDeletedPresetIds();
    const persisted = loadPersistedStyleTemplates();
    const builtins = getBuiltinThemePresets();
    const persistedIds = new Set(persisted.map((p) => p.id));
    const merged = [...persisted, ...builtins.filter((b) => !persistedIds.has(b.id))];
    return merged.filter((p) => !deletedIds.has(p.id));
  });
  const [activeThemeId, setActiveThemeId] = useState<string>('dark-slate');
  // 首页的生成预设独立于当前项目的预览主题。
  const [homeStyleId, setHomeStyleId] = useState<string>(DEFAULT_HOME_STYLE.id);

  const handleAddCustomPreset = (newPreset: ThemePreset) => {
    setThemePresets((prev) => {
      const updated = [newPreset, ...prev.filter((p) => p.id !== newPreset.id)];
      savePersistedStyleTemplates(updated);
      return updated;
    });
  };

  const handleDeleteCustomPreset = (presetId: string) => {
    setThemePresets((prev) => {
      const updated = prev.filter((p) => p.id !== presetId);
      savePersistedStyleTemplates(updated);
      const deletedIds = loadDeletedPresetIds();
      deletedIds.add(presetId);
      saveDeletedPresetIds(deletedIds);
      return updated;
    });
  };

  const handleRestoreDefaultPresets = () => {
    try {
      localStorage.removeItem(DELETED_PRESETS_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear deleted preset ids:', err);
    }
    const persisted = loadPersistedStyleTemplates();
    const builtins = getBuiltinThemePresets();
    const persistedIds = new Set(persisted.map((p) => p.id));
    const merged = [...persisted, ...builtins.filter((b) => !persistedIds.has(b.id))];
    setThemePresets(merged);
    if (merged.length > 0 && !merged.some((p) => p.id === activeThemeId)) {
      setActiveThemeId(merged[0].id);
    }
  };

  const [installedDependencies, setInstalledDependencies] = useState<string[]>(desktop ? [] : ['lucide-react']);
  const [installingDeps, setInstallingDeps] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reportError = (error: unknown) => setProjectError(error instanceof Error ? error.message : String(error));

  // 统一的项目封面截图捕获与列表替换逻辑（覆盖 v33.REQ-003-AC-001 ~ AC-003）
  const handleCaptureProjectScreenshot = async (
    targetAppId: number,
    options: { targetUrl?: string; captureFrame?: () => Promise<string | null>; silent?: boolean } = {}
  ): Promise<void> => {
    if (!targetAppId || capturingAppId !== null) return;
    setCapturingAppId(targetAppId);
    if (!options.silent) {
      setProjectError('');
    }
    try {
      let capturedUrl = '';
      if (desktop) {
        const api = desktopApp();
        if (api.CaptureAppScreenshot) {
          try {
            capturedUrl = await api.CaptureAppScreenshot(targetAppId, options.targetUrl ?? '');
          } catch (backendErr) {
            // 无头浏览器不可用或失败时，自动降级为前端 iframe DOM 截图并落盘持久化
            if (options.captureFrame) {
              const fallbackDataUrl = await options.captureFrame().catch(() => null);
              if (fallbackDataUrl) {
                capturedUrl = api.SaveAppThumbnail
                  ? await api.SaveAppThumbnail(targetAppId, fallbackDataUrl)
                  : fallbackDataUrl;
              } else {
                throw backendErr;
              }
            } else {
              throw backendErr;
            }
          }
        } else if (options.captureFrame) {
          const fallbackDataUrl = await options.captureFrame();
          if (fallbackDataUrl) {
            capturedUrl = api.SaveAppThumbnail
              ? await api.SaveAppThumbnail(targetAppId, fallbackDataUrl)
              : fallbackDataUrl;
          }
        }
      } else {
        if (options.captureFrame) {
          capturedUrl = (await options.captureFrame().catch(() => null)) || '';
        }
        if (!capturedUrl) {
          const targetApp = apps.find((a) => a.id === targetAppId);
          const html = generateSandboxDoc(
            targetApp?.name ?? 'Project',
            activeThemeId,
            targetAppId === activeAppId ? blueprint : null,
            locale,
            targetAppId === activeAppId ? extraSandboxItems : []
          );
          capturedUrl = await captureHtmlDocumentScreenshot(html);
        }
        if (capturedUrl) {
          savePersistedProjectThumbnail(targetAppId, capturedUrl);
        }
      }

      if (capturedUrl) {
        setApps((prev) =>
          prev.map((a) => (a.id === targetAppId ? { ...a, thumbnailUrl: capturedUrl } : a))
        );
      }
    } catch (error) {
      if (!options.silent) {
        reportError(error);
        throw error;
      }
    } finally {
      setCapturingAppId((current) => (current === targetAppId ? null : current));
    }
  };

  // 构建区首次预览就绪且尚无项目封面时，自动静默截取一次（覆盖 v33.REQ-003-AC-003）
  const handlePreviewLoaded = (captureCtx: PreviewCaptureContext) => {
    const targetApp = activeApp;
    if (
      !targetApp ||
      targetApp.thumbnailUrl ||
      autoCapturedAppIdsRef.current.has(targetApp.id) ||
      isStartingApp ||
      isGenerating ||
      (blueprint && !blueprint.approved)
    ) {
      return;
    }
    if (desktop && !desktopApp().CaptureAppScreenshot) {
      return;
    }
    autoCapturedAppIdsRef.current.add(targetApp.id);
    if (autoCaptureTimerRef.current) {
      clearTimeout(autoCaptureTimerRef.current);
    }
    const appIdSnapshot = targetApp.id;
    autoCaptureTimerRef.current = setTimeout(() => {
      void handleCaptureProjectScreenshot(appIdSnapshot, {
        targetUrl: captureCtx.previewUrl,
        captureFrame: captureCtx.captureFrame,
        silent: true,
      });
    }, SCREENSHOT_AUTO_CAPTURE_DELAY_MS);
  };

  useEffect(() => {
    return () => {
      if (autoCaptureTimerRef.current) {
        clearTimeout(autoCaptureTimerRef.current);
      }
    };
  }, []);

  const refreshProject = async (id: number) => {
    const [history, paths] = await Promise.all([
      desktopApp().GetVersions(id),
      desktopApp().ListProjectFiles(id),
    ]);
    if (projectID.current !== id) return history ?? [];
    setVersions(history ?? []);
    setSourcePaths(paths);
    setSourceRevision((revision) => revision + 1);
    return history ?? [];
  };

  const startPreview = async (id: number, restart = false) => {
    const pending = { appId: id };
    previewRequest.current = pending;
    const isCurrent = () => previewRequest.current === pending && projectID.current === id;
    setProjectError('');
    setPreviewProgress(restart ? 'Restarting preview…' : '');
    setIsStartingApp(true);
    try {
      const result = await desktopApp().RunApp(restart ? { appId: id, restart: true } : { appId: id });
      if (!isCurrent()) return;
      setPreviewUrl(result.previewUrl);
      setPreviewKey((key) => key + 1);
      setSystemLogs((logs) => [...logs, `Preview is running at ${result.previewUrl}`]);
      if (result.typeScriptChecked) {
        setDiagnostics([]);
        setSystemLogs((logs) => [...logs, 'TypeScript check completed without errors.']);
      }
      if (result.repairAttempts) {
        void refreshProject(id).catch((error) => {
          if (projectID.current === id) reportError(error);
        });
      }
    } catch (error) {
      if (!isCurrent()) return;
      setPreviewUrl('');
      setSystemLogs((logs) => [...logs, error instanceof Error ? error.message : String(error)]);
      throw error;
    } finally {
      if (previewRequest.current === pending) {
        previewRequest.current = null;
        setPreviewProgress('');
        setIsStartingApp(false);
      }
    }
  };

  const loadChat = (projectChat: Awaited<ReturnType<ReturnType<typeof desktopApp>['GetProjectChat']>>) => {
    chatID.current = projectChat.chatId;
    setBlueprint(projectChat.blueprint);
    setQuestionnaire(projectChat.clarification?.questions ?? null);
    setClarificationSummary(projectChat.clarification?.summary ?? '');
    setPendingLocalEdit(null);
    setBuildProgress(projectChat.buildProgress ?? null);
    setMessages((projectChat.messages ?? []).map((msg) => ({
      id: String(msg.id),
      sender: msg.role,
      content: msg.content,
    })));
  };

  const handleCloseProject = () => {
    if (desktop && activeAppId) {
      const stopping = desktopApp().StopApp?.({ appId: activeAppId });
      if (stopping) {
        const done = stopping.catch(() => {}).finally(() => {
          pendingPreviewStops.current.delete(activeAppId);
        });
        pendingPreviewStops.current.set(activeAppId, done);
      }
    }
    setActiveAppId(0);
    setNativePreview(false);
    previewRequest.current = null;
    setPreviewProgress('');
    setIsStartingApp(false);
    projectID.current = 0;
    chatID.current = 0;
    setWorkspaceDir('');
    setMessages([]);
    setBlueprint(null);
    setQuestionnaire(null);
    setClarificationSummary('');
    setPendingLocalEdit(null);
    setBuildProgress(null);
    setFocusedFile('');
    setInputPrompt('');
    setAttachments([]);
    setSourcePaths([]);
    setVersions([]);
    setDiagnostics([]);
    setSystemLogs([]);
    setPreviewUrl('');
    setIsInspectMode(false);
    setIsVersionsOpen(false);
    setProjectError('');
  };

  const activateProject = async (id: number) => {
    // 同一项目重开时先等旧服务停止，否则切换接口可能返回即将关闭的端口。
    const stopping = pendingPreviewStops.current.get(id);
    if (stopping) await stopping;
    const active = await desktopApp().SwitchApp(id);
    projectID.current = id;
    chatID.current = 0;
    setActiveAppId(id);
    setNativePreview(active.nativeApp === true);
    setWorkspaceDir(active.path);
    setMessages([]);
    setBlueprint(null);
    setQuestionnaire(null);
    setClarificationSummary('');
    setPendingLocalEdit(null);
    setBuildProgress(null);
    setFocusedFile('');
    setInputPrompt('');
    setAttachments([]);
    setSourcePaths([]);
    setVersions([]);
    setDiagnostics([]);
    setSystemLogs([]);
    setPreviewUrl(active.previewUrl || '');
    setWorkspaceView('preview');
    setIsInspectMode(false);
    setIsVersionsOpen(false);
    const [projectChat, history] = await Promise.all([
      desktopApp().GetProjectChat(id),
      refreshProject(id),
    ]);
    loadChat(projectChat);
    if (active.blueprintApproved && history.length > 1 && !active.previewUrl && !projectChat.buildProgress) {
      await startPreview(id);
    }
  };

  const updateProject = async (operation: () => Promise<void>): Promise<void> => {
    setIsChangingProject(true);
    setProjectError('');
    try {
      await operation();
    } catch (error) {
      reportError(error);
    } finally {
      setIsChangingProject(false);
    }
  };

  const createAndOpenDesktopProject = async (name: string, templateId?: string, projectPlatform?: ProjectPlatform) => {
    const created = await desktopApp().CreateApp(templateId ? { name, templateId } : { name });
    const platform = projectPlatform ?? getProjectTemplatePlatform(templateId) ?? inferAppPlatform({ name: created.name, path: created.path });
    setApps((previous) => [...previous, { id: created.appId, name: created.name, path: created.path, platform }]);
    setIsDrawerOpen(false);
    setActiveDockTab('builder');
    await activateProject(created.appId);
  };

  const createDesktopProject = (name: string, platform: ProjectPlatform = 'web', templateId?: string): Promise<void> =>
    updateProject(() => createAndOpenDesktopProject(name, templateId ?? (platform === 'app' ? NATIVE_APP_TEMPLATE : undefined), platform));

  const runDesktopTurn = async (
    prompt: string,
    images: string[],
    mode: 'build' | 'plan',
    options: { approve?: boolean; chatId?: number; resume?: boolean; pluginAutomation?: PluginAutomation; stage?: 'clarify' | 'blueprint' } = {},
  ) => {
    const { approve = false, chatId: id = chatID.current, resume, pluginAutomation, stage } = options;
    if (!id || turn.current) return;
    const currentAppId = projectID.current;
    const current = { id: `turn-${Date.now()}`, commit: '', cancelled: false };
    turn.current = current;
    setProjectError('');
    setIsGenerating(true);
    setGenerationProgress(
      approve
        ? t('chat.approvingBlueprint')
        : stage === 'clarify'
        ? t('chat.generatingClarification')
        : stage === 'blueprint'
        ? t('chat.generatingBlueprint')
        : t('chat.preparingRequest')
    );
    try {
      if (approve) {
        await desktopApp().ApproveBlueprint(id);
        setBlueprint((bp) => bp && { ...bp, approved: true });
      }
      setMessages((previous) => [...previous, { id: current.id, sender: 'assistant', content: '' }]);
      let reqProvider: string | undefined = undefined;
      let reqModel: string | undefined = undefined;
      if (selectedModel && selectedModel !== 'auto') {
        if (selectedModel.startsWith('provider:')) {
          reqProvider = selectedModel.replace('provider:', '');
          reqModel =
            settings[`llm.providers.${reqProvider}.model`] ||
            parseConfiguredProviders(settings).find((p) => p.id === reqProvider)?.model;
        } else if (selectedModel === 'configured') {
          reqProvider = settings['llm.provider'];
          reqModel = settings['llm.model'];
        }
      }
      await desktopApp().StreamChat({
        chatId: id,
        prompt,
        mode,
        ...(stage && { stage }),
        locale,
        attachments: images,
        provider: reqProvider,
        model: reqModel,
        resume,
        ...(pluginAutomation && { pluginAutomation }),
      });
      if (id !== chatID.current || currentAppId !== projectID.current) return;
      if (mode === 'build') setBuildProgress(null);
      const refreshFiles = refreshProject(currentAppId);
      if (current.commit || (mode === 'build' && (approve || resume || blueprint?.approved))) {
        // 文件监听可能漏掉已落盘的变更。构建成功后用新进程加载完整工作区。
        setGenerationProgress(t('chat.restartingPreview'));
        await Promise.all([refreshFiles, startPreview(currentAppId, true)]);
      } else {
        await refreshFiles;
      }
    } catch (error) {
      if (!current.cancelled) reportError(error);
      if (mode === 'build' && id === chatID.current) {
        const projectChat = await desktopApp().GetProjectChat(currentAppId).catch(() => null);
        if (projectChat?.chatId === chatID.current) setBuildProgress(projectChat.buildProgress ?? null);
      }
    } finally {
      setMessages((previous) => previous.filter((message) => (
        message.id !== current.id || message.content || message.fileChanges?.length
      )));
      turn.current = null;
      setIsGenerating(false);
      setActiveTool(null);
      setGenerationProgress('');
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    (desktop ? desktopApp().GetSettings() : fetchSettings()).then((cfg) => {
      if (cfg && Object.keys(cfg).length > 0) {
        setSettings((previous) => ({ ...cfg, ...previous }));
      }
    }).catch(reportError);

    if (!desktop) return;
    void updateProject(async () => {
      const api = desktopApp();
      const projects = await api.ListApps() ?? [];
      setApps(projects);
      if (projects.length > 0) {
        const active = await api.GetActiveApp();
        await activateProject(active.appId);
      }
    });

    const forTurn = (id: number) => id === chatID.current ? turn.current : null;
    const updateAssistant = (id: string, update: (message: ChatMessage) => ChatMessage) => {
      setMessages((previous) => previous.map((message) => message.id === id ? update(message) : message));
    };
    const unsubscribe = subscribeChatEvents({
      onProgress: (data) => {
        if (forTurn(data.chatId)) setGenerationProgress(data.message);
      },
      onChunk: (data) => {
        const current = forTurn(data.chatId);
        if (current) updateAssistant(current.id, (message) => ({ ...message, content: message.content + data.chunk }));
      },
      onClarification: (data) => {
        if (!data.chatId || data.chatId === chatID.current) {
          setClarificationSummary(data.summary ?? '');
          setQuestionnaire(data.questions ?? null);
        }
      },
      onToolStart: (data) => {
        const current = forTurn(data.chatId);
        if (!current) return;
        setActiveTool(`${data.tool}${data.path ? ': ' + data.path : ''}`);
        const path = data.path;
        if (path) updateAssistant(current.id, (message) => {
          const files = message.fileChanges ?? [];
          const retry = files.find((file) => file.path === path && file.status === 'error');
          return {
            ...message,
            fileChanges: retry
              ? files.map((file) => file.id === retry.id ? { ...file, status: 'writing' } : file)
              : [...files, {
                id: `${current.id}-${files.length}`,
                filename: path.split('/').pop() ?? path, path, status: 'writing',
              }],
          };
        });
      },
      onToolEnd: (data) => {
        const current = forTurn(data.chatId);
        if (!current) return;
        setActiveTool(null);
        if (data.tool === 'write_file') updateAssistant(current.id, (message) => ({
          ...message,
          fileChanges: message.fileChanges?.map((file) => file.status === 'writing'
            ? { ...file, status: data.success ? 'completed' : 'error' }
            : file),
        }));
      },
      onError: (data) => {
        if (forTurn(data.chatId)) reportError(data.message);
      },
      onEnd: (data) => {
        const current = forTurn(data.chatId);
        if (current) current.commit = data.commitHash;
      },
      onCancelled: (data) => {
        const current = forTurn(data.chatId);
        if (current) current.cancelled = true;
      },
    });
    const stopBlueprint = essentialEvent<BlueprintDTO>('app-blueprint:update', (draft) => {
      if (draft.chatId === chatID.current) setBlueprint(draft);
    });
    const stopConsole = essentialEvent<{ appId: number; message: string }>('preview:console', (event) => {
      if (event.appId === projectID.current) setSystemLogs((logs) => [...logs, event.message]);
    });
    const stopPreviewProgress = essentialEvent<{ appId: number; message: string }>('preview:progress', (event) => {
      if (event.appId === previewRequest.current?.appId) setPreviewProgress(event.message);
    });
    const stopPreviewDiagnostics = essentialEvent<{ appId: number; problems: DiagnosticItem[] }>('preview:diagnostics', (event) => {
      if (event.appId === previewRequest.current?.appId) setDiagnostics(event.problems);
    });

    return () => {
      unsubscribe();
      stopBlueprint();
      stopConsole();
      stopPreviewProgress();
      stopPreviewDiagnostics();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveMessageText = (msg: ChatMessage) => {
    if (msg.id === 'msg-user-1') {
      return t('chat.userDemoPrompt');
    }
    if (msg.id === 'msg-assistant-1') {
      return t('chat.assistantDemoReply');
    }
    return msg.content;
  };

  useEffect(() => {
    chatScrollEndRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages.length, questionnaire, blueprint]);

  const handleSelectTheme = (themeId: string) => {
    if (desktop && activeAppId) {
      void desktopApp().SetAppTheme(activeAppId, themeId).then(() => setActiveThemeId(themeId)).catch(reportError);
      return;
    }
    setActiveThemeId(themeId);
    const target = themePresets.find((p) => p.id === themeId);
    const iframe = document.querySelector('iframe') as HTMLIFrameElement | null;
    if (iframe && iframe.contentWindow && target) {
      iframe.contentWindow.postMessage(
        {
          type: 'THEME_INJECT',
          themeId: target.id,
          tokens: {
            primary: target.primary,
            background: target.background,
          },
        },
        '*'
      );
    }
  };

  const handleSelectDirectory = async () => {
    if (desktop) {
      try {
        if (activeApp) await desktopApp().OpenInFileManager(activeApp.path);
        else {
          if (activeDockTab !== 'projects') setPreviousDockTab(activeDockTab);
          setActiveDockTab('projects');
        }
      } catch (error) {
        reportError(error);
      }
      return;
    }
    setWorkspaceDir('/workspace/my-blot-app');
    const selected = await selectDirectory('Select Workspace Directory');
    if (selected) {
      setWorkspaceDir(selected);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (dataUrl) {
          setAttachments((prev) => [
            ...prev,
            { id: String(Date.now() + Math.random()), name: file.name, dataUrl },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const runWebTurn = (prompt: string) => {
    if (prompt.toLowerCase().includes('recharts') || prompt.toLowerCase().includes('lucide-react')) {
      setInstallingDeps('lucide-react, recharts');
      setTimeout(() => {
        setInstallingDeps(null);
        setInstalledDependencies((prev) => Array.from(new Set([...prev, 'lucide-react', 'recharts'])));
      }, 300);
    }

    if (prompt.toLowerCase().includes('basil') || prompt.includes('罗勒')) {
      setExtraSandboxItems((prev) => Array.from(new Set([...prev, locale === 'zh' ? '新鲜罗勒叶' : 'Fresh Basil'])));
    } else if (prompt.toLowerCase().includes('cheese') || prompt.includes('芝士') || prompt.includes('奶酪')) {
      setExtraSandboxItems((prev) => Array.from(new Set([...prev, locale === 'zh' ? '马苏里拉芝士' : 'Mozzarella Cheese'])));
    }

    if (!blueprint) {
      setTimeout(() => {
        setBlueprint({
          chatId: 1,
          appName: prompt.slice(0, 20) || 'New App',
          designDirection: 'Clean modern layout with responsive Tailwind components',
          primaryColor: '#3b82f6',
          themeId: 'dark',
          visuals: [
            {
              id: 'vis-1',
              type: 'logo',
              description: 'Minimalist brand logo',
              prompt: 'vector icon',
            },
          ],
          approved: false,
        });
      }, 100);
    } else {
      setIsGenerating(true);
      setActiveTool('write_file: src/App.tsx');
      timerRef.current = setTimeout(() => {
        setIsGenerating(false);
        setActiveTool(null);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            sender: 'assistant',
            content: t('chat.webUpdatedReply', { prompt }),
            fileChanges: [
              {
                id: String(Date.now() + 1),
                filename: 'PantryList.tsx',
                path: 'src/components/PantryList.tsx',
                status: 'completed',
              },
            ],
          },
        ]);
        setSystemLogs((prev) => [...prev, `Updated components for "${prompt}"`]);
      }, 500);
    }
  };

  const handleSendPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawInput = inputPrompt.trim();
    if (!rawInput && attachments.length === 0) return;
    if (desktop && turn.current) return;
    if (desktop && chatID.current && isChangingProject) return;

    const activeLocalEdit = pendingLocalEdit;
    const outboundPrompt = activeLocalEdit
      ? buildLocalEditSubmission(activeLocalEdit, rawInput)
      : rawInput;
    const currentAttachments = [...attachments];
    setInputPrompt('');
    setPendingLocalEdit(null);
    setAttachments([]);

    if (desktop) {
      const isFreshProject = !chatID.current;
      if (!chatID.current) {
        // 构建页点击发送指令在无活跃项目时，自动创建新项目并激活，不再跳转工程管理页面
        const appName = generateSafeAppName(outboundPrompt, apps.map((a) => a.name));
        await createDesktopProject(appName);
      }
      if (!chatID.current) return;

      const userMsg: ChatMessage = {
        id: String(Date.now()),
        sender: 'user',
        content: outboundPrompt || (currentAttachments.length > 0 ? t('chat.attachedImage') : ''),
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      };
      setMessages((prev) => [...prev, userMsg]);
      const shouldClarify =
        buildMode === 'build' &&
        !activeLocalEdit &&
        (isFreshProject || (!blueprint && !questionnaire));
      void runDesktopTurn(
        outboundPrompt,
        currentAttachments.map((attachment) => attachment.dataUrl),
        buildMode,
        {
          chatId: chatID.current,
          ...(shouldClarify ? { stage: 'clarify' } : {}),
        }
      );
      return;
    }

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      content: outboundPrompt || (currentAttachments.length > 0 ? t('chat.attachedImage') : ''),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    runWebTurn(outboundPrompt);
  };

  const handleStartBuilding = async (
    prompt: string,
    options?: GuideCustomizationOptions,
    initialAttachments?: AttachmentItem[]
  ) => {
    setActiveDockTab('builder');
    const atts = initialAttachments && initialAttachments.length > 0 ? initialAttachments : [];
    setInputPrompt('');
    setPendingLocalEdit(null);
    setAttachments([]);

    if (desktop) {
      if (turn.current) return;
      // 首页点击开始生成按钮，自动创建新项目并首先发起大模型需求澄清（不丢失插件与设计系统预设）
      const appName = generateSafeAppName(options?.userInput || prompt, apps.map((a) => a.name));
      const templateId = options?.template === BLANK_PROJECT_TEMPLATE ? undefined : options?.template;
      const previousAppId = projectID.current;
      await createDesktopProject(appName, options?.category, templateId);
      if (!chatID.current || projectID.current === previousAppId) return;

      const userMsg: ChatMessage = {
        id: String(Date.now()),
        sender: 'user',
        content: prompt || (atts.length > 0 ? t('chat.attachedImage') : ''),
        attachments: atts.length > 0 ? atts : undefined,
      };
      setMessages((prev) => [...prev, userMsg]);
      void runDesktopTurn(prompt, atts.map((att) => att.dataUrl), 'build', {
        chatId: chatID.current,
        pluginAutomation: options?.pluginAutomation,
        stage: 'clarify',
      });
      return;
    }

    if (options?.category === 'app') {
      setProjectError('Open BuildUI for desktop to generate a React Native app.');
      return;
    }

    // Web 模拟模式下自动进入构建区并开始生成
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      content: prompt || (atts.length > 0 ? t('chat.attachedImage') : ''),
      attachments: atts.length > 0 ? atts : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    runWebTurn(prompt);
  };

  const handleSubmitClarification = (answers: Record<string, string | string[]>) => {
    if (!questionnaire) return;
    const answerPrompt = formatClarificationAnswersPrompt(questionnaire, answers, locale);
    setQuestionnaire(null);
    setClarificationSummary('');
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'user',
        content: answerPrompt,
      },
    ]);

    if (desktop) {
      if (!chatID.current) return;
      void runDesktopTurn(answerPrompt, [], 'build', {
        chatId: chatID.current,
        stage: 'blueprint',
      });
      return;
    }

    // Web 模拟模式：根据用户选择生成对应语言的蓝图
    setBlueprint({
      chatId: chatID.current || 1,
      appName: activeApp?.name || (locale === 'zh' ? '新应用设计方案' : 'New App'),
      designDirection:
        locale === 'zh'
          ? '结合您选择的模块与界面风格，采用高对比度现代卡片式布局与流畅交互层次'
          : 'Clean modern card layout with high visual contrast tailored to your selections',
      primaryColor: '#3b82f6',
      themeId: activeThemeId || 'dark-slate',
      visuals: [
        {
          id: 'brand-logo',
          type: 'logo',
          description: locale === 'zh' ? '应用品牌极简矢量徽标' : 'Application brand logo mark',
          prompt: 'geometric vector tech logo',
        },
        {
          id: 'hero-illustration',
          type: 'illustration',
          description: locale === 'zh' ? '首屏核心主视觉插画' : 'Modern 3D isometric hero illustration',
          prompt: 'isometric tech workflow illustration',
        },
      ],
      approved: false,
    });
  };

  const handleSkipClarification = () => {
    if (!questionnaire) return;
    const skipPrompt = '[Clarification Skipped]';
    setQuestionnaire(null);
    setClarificationSummary('');
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'user',
        content: skipPrompt,
      },
    ]);

    if (desktop) {
      if (!chatID.current) return;
      void runDesktopTurn(skipPrompt, [], 'build', {
        chatId: chatID.current,
        stage: 'blueprint',
      });
      return;
    }

    setBlueprint({
      chatId: chatID.current || 1,
      appName: activeApp?.name || (locale === 'zh' ? '新应用设计方案' : 'New App'),
      designDirection:
        locale === 'zh'
          ? '基于初始需求直接生成的现代高对比度卡片布局'
          : 'Clean modern card layout with high visual contrast',
      primaryColor: '#3b82f6',
      themeId: activeThemeId || 'dark-slate',
      visuals: [],
      approved: false,
    });
  };

  const handleCancelGeneration = () => {
    if (desktop) {
      void desktopApp().CancelChat(chatID.current).catch(reportError);
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsGenerating(false);
    setActiveTool(null);
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'assistant',
        content: t('chat.stoppedByUser'),
      },
    ]);
  };

  const handleApproveBlueprint = (approvedChatId: number) => {
    if (!blueprint) return;
    if (desktop) {
      if (approvedChatId === chatID.current) {
        void runDesktopTurn('Implement the approved blueprint and the original user request.', [], 'build', { approve: true });
      }
      return;
    }
    setBlueprint({
      ...blueprint,
      approved: true,
    });
    setIsGenerating(true);
    setActiveTool('write_file: src/App.tsx');
    timerRef.current = setTimeout(() => {
      setIsGenerating(false);
      setActiveTool(null);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'assistant',
          content: t('chat.codeGenSuccess'),
          fileChanges: [
            {
              id: 'fc-approve-1',
              filename: 'PantryLayout.tsx',
              path: 'src/components/PantryLayout.tsx',
              status: 'completed',
            },
          ],
        },
      ]);
    }, 500);
  };

  const handleMockBlueprint = () => {
    setBlueprint({
      chatId: 101,
      appName: locale === 'zh' ? '演示作品集应用' : 'Demo Portfolio',
      designDirection: locale === 'zh' ? '赛博霓虹暗黑沉浸风格' : 'Cyberpunk Neon Dark Mode',
      primaryColor: '#00ffcc',
      themeId: 'dark',
      visuals: [
        {
          id: 'v-1',
          type: 'logo',
          description: locale === 'zh' ? '霓虹发光六边形标识' : 'Neon glowing badge',
          prompt: 'cyberpunk hexagon',
        },
      ],
      approved: false,
    });
  };

  const handleMockQuestionnaire = () => {
    if (locale === 'zh') {
      setClarificationSummary('请确认以下功能模块、页面结构与配色倾向：');
      setQuestionnaire([
        {
          id: 'q1',
          category: 'features',
          question: '核心界面最需要突出哪些功能模块？',
          type: 'multi_choice',
          options: ['首页总览看板', '交互式任务清单', '数据趋势分析'],
          allowCustom: true,
        },
        {
          id: 'page_structure',
          category: 'ui',
          question: '页面结构偏好哪种形式？',
          type: 'single_choice',
          options: ['单页集中展示（一页内完成核心交互）', '多页分栏导航（按功能模块拆分独立页面）'],
          allowCustom: true,
        },
        {
          id: 'q2',
          category: 'palette',
          question: '您期望整体呈现怎样的界面配色与氛围？',
          type: 'single_choice',
          options: ['极简纯净浅色', '深邃科技暗黑', '暖意自然柔和'],
          allowCustom: true,
        },
      ]);
      return;
    }
    setClarificationSummary('Please clarify your preferred features, page structure, and color mood:');
    setQuestionnaire([
      {
        id: 'q1',
        category: 'features',
        question: 'What is the primary target audience?',
        type: 'single_choice',
        options: ['Developers', 'Enterprise Teams', 'End Users'],
        allowCustom: true,
      },
      {
        id: 'page_structure',
        category: 'ui',
        question: 'How should the application pages be structured?',
        type: 'single_choice',
        options: [
          'Single-page layout (all core sections on one page)',
          'Multi-page navigation (separate pages per section)',
        ],
        allowCustom: true,
      },
      {
        id: 'q2',
        category: 'palette',
        question: 'Any specific design preferences or color palettes?',
        type: 'text',
      },
    ]);
  };

  const handleSelectTemplate = async (templateId: string) => {
    const changes: Record<string, string> = { [SELECTED_TEMPLATE_KEY]: templateId };
    if (desktop) {
      const api = desktopApp();
      if (api.SelectProjectTemplate) await api.SelectProjectTemplate(templateId, false);
      else await api.SaveSettings(changes);
    } else {
      await saveSettings({ ...settings, ...changes });
    }
    setSettings((previous) => ({ ...previous, ...changes }));
  };

  const handleCreateFromTemplate = async (name: string, templateId: string, platform: ProjectPlatform) => {
    if (desktop) {
      setIsChangingProject(true);
      setProjectError('');
      try {
        await createAndOpenDesktopProject(name, templateId, platform);
      } finally {
        setIsChangingProject(false);
      }
      return;
    }

    if (apps.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(t('templatesPage.nameExists'));
    }
    const newApp: AppItem = {
      id: Date.now(),
      name,
      path: '/workspace/' + generateSafeAppName(name, []).toLowerCase().replace(/ /g, '-'),
      platform,
      createdAt: new Date().toISOString(),
    };
    setApps((previous) => [...previous, newApp]);
    setActiveAppId(newApp.id);
    setWorkspaceDir(newApp.path);
    setMessages([]);
    setActiveDockTab('builder');
  };

  const handleInspectFile = (path: string) => {
    setFocusedFile(path);
    setWorkspaceView('code');
    setSystemLogs((prev) => [...prev, `Inspecting source: ${path}`]);
  };

  const handleNewChat = () => {
    if (desktop) {
      if (!activeAppId) {
        if (activeDockTab !== 'projects') setPreviousDockTab(activeDockTab);
        setActiveDockTab('projects');
      } else if (!isGenerating && !isChangingProject) {
        void updateProject(async () => loadChat(await desktopApp().CreateProjectChat(activeAppId)));
      }
      return;
    }
    setMessages([
      {
        id: String(Date.now()),
        sender: 'assistant',
        content: t('chat.newChatWelcome', { app: activeApp?.name ?? '' }),
      },
    ]);
  };

  const commandActions: CommandAction[] = [
    {
      id: 'cmd-projects',
      title: 'Open Projects Center',
      category: 'Navigation',
      shortcut: 'P',
      run: () => setActiveDockTab('projects'),
    },
    {
      id: 'cmd-templates',
      title: 'Open Template Center',
      category: 'Navigation',
      shortcut: 'T',
      run: () => setActiveDockTab('templates'),
    },
    {
      id: 'cmd-apps',
      title: 'Open Applications Center',
      category: 'Navigation',
      shortcut: 'A',
      run: () => {
        if (activeDockTab !== 'projects') setPreviousDockTab(activeDockTab);
        setActiveDockTab('projects');
      },
    },
    {
      id: 'cmd-theme-cyberpunk',
      title: 'Switch Theme: Cyberpunk Neon',
      category: 'Theme',
      run: () => handleSelectTheme('cyberpunk-neon'),
    },
    {
      id: 'cmd-export-zip',
      title: 'Export Project as ZIP',
      category: 'Action',
      shortcut: 'E',
      run: () => setIsExportOpen(true),
    },
    {
      id: 'cmd-open-settings',
      title: 'Open Settings',
      category: 'Navigation',
      shortcut: 'S',
      run: () => setIsSettingsOpen(true),
    },
    {
      id: 'cmd-open-versions',
      title: 'Open Version Time Machine',
      category: 'Navigation',
      shortcut: 'V',
      run: () => setIsVersionsOpen(true),
    },
  ];

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans overflow-hidden transition-colors">
      {/* 顶部 macOS 窗口标题栏 */}
      <MacOSWindowHeader
        appName={activeApp?.name}
        workspaceDir={workspaceDir}
        themePresets={themePresets}
        activeThemeId={activeThemeId}
        onSelectTheme={handleSelectTheme}
        onManageApp={() => {
          if (activeDockTab !== 'projects') {
            setPreviousDockTab(activeDockTab);
          }
          setActiveDockTab('projects');
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVersions={() => setIsVersionsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onSelectDirectory={handleSelectDirectory}
        onMockBlueprint={desktop ? undefined : handleMockBlueprint}
        onMockQuestionnaire={desktop ? undefined : handleMockQuestionnaire}
        onCloseTab={activeApp ? handleCloseProject : undefined}
      />

      {/* 主工作区：左侧微坞 + 中间会话任务列 + 右侧三态工作区 */}
      <div className="flex flex-1 w-full h-[calc(100vh-44px)] overflow-hidden">
        {/* 最左侧微坞 (LeftDock) */}
        <LeftDock
          activeTab={activeDockTab}
          onSelectTab={(tab) => {
            if (activeDockTab !== 'components') {
              setPreviousDockTab(activeDockTab);
            }
            setActiveDockTab(tab);
          }}
          onOpenProjects={() => {
            if (activeDockTab !== 'projects') {
              setPreviousDockTab(activeDockTab);
            }
            setActiveDockTab('projects');
          }}
          onOpenTemplates={() => {
            if (activeDockTab !== 'templates') {
              setPreviousDockTab(activeDockTab);
            }
            setActiveDockTab('templates');
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenComponents={() => {
            if (activeDockTab !== 'components') {
              setPreviousDockTab(activeDockTab);
            }
            setActiveDockTab('components');
          }}
          onOpenStyle={() => {
            if (activeDockTab !== 'style') {
              setPreviousDockTab(activeDockTab);
            }
            setActiveDockTab('style');
          }}
        />

        {activeDockTab === 'home' ? (
          <HomeGuideView
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            settings={settings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            initialAttachments={attachments}
            onStartBuilding={(prompt, options, atts) => {
              if (options.style !== DEFAULT_HOME_STYLE.id) {
                setActiveThemeId(options.style);
              }
              handleStartBuilding(prompt, options, atts);
            }}
            styleTemplates={themePresets}
            activeStyleId={homeStyleId}
            onSelectStyleId={setHomeStyleId}
            pluginListRevision={pluginListRevision}
          />
        ) : activeDockTab === 'projects' ? (
          <ProjectsCenterView
            apps={apps}
            activeAppId={activeAppId}
            busy={desktop && (isChangingProject || isGenerating || isStartingApp)}
            error={desktop ? projectError : undefined}
            onOpenProject={(id) => {
              if (desktop) {
                void updateProject(async () => {
                  await activateProject(id);
                  setActiveDockTab('builder');
                });
                return;
              }
              setActiveAppId(id);
              const target = apps.find((a) => a.id === id);
              if (target) {
                setWorkspaceDir(target.path);
              }
              setActiveDockTab('builder');
            }}
            onNewProject={() => setActiveDockTab('home')}
            deleteCooldowns={projectDeleteCooldowns}
            onDeleteCooldownsChange={setProjectDeleteCooldowns}
            onDeleteApp={(id) => {
              if (desktop) {
                void updateProject(async () => {
                  await desktopApp().DeleteApp(id);
                  setApps((await desktopApp().ListApps()) ?? []);
                });
                return;
              }
              removePersistedProjectThumbnail(id);
              setApps((prev) => prev.filter((a) => a.id !== id));
            }}
            onRenameApp={(id, newName) => {
              setApps((prev) => prev.map((a) => (a.id === id ? { ...a, name: newName } : a)));
            }}
            onExportProject={(app) => {
              setExportTargetAppId(app.id);
              setIsExportOpen(true);
            }}
            onCaptureScreenshot={(app) =>
              handleCaptureProjectScreenshot(app.id, { targetUrl: '' }).catch(() => {})
            }
            capturingAppId={capturingAppId}
            onOpenInFileManager={desktop ? (path) => desktopApp().OpenInFileManager(path) : openInFileManager}
          />
        ) : activeDockTab === 'templates' ? (
          <TemplateCenterView
            templates={LOCAL_PROJECT_TEMPLATES}
            selectedTemplateId={settings[SELECTED_TEMPLATE_KEY]}
            onSelectTemplate={handleSelectTemplate}
            onCreateProject={handleCreateFromTemplate}
            busy={desktop && (isChangingProject || isGenerating)}
          />
        ) : activeDockTab === 'components' ? (
          <ComponentCenterView
            onGoBack={() => setActiveDockTab(previousDockTab || 'builder')}
            projects={apps}
            pluginListRevision={pluginListRevision}
            onPluginsChanged={() => setPluginListRevision((revision) => revision + 1)}
          />
        ) : activeDockTab === 'style' ? (
          <StyleCenterView
            presets={themePresets}
            activeThemeId={activeThemeId}
            onSelectTheme={(id) => {
              setHomeStyleId(id);
              handleSelectTheme(id);
            }}
            onAddCustomPreset={handleAddCustomPreset}
            onDeleteCustomPreset={handleDeleteCustomPreset}
            onRestoreDefaultPresets={handleRestoreDefaultPresets}
            settings={settings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        ) : (
          <>
            {/* 中间：会话与任务列 (ChatColumn) */}
            <section className="w-[440px] shrink-0 h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 transition-colors">
          {/* Chat 顶栏小工具条 */}
          <div className="h-10 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 select-none">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNewChat}
                aria-label="New chat"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('chat.newChat')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVersionsOpen(true)}
                title={t('chat.version')}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span>{t('chat.version')}{versions.length > 0 ? ` ${versions.length}` : ''}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                {t('chat.chatBlueprint')}
              </span>
              {blueprint?.approved && (
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.2 text-[10px] text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {t('chat.blueprintApproved')}
                </span>
              )}
            </div>
          </div>

          {/* 消息滚动流 */}
          <div
            className={`flex-1 overflow-y-auto p-4 bg-[#f5f5f7]/60 dark:bg-[#121214]/60 ${
              !activeApp && messages.length === 0 && !questionnaire && !blueprint
                ? 'flex flex-col justify-center items-center gap-4'
                : 'space-y-4'
            }`}
          >
            {projectError && (
              <div role="alert" className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
                {projectError}
              </div>
            )}
            {!activeApp && (
              <div
                data-testid="builder-no-project-card"
                className={`${MACOS_FLAT_CARD.surface} w-full max-w-[340px] mx-auto p-6 text-center select-none`}
              >
                <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0071e3]/10 dark:bg-[#0a84ff]/15 border border-[#0071e3]/15 dark:border-[#0a84ff]/20 text-[#0071e3] dark:text-[#0a84ff]">
                  <FolderKanban className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {t('chat.noActiveProjectTitle')}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#6e6e73] dark:text-[#98989d]">
                  {t('chat.noActiveProjectDesc')}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    data-testid="builder-create-or-open-btn"
                    onClick={() => {
                      setPreviousDockTab(activeDockTab);
                      setActiveDockTab('projects');
                    }}
                    className={`${MACOS_CONTROLS.primaryButton} w-full py-2.5`}
                  >
                    <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t('chat.createOrOpenProject')}</span>
                  </button>
                  <button
                    type="button"
                    data-testid="builder-go-home-btn"
                    onClick={() => {
                      setPreviousDockTab(activeDockTab);
                      setActiveDockTab('home');
                    }}
                    className={`${MACOS_CONTROLS.secondaryButton} w-full py-2`}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t('chat.newProjectFromHome')}</span>
                  </button>
                </div>
              </div>
            )}
            {activeApp && messages.length === 0 && !questionnaire && !blueprint && !projectError && (
              <div className={`${MACOS_FLAT_CARD.surface} p-5 text-center`}>
                <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#0a84ff]/15 dark:text-[#0a84ff] border border-[#0071e3]/15 dark:border-[#0a84ff]/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {t('chat.emptyChatTitle')}
                </h4>
                <p className="mt-1 text-[11px] leading-relaxed text-[#6e6e73] dark:text-[#98989d]">
                  {t('chat.emptyChatDesc')}
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                sender={msg.sender}
                content={resolveMessageText(msg)}
                attachments={msg.attachments}
                fileChanges={msg.fileChanges}
                onInspectFile={handleInspectFile}
              />
            ))}

            {/* 需求澄清问卷卡片 */}
            {questionnaire && (
              <QuestionnaireCard
                questions={questionnaire}
                summary={clarificationSummary}
                disabled={desktop && isGenerating}
                onSubmit={handleSubmitClarification}
                onSkip={handleSkipClarification}
              />
            )}

            {/* 蓝图审批门禁卡片 */}
            {blueprint && (
              <BlueprintCard
                blueprint={blueprint}
                onApprove={handleApproveBlueprint}
                loading={desktop && isGenerating}
              />
            )}

            {/* 依赖安装指示 */}
            {activeApp && installingDeps && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                <span className="h-2 w-2 animate-spin rounded-full border border-amber-500 border-t-transparent" />
                <span>{t('chat.installingDeps')} {installingDeps}...</span>
              </div>
            )}
            {activeApp && installedDependencies.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-2 text-xs text-emerald-700 dark:text-emerald-300">
                <span>✓</span>
                <span>{t('chat.installedDeps')} {installedDependencies.join(', ')}</span>
              </div>
            )}
            <div ref={chatScrollEndRef} />
          </div>

          {desktop && buildProgress && !isGenerating && !isChangingProject && (
            <div className="mx-3 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span>{t('chat.stepsCompleted', { completed: buildProgress.completed, total: buildProgress.total })}</span>
              <button
                type="button"
                onClick={() => void runDesktopTurn('', [], 'build', { resume: true })}
                className={`${MACOS_CONTROLS.primaryButton} px-3 py-1.5 rounded-[8px]`}
              >
                {t('chat.resumeBuild')}
              </button>
            </div>
          )}

          {/* 固定在输入框上方，长对话中也能看到当前生成阶段。 */}
          {(activeTool || generationProgress || (desktop && isChangingProject)) && (
            <div role="status" data-testid="build-progress" className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 p-2.5 text-xs text-blue-700 dark:text-blue-300">
              <span className="h-2 w-2 shrink-0 animate-ping rounded-full bg-blue-500" aria-hidden="true" />
              <span className="min-w-0 break-all">{activeTool ? `${t('chat.executingTool')} ${activeTool}…` : generationProgress || t('chat.preparingProject')}</span>
            </div>
          )}

          {/* 底部多模态富输入框 */}
          <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
            <form
              onSubmit={handleSendPrompt}
              className="rounded-2xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50/50 dark:bg-zinc-800/40 p-2.5 shadow-2xs focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all"
            >
              {/* 局部编辑上下文芯片：仅展示精简定位标签，隐藏大段源码 */}
              {pendingLocalEdit && (
                <div
                  data-testid="local-edit-context-chip"
                  className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-blue-200/80 bg-blue-50/80 px-2.5 py-1.5 text-[11px] text-blue-800 dark:border-blue-500/30 dark:bg-blue-950/50 dark:text-blue-200"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Wand2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold shrink-0">{t('chat.localEditTag')}</span>
                    <span className="truncate font-mono text-[11px] text-slate-700 dark:text-zinc-200">
                      {pendingLocalEdit.componentPath}
                    </span>
                    {pendingLocalEdit.tagName && (
                      <span className="rounded bg-blue-100 px-1 py-0.2 font-mono text-[10px] dark:bg-blue-900/60">
                        &lt;{pendingLocalEdit.tagName}&gt;
                      </span>
                    )}
                    {pendingLocalEdit.lineRange && (
                      <span className="rounded bg-white/80 px-1 py-0.2 font-mono text-[10px] text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {pendingLocalEdit.lineRange}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={t('localEdit.clearContext')}
                    title={t('localEdit.clearContext')}
                    onClick={() => setPendingLocalEdit(null)}
                    className="rounded p-0.5 text-slate-400 hover:bg-blue-100 hover:text-slate-700 dark:hover:bg-blue-900/60 dark:hover:text-zinc-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {/* 已选附件缩略条 */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-1.5 bg-white dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-zinc-700 rounded-md text-[11px] text-slate-700 dark:text-zinc-200 shadow-2xs"
                    >
                      <img src={att.dataUrl} alt={att.name} className="w-4 h-4 rounded object-cover" />
                      <span className="truncate max-w-[120px] font-mono">{att.name}</span>
                      <button
                        type="button"
                        aria-label={`${t('chat.removeAttachment')} ${att.name}`}
                        onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                        className="text-slate-400 hover:text-rose-500 ml-1 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                placeholder={t('chat.placeholder')}
                rows={2}
                className="w-full resize-none bg-transparent text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-zinc-700/60">
                {/* 模式与模型选择 */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBuildMode(buildMode === 'build' ? 'plan' : 'build')}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-700/70 border border-slate-200 dark:border-zinc-600 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Hammer className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>{buildMode === 'build' ? t('chat.modeBuild') : t('chat.modePlan')}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  <ModelSelector
                    value={selectedModel}
                    onChange={setSelectedModel}
                    settings={settings}
                    configuredProvider={settings['llm.provider']}
                    configuredModel={settings['llm.model']}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                  />
                </div>

                {/* 右侧附件与发送按钮 */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    aria-label="Upload attachment input"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={t('chat.addAttachment')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={handleCancelGeneration}
                      aria-label="Stop generation"
                      title={t('chat.stopGeneration')}
                      className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-2xs transition-colors"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      aria-label="Send prompt"
                      title={t('chat.send')}
                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* 右侧：三态工作区 (WorkspacePanel: Preview | Code | Publish) */}
        <WorkspacePanel
          blueprint={blueprint}
          onApproveBlueprint={handleApproveBlueprint}
          nativePreview={nativePreview}
          activeView={workspaceView}
          onViewChange={setWorkspaceView}
          isLoading={isStartingApp}
          loadingMessage={previewProgress}
          previewUrl={previewUrl}
          previewDoc={desktop || !activeApp ? undefined : generateSandboxDoc(activeApp.name, activeThemeId, blueprint, locale, extraSandboxItems)}
          previewKey={previewKey}
          sourcePaths={desktop ? sourcePaths : undefined}
          sourceRevision={sourceRevision}
          focusedFile={focusedFile}
          onReadFile={desktop ? readProjectFile : undefined}
          diagnostics={diagnostics}
          onSelectDiagnostic={(diag) => {
            if (diag.file) setFocusedFile(diag.file);
          }}
          isInspectMode={isInspectMode}
          onToggleInspect={() => setIsInspectMode((prev) => !prev)}
          onSelectComponent={(path, prompt) => {
            if (desktop) {
              if (!sourcePaths.includes(path)) {
                reportError('Source location is unavailable for this element.');
                return;
              }
              handleInspectFile(path);
            }
            const isStructuredLocalEdit =
              prompt.includes('[Target Component:') || /^@\[[^\]]+\]\s*Local Edit:/m.test(prompt);
            if (isStructuredLocalEdit) {
              const draft = extractLocalEditDraft(prompt, path);
              if (draft) {
                setPendingLocalEdit(draft);
                setInputPrompt(draft.instruction);
              } else {
                setInputPrompt(prompt);
              }
            } else {
              setPendingLocalEdit(null);
              setInputPrompt(prompt);
            }
            setActiveDockTab('builder');
            setIsInspectMode(false);
          }}
          files={desktop ? undefined : [
            {
              path: 'src/components/PantryList.tsx',
              content: `import React from 'react';\n\nexport const PantryList: React.FC = () => {\n  return (\n    <div className="p-4 bg-white rounded-lg shadow">\n      <h2 className="text-lg font-bold">Pantry Inventory</h2>\n    </div>\n  );\n};`,
            },
            {
              path: 'src/components/RecipeCard.tsx',
              content: `import React from 'react';\n\nexport const RecipeCard: React.FC = () => {\n  return (\n    <div className="border p-4 rounded-xl">\n      <h3>Dinner Suggestion</h3>\n    </div>\n  );\n};`,
            },
          ]}
          systemLogs={systemLogs}
          onReload={() => {
            if (desktop) {
              if (activeAppId && !isStartingApp && !isGenerating) void startPreview(activeAppId).catch(reportError);
              return;
            }
            setIsStartingApp(true);
            setTimeout(() => setIsStartingApp(false), 500);
          }}
          onRestart={desktop && activeAppId ? () => void startPreview(activeAppId, true).catch(reportError) : undefined}
          onCaptureScreenshot={
            activeAppId
              ? (ctx) =>
                  handleCaptureProjectScreenshot(activeAppId, {
                    targetUrl: ctx.previewUrl,
                    captureFrame: ctx.captureFrame,
                  })
              : undefined
          }
          onPreviewLoaded={handlePreviewLoaded}
          isCapturingScreenshot={capturingAppId === activeAppId && activeAppId > 0}
          previewActionsDisabled={isStartingApp || (desktop && (isGenerating || isChangingProject))}
          onOpenExternal={previewUrl ? () => window.open(previewUrl, '_blank', 'noopener,noreferrer') : undefined}
          onPublish={() => setIsExportOpen(true)}
        />
          </>
        )}
      </div>

      {/* 模态框组 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSettings={settings}
        defaultWorkspaceDir={workspaceDir}
        onSave={async (newCfg) => {
          await (desktop ? desktopApp().SaveSettings(newCfg) : saveSettings(newCfg));
          setSettings((previous) => ({ ...previous, ...newCfg }));
          if (newCfg['workspace.dir']) {
            setWorkspaceDir(newCfg['workspace.dir']);
          }
        }}
        onTestConnection={testLLMConnection}
      />

      <VersionTimelineModal
        key={activeAppId}
        isOpen={isVersionsOpen}
        rollbackDisabled={desktop && (isGenerating || isStartingApp || isChangingProject)}
        onClose={() => setIsVersionsOpen(false)}
        versions={versions}
        onSelectVersion={(hash) => desktop
          ? desktopApp().GetVersionDiff(activeAppId, hash)
          : fetchVersionDiff(activeAppId, hash)}
        onRollback={async (hash) => {
          if (desktop) {
            if (!activeAppId || isGenerating || isStartingApp) throw new Error('Wait for the active operation to complete.');
            await desktopApp().RollbackVersion(activeAppId, hash);
            await refreshProject(activeAppId);
            if (previewUrl) setPreviewKey((key) => key + 1);
            return;
          }
          await rollbackVersion(activeAppId, hash);
          setMessages((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              sender: 'assistant',
              content: `Successfully rolled back to version ${hash.slice(0, 7)}. Working directory and live preview restored.`,
            },
          ]);
        }}
      />

      <AppDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        apps={apps}
        activeAppId={activeAppId}
        busy={desktop && (isChangingProject || isGenerating || isStartingApp)}
        error={desktop ? projectError : undefined}
        onCreateNamedApp={desktop ? createDesktopProject : undefined}
        onSelectApp={(id) => {
          if (desktop) {
            setIsDrawerOpen(false);
            void updateProject(() => activateProject(id));
            return;
          }
          setActiveAppId(id);
          const target = apps.find((a) => a.id === id);
          if (target) {
            setWorkspaceDir(target.path);
          }
          setIsDrawerOpen(false);
        }}
        onCreateApp={() => {
          const newId = Date.now();
          const nextIndex = apps.length === 1 || apps.some((a) => a.id === 1) ? 2 : apps.length + 1;
          const baseDir = (settings['workspace.dir'] || workspaceDir || '/workspace').replace(/\/+$/, '');
          const newApp: AppItem = {
            id: newId,
            name: `Project ${nextIndex}`,
            path: `${baseDir}/project-${nextIndex}`,
            createdAt: new Date().toISOString(),
          };
          setApps((prev) => [...prev, newApp]);
          setActiveAppId(newId);
          setWorkspaceDir(newApp.path);
          setIsDrawerOpen(false);
        }}
        onDeleteApp={(id) => {
          if (desktop) {
            void updateProject(async () => {
              await desktopApp().DeleteApp(id);
              setApps((await desktopApp().ListApps()) ?? []);
            });
            return;
          }
          setApps((prev) => prev.filter((a) => a.id !== id));
        }}
        onOpenTemplates={() => {
          setIsDrawerOpen(false);
          setActiveDockTab('templates');
        }}
      />

      {(() => {
        const exportTargetApp =
          exportTargetAppId != null
            ? apps.find((a) => a.id === exportTargetAppId) ?? activeApp
            : activeApp;
        const targetId = exportTargetApp?.id ?? activeAppId;
        return (
          <ExportModal
            key={`export-modal-${targetId || 'none'}`}
            isOpen={isExportOpen}
            onClose={() => {
              setIsExportOpen(false);
              setExportTargetAppId(null);
            }}
            appName={exportTargetApp?.name ?? 'No project selected'}
            onExportZip={() =>
              desktop ? desktopApp().ExportAppZip(targetId, '') : exportAppZip(targetId)
            }
            onRevealInFileManager={
              desktop ? (path) => desktopApp().OpenInFileManager(path) : openInFileManager
            }
          />
        );
      })()}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={commandActions}
      />

      {/* 自动更新提示 */}
      <UpdateNotifier />
    </div>
  );
};

export const App: React.FC<AppProps> = ({ initialDockTab = 'home' }) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent initialDockTab={initialDockTab} />
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
