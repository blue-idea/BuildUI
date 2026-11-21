import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BlueprintCard, BlueprintDTO } from './components/BlueprintCard';
import { QuestionnaireCard, QuestionItem } from './components/QuestionnaireCard';
import { SettingsModal } from './components/SettingsModal';
import { ModelSelector } from './components/ModelSelector';
import { VersionTimelineModal, VersionItem } from './components/VersionTimelineModal';
import { AppDrawer, AppItem } from './components/AppDrawer';
import { ExportModal } from './components/ExportModal';
import { TemplateModal, AppTemplate } from './components/TemplateModal';
import { CommandPalette, CommandAction } from './components/CommandPalette';
import { MacOSWindowHeader } from './components/MacOSWindowHeader';
import { LeftDock, DockTab } from './components/LeftDock';
import { FileChangeCard } from './components/FileChangeCard';
import { WorkspacePanel, WorkspaceView } from './components/WorkspacePanel';
import { FileActionItem } from './types/fileAction';
import { ThemePreset } from './components/ThemeSelector';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { generateSandboxDoc } from './utils/sandboxTemplate';
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
  desktopApp,
  essentialEvent,
  isWailsAvailable,
} from './services/wailsBridge';
import { Plus, Send, Square, Hammer, ChevronDown } from 'lucide-react';

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

