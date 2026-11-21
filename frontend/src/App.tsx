import React, { useState, useEffect, useRef } from 'react';
import { BlueprintCard, BlueprintDTO } from './components/BlueprintCard';
import { QuestionnaireCard, QuestionItem } from './components/QuestionnaireCard';
import { SettingsModal } from './components/SettingsModal';
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
import { Plus, Send, Square, Hammer, ChevronDown } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  fileChanges?: FileActionItem[];
}

const AppContent: React.FC = () => {
  const { locale, t } = useI18n();

  const [activeDockTab, setActiveDockTab] = useState<DockTab>('home');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('preview');
  const [activeAppId, setActiveAppId] = useState<number>(1);
  const [apps, setApps] = useState<AppItem[]>([
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

  const activeApp = apps.find((a) => a.id === activeAppId) || apps[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
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
  const [buildMode, setBuildMode] = useState<'build' | 'plan'>('build');
  const [blueprint, setBlueprint] = useState<BlueprintDTO | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionItem[] | null>(null);
  const [previewUrl] = useState('http://localhost:5173');
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
  const [systemLogs, setSystemLogs] = useState<string[]>([
    'Vite dev server listening on http://localhost:5173',
    'Compiled src/components/PantryList.tsx in 14ms',
    'Updating AST module for src/components/RecipeCard.tsx',
  ]);

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [workspaceDir, setWorkspaceDir] = useState<string>('/workspace/default-app');
  const [versions] = useState<VersionItem[]>([
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

  const [installedDependencies, setInstalledDependencies] = useState<string[]>(['lucide-react']);
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
    try {
      const wailsApp = (window as unknown as {
        go?: { main?: { App?: { SelectDirectory?: (title: string) => Promise<string> } } };
      })?.go?.main?.App;
      if (wailsApp?.SelectDirectory) {
        const selected = await wailsApp.SelectDirectory('Select Workspace Directory');
        if (selected) {
          setWorkspaceDir(selected);
          return;
        }
      }
    } catch {
      // 捕获异常
    }
    setWorkspaceDir('/workspace/my-blot-app');
  };

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inputPrompt.trim();
    if (!prompt) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      content: prompt,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');

    if (prompt.toLowerCase().includes('recharts') || prompt.toLowerCase().includes('lucide-react')) {
      setInstallingDeps('lucide-react, recharts');
      setTimeout(() => {
        setInstallingDeps(null);
        setInstalledDependencies((prev) => Array.from(new Set([...prev, 'lucide-react', 'recharts'])));
      }, 300);
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

  const handleApproveBlueprint = (_chatId: number) => {
    if (!blueprint) return;
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
    setWorkspaceView('code');
    setSystemLogs((prev) => [...prev, `Inspecting source: ${path}`]);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: String(Date.now()),
        sender: 'assistant',
        content: `Started a new conversation for ${activeApp.name}. What would you like to build next?`,
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
        appName={activeApp.name}
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
        onMockBlueprint={handleMockBlueprint}
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
                <span>{t('chat.version')} 1</span>
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

                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-700/70 border border-slate-200 dark:border-zinc-600 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <span>{t('chat.modelAuto')}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                </div>

                {/* 右侧附件与发送按钮 */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
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
          previewDoc={generateSandboxDoc(activeApp.name, activeThemeId, blueprint, locale)}
          isInspectMode={isInspectMode}
          onToggleInspect={() => setIsInspectMode((prev) => !prev)}
          onSelectComponent={(_path, prompt) => {
            setInputPrompt(prompt);
            setIsInspectMode(false);
          }}
          files={[
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
            setIsStartingApp(true);
            setTimeout(() => setIsStartingApp(false), 500);
          }}
          onPublish={() => setIsExportOpen(true)}
        />
      </div>

      {/* 模态框组 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSettings={settings}
        onSave={(newCfg) => setSettings(newCfg)}
        onTestConnection={async () => 'Connection established successfully'}
      />

      <VersionTimelineModal
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        versions={versions}
        onSelectVersion={async (hash) => ({
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
        })}
        onRollback={async (hash) => {
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
        onSelectApp={(id) => {
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
        appName={activeApp.name}
        onExportZip={async () => `/downloads/${activeApp.name.toLowerCase().replace(/\s+/g, '-')}-export.zip`}
        onRevealInFileManager={async () => {}}
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