const AppContent: React.FC = () => {
  const { locale, t } = useI18n();
  const desktop = isWailsAvailable();

  const [activeDockTab, setActiveDockTab] = useState<DockTab>('home');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('preview');
  const [activeAppId, setActiveAppId] = useState<number>(desktop ? 0 : 1);
  const [apps, setApps] = useState<AppItem[]>(desktop ? [] : [
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
  ]);

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
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [buildMode, setBuildMode] = useState<'build' | 'plan'>('build');
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [extraSandboxItems, setExtraSandboxItems] = useState<string[]>([]);
  const [blueprint, setBlueprint] = useState<BlueprintDTO | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionItem[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState(desktop ? '' : 'http://localhost:5173');
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
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
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

  const [themePresets] = useState<ThemePreset[]>([
    {
      id: 'dark-slate',
      name: 'Midnight Slate',
      primary: '#3b82f6',
      background: '#020617',
    },
    {
      id: 'cyberpunk-neon',
      name: 'Cyberpunk Neon',
      primary: '#00ffcc',
      background: '#0a0a12',
    },
    {
      id: 'forest-emerald',
      name: 'Forest Emerald',
      primary: '#10b981',
      background: '#051b14',
    },
    {
      id: 'sunset-glow',
      name: 'Sunset Glow',
      primary: '#f97316',
      background: '#1a0f0a',
    },
    {
      id: 'clean-light',
      name: 'Minimalist Light',
      primary: '#2563eb',
      background: '#ffffff',
    },
  ]);
  const [activeThemeId, setActiveThemeId] = useState<string>('dark-slate');

  const [installedDependencies, setInstalledDependencies] = useState<string[]>(desktop ? [] : ['lucide-react']);
  const [installingDeps, setInstallingDeps] = useState<string | null>(null);

  const [templates] = useState<AppTemplate[]>([
    {
      id: 'saas-dashboard',
      name: 'SaaS Analytics Dashboard',
      description: 'Production-ready metrics dashboard featuring revenue KPI cards',
      category: 'Analytics',
      tags: ['Charts', 'KPIs', 'Metrics'],
      icon: '📊',
      themeId: 'dark-slate',
    },
    {
      id: 'portfolio',
      name: 'Creative Developer Portfolio',
      description: 'High-contrast personal portfolio layout with bio hero and projects showcase',
      category: 'Personal',
      tags: ['Cyberpunk', 'Hero', 'Projects'],
      icon: '⚡',
      themeId: 'cyberpunk-neon',
    },
    {
      id: 'landing-page',
      name: 'Modern Product Landing Page',
      description: 'Clean landing page featuring sticky navigation and pricing tables',
      category: 'Marketing',
      tags: ['Landing', 'SaaS', 'Pricing'],
      icon: '🚀',
      themeId: 'clean-light',
    },
    {
      id: 'storefront',
      name: 'E-Commerce Showcase',
      description: 'Warm twilight storefront with product cards and cart drawer',
      category: 'Commerce',
      tags: ['Shop', 'Catalog', 'Cart'],
      icon: '🛍️',
      themeId: 'sunset-glow',
    },
  ]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reportError = (error: unknown) => setProjectError(error instanceof Error ? error.message : String(error));

  const refreshProject = async (id: number) => {
    const [history, paths] = await Promise.all([
      desktopApp().GetVersions(id),
      desktopApp().ListProjectFiles(id),
    ]);
    setVersions(history ?? []);
    setSourcePaths(paths);
    setSourceRevision((revision) => revision + 1);
    return history ?? [];
  };

  const startPreview = async (id: number, verify = false) => {
    setIsStartingApp(true);
    try {
      const result = await desktopApp().RunApp({ appId: id });
      setPreviewUrl(result.previewUrl);
      setPreviewKey((key) => key + 1);
      setSystemLogs((logs) => [...logs, `Preview is running at ${result.previewUrl}`]);
      if (verify) {
        const result = await desktopApp().CheckTypeScript({ appId: id, paths: [] });
        setSystemLogs((logs) => [
          ...logs,
          ...(result.hasErrors
            ? (result.problems ?? []).map((problem) => `${problem.file}:${problem.line}:${problem.column} ${problem.message}`)
            : ['TypeScript check completed without errors.']),
        ]);
      }
    } finally {
      setIsStartingApp(false);
    }
  };

  const loadChat = (projectChat: Awaited<ReturnType<ReturnType<typeof desktopApp>['GetProjectChat']>>) => {
    chatID.current = projectChat.chatId;
    setBlueprint(projectChat.blueprint);
    setMessages((projectChat.messages ?? []).map((msg) => ({
      id: String(msg.id),
      sender: msg.role,
      content: msg.content,
    })));
  };

  const handleCloseProject = () => {
    if (desktop && activeAppId) {
      void desktopApp().StopApp?.({ appId: activeAppId }).catch(() => {});
    }
    setActiveAppId(0);
    projectID.current = 0;
    chatID.current = 0;
    setWorkspaceDir('');
    setMessages([]);
    setBlueprint(null);
    setFocusedFile('');
    setInputPrompt('');
    setAttachments([]);
    setSourcePaths([]);
    setVersions([]);
    setSystemLogs([]);
    setPreviewUrl('');
    setIsInspectMode(false);
    setIsVersionsOpen(false);
    setProjectError('');
  };

  const activateProject = async (id: number) => {
    const active = await desktopApp().SwitchApp(id);
    projectID.current = id;
    chatID.current = 0;
    setActiveAppId(id);
    setWorkspaceDir(active.path);
    setMessages([]);
    setBlueprint(null);
    setFocusedFile('');
    setInputPrompt('');
    setAttachments([]);
    setSourcePaths([]);
    setVersions([]);
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
    if (active.blueprintApproved && history.length > 1 && !active.previewUrl) {
      await startPreview(id);
    }
  };

  const updateProject = async (operation: () => Promise<void>) => {
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

  const createDesktopProject = (name: string, templateId?: string) => updateProject(async () => {
    const api = desktopApp();
    const created = templateId
      ? await api.CreateAppFromTemplate({ appName: name, templateId })
      : await api.CreateApp({ name });
    setApps((previous) => [...previous, { id: created.appId, name: created.name, path: created.path }]);
    setIsDrawerOpen(false);
    setIsTemplateModalOpen(false);
    await activateProject(created.appId);
  });

  const runDesktopTurn = async (prompt: string, images: string[], mode: 'build' | 'plan', approve = false) => {
    if (!chatID.current || turn.current || isChangingProject) return;
    const current = { id: `turn-${Date.now()}`, commit: '', cancelled: false };
    turn.current = current;
    setProjectError('');
    setIsGenerating(true);
    const id = chatID.current;
    try {
      if (approve) {
        await desktopApp().ApproveBlueprint(id);
        setBlueprint((bp) => bp && { ...bp, approved: true });
      }
      setMessages((previous) => [...previous, { id: current.id, sender: 'assistant', content: '' }]);
      await desktopApp().StreamChat({ chatId: id, prompt, mode, attachments: images });
      const history = await refreshProject(activeAppId);
      if (current.commit || (mode === 'build' && (approve || blueprint?.approved) && history.length > 1)) {
        await startPreview(activeAppId, true);
      }
    } catch (error) {
      if (!current.cancelled) reportError(error);
    } finally {
      setMessages((previous) => previous.filter((message) => (
        message.id !== current.id || message.content || message.fileChanges?.length
      )));
      turn.current = null;
      setIsGenerating(false);
      setActiveTool(null);
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
        setSettings(cfg);
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
      onChunk: (data) => {
        const current = forTurn(data.chatId);
        if (current) updateAssistant(current.id, (message) => ({ ...message, content: message.content + data.chunk }));
      },
      onToolStart: (data) => {
        const current = forTurn(data.chatId);
        if (!current) return;
        setActiveTool(`${data.tool}${data.path ? ': ' + data.path : ''}`);
        const path = data.path;
        if (path) updateAssistant(current.id, (message) => ({
          ...message,
          fileChanges: [...(message.fileChanges ?? []), {
            id: `${current.id}-${message.fileChanges?.length ?? 0}`,
            filename: path.split('/').pop() ?? path, path, status: 'writing',
          }],
        }));
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

    return () => {
      unsubscribe();
      stopBlueprint();
      stopConsole();
    };
  }, []);

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.id === 'msg-user-1') {
      return t('chat.userDemoPrompt');
    }
    if (msg.id === 'msg-assistant-1') {
      return t('chat.assistantDemoReply');
    }
    return msg.content;
  };

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
        else setIsDrawerOpen(true);
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

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inputPrompt.trim();
    if (!prompt && attachments.length === 0) return;
    if (desktop && !chatID.current) {
      setIsDrawerOpen(true);
      return;
    }
    if (desktop && (turn.current || isChangingProject)) return;

    const currentAttachments = [...attachments];
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      content: prompt || (currentAttachments.length > 0 ? t('chat.attachedImage') : ''),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setAttachments([]);
    if (desktop) {
      void runDesktopTurn(prompt, currentAttachments.map((attachment) => attachment.dataUrl), buildMode);
      return;
    }

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
            content: `Updated components based on your request: "${prompt}". Live preview refreshed.`,
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
        content: 'Generation stopped by user.',
      },
    ]);
  };

  const handleApproveBlueprint = (approvedChatId: number) => {
    if (!blueprint) return;
    if (desktop) {
      if (approvedChatId === chatID.current) {
        void runDesktopTurn('Implement the approved blueprint and the original user request.', [], 'build', true);
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
          content: 'Application code generated and verified in local sandbox. You can see the live preview on the right.',
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
      appName: 'Demo Portfolio',
      designDirection: 'Cyberpunk Neon Dark Mode',
      primaryColor: '#00ffcc',
      themeId: 'dark',
      visuals: [
        {
          id: 'v-1',
          type: 'logo',
          description: 'Neon glowing badge',
          prompt: 'cyberpunk hexagon',
        },
      ],
      approved: false,
    });
  };

  const handleSelectTemplate = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    if (desktop) {
      if (!isChangingProject && !isGenerating) void createDesktopProject(tmpl.name, templateId);
      return;
    }

    const newId = Date.now();
    const newApp: AppItem = {
      id: newId,
      name: tmpl.name,
      path: `/workspace/${tmpl.id}`,
      createdAt: new Date().toISOString(),
    };
    setApps((prev) => [...prev, newApp]);
    setActiveAppId(newId);
    setWorkspaceDir(newApp.path);
    setIsTemplateModalOpen(false);
    setMessages([
      {
        id: String(Date.now()),
        sender: 'assistant',
        content: `Instantiated new application from template "${tmpl.name}". Initial codebase scaffolded and loaded into workspace.`,
      },
    ]);
  };

  const handleInspectFile = (path: string) => {
    setFocusedFile(path);
    setWorkspaceView('code');
    setSystemLogs((prev) => [...prev, `Inspecting source: ${path}`]);
  };

  const handleNewChat = () => {
    if (desktop) {
      if (!activeAppId) setIsDrawerOpen(true);
      else if (!isGenerating && !isChangingProject) {
        void updateProject(async () => loadChat(await desktopApp().CreateProjectChat(activeAppId)));
      }
      return;
    }
    setMessages([
      {
        id: String(Date.now()),
        sender: 'assistant',
        content: `Started a new conversation for ${activeApp?.name}. What would you like to build next?`,
      },
    ]);
  };

  const commandActions: CommandAction[] = [
    {
      id: 'cmd-templates',
      title: 'Open Template Center',
      category: 'Navigation',
      shortcut: 'T',
      run: () => setIsTemplateModalOpen(true),
    },
    {
      id: 'cmd-apps',
      title: 'Open Applications Drawer',
      category: 'Navigation',
      shortcut: 'A',
      run: () => setIsDrawerOpen(true),
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
        onManageApp={() => setIsDrawerOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVersions={() => setIsVersionsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onSelectDirectory={handleSelectDirectory}
        onMockBlueprint={desktop ? undefined : handleMockBlueprint}
        onCloseTab={activeApp ? handleCloseProject : undefined}
      />

      {/* 主工作区：左侧微坞 + 中间会话任务列 + 右侧三态工作区 */}
      <div className="flex flex-1 w-full h-[calc(100vh-44px)] overflow-hidden">
        {/* 最左侧微坞 (LeftDock) */}
        <LeftDock
          activeTab={activeDockTab}
          onSelectTab={setActiveDockTab}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenComponents={() => setIsInspectMode((prev) => !prev)}
        />

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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {projectError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{projectError}</p>}
            {!activeApp && (
              <button type="button" onClick={() => setIsDrawerOpen(true)} className="text-sm font-medium text-purple-600">
                Create or open a project
              </button>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* 消息气泡：用户为淡紫色气泡，助手为纯白/微深色卡片 */}
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#e8e5ff] text-[#2c246b] dark:bg-indigo-950/70 dark:text-indigo-200 font-medium shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 shadow-2xs'
                  }`}
                >
                  {renderMessageContent(msg)}

                  {/* 消息附带的图片/多模态附件展示 */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-black/5"
                        >
                          <img src={att.dataUrl} alt={att.name} className="w-28 h-20 object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 text-[9px] text-white truncate">
                            {att.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 文件修改进度卡片群 */}
                {msg.fileChanges && msg.fileChanges.length > 0 && (
                  <div className="w-full mt-2 pl-2">
                    {msg.fileChanges.map((fc) => (
                      <FileChangeCard
                        key={fc.id}
                        item={fc}
                        onInspect={handleInspectFile}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 需求澄清问卷卡片 */}
            {questionnaire && (
              <QuestionnaireCard
                questions={questionnaire}
                onSubmit={(answers) => {
                  setQuestionnaire(null);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: String(Date.now()),
                      sender: 'user',
                      content: `Submitted questionnaire answers (${Object.keys(answers).length} answered)`,
                    },
                  ]);
                }}
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
            {installingDeps && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                <span className="h-2 w-2 animate-spin rounded-full border border-amber-500 border-t-transparent" />
                <span>{t('chat.installingDeps')} {installingDeps}...</span>
              </div>
            )}
            {installedDependencies.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-2 text-xs text-emerald-700 dark:text-emerald-300">
                <span>✓</span>
                <span>{t('chat.installedDeps')} {installedDependencies.join(', ')}</span>
              </div>
            )}

            {/* 工具执行指示 */}
            {activeTool && (
              <div className="flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 p-2.5 text-xs text-blue-700 dark:text-blue-300">
                <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" />
                <span>{t('chat.executingTool')} {activeTool}...</span>
              </div>
            )}
          </div>

          {/* 底部多模态富输入框 */}
          <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
            <form
              onSubmit={handleSendPrompt}
              className="rounded-2xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50/50 dark:bg-zinc-800/40 p-2.5 shadow-2xs focus-within:border-purple-400 dark:focus-within:border-purple-500 focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all"
            >
              {/* 已选附件缩略条 */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-1.5 bg-white dark:bg-zinc-850 rounded-lg border border-slate-200 dark:border-zinc-700">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-zinc-750 rounded-md text-[11px] text-slate-700 dark:text-zinc-200 shadow-2xs"
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
                    <Hammer className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>{buildMode === 'build' ? t('chat.modeBuild') : t('chat.modePlan')}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  <ModelSelector
                    value={selectedModel}
                    onChange={setSelectedModel}
                    configuredProvider={settings['llm.provider']}
                    configuredModel={settings['llm.model']}
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
                      className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors"
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
          activeView={workspaceView}
          onViewChange={setWorkspaceView}
          isLoading={isStartingApp}
          previewUrl={previewUrl}
          previewDoc={desktop ? undefined : generateSandboxDoc(activeApp?.name ?? '', activeThemeId, blueprint, locale, extraSandboxItems)}
          previewKey={previewKey}
          sourcePaths={desktop ? sourcePaths : undefined}
          sourceRevision={sourceRevision}
          focusedFile={focusedFile}
          onReadFile={desktop ? readProjectFile : undefined}
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
            setInputPrompt(prompt);
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
          onOpenExternal={previewUrl ? () => window.open(previewUrl, '_blank', 'noopener,noreferrer') : undefined}
          onPublish={() => setIsExportOpen(true)}
        />
      </div>

      {/* 模态框组 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSettings={settings}
        onSave={async (newCfg) => {
          await (desktop ? desktopApp().SaveSettings(newCfg) : saveSettings(newCfg));
          setSettings(newCfg);
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
          const newApp: AppItem = {
            id: newId,
            name: `Project ${nextIndex}`,
            path: `/workspace/project-${nextIndex}`,
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
          setIsTemplateModalOpen(true);
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        appName={activeApp?.name ?? 'No project selected'}
        onExportZip={() => desktop ? desktopApp().ExportAppZip(activeAppId, '') : exportAppZip(activeAppId)}
        onRevealInFileManager={desktop ? (path) => desktopApp().OpenInFileManager(path) : openInFileManager}
      />

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        onSelectTemplate={handleSelectTemplate}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={commandActions}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
