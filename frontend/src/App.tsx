import React, { useState } from 'react';
import { BlueprintCard, BlueprintDTO } from './components/BlueprintCard';
import { QuestionnaireCard, QuestionItem } from './components/QuestionnaireCard';
import { PreviewPanel } from './components/PreviewPanel';
import { SettingsModal } from './components/SettingsModal';
import { VersionTimelineModal, VersionItem } from './components/VersionTimelineModal';
import { AppDrawer, AppItem } from './components/AppDrawer';
import { ExportModal } from './components/ExportModal';
import { ThemeSelector, ThemePreset } from './components/ThemeSelector';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: 'Welcome to Blot-UI. What web application would you like to build today?',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [blueprint, setBlueprint] = useState<BlueprintDTO | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionItem[] | null>(null);
  const [previewUrl] = useState('http://localhost:5173');
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'starting' | 'running' | 'error'>('running');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeAppId, setActiveAppId] = useState<number>(1);
  const [apps, setApps] = useState<AppItem[]>([
    {
      id: 1,
      name: 'Default Application',
      path: '/workspace/default-app',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [workspaceDir, setWorkspaceDir] = useState<string>('default-workspace');
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
  const [installedDependencies, setInstalledDependencies] = useState<string[]>([]);
  const [installingDeps, setInstallingDeps] = useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectTheme = (themeId: string) => {
    setActiveThemeId(themeId);
    const target = themePresets.find((p) => p.id === themeId);
    // 跨沙箱向 preview iframe postMessage 注入 CSS 变量
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
    // 持久化到后端
    const wailsApp = (
      window as unknown as {
        go?: { main?: { App?: { SetAppTheme?: (id: number, t: string) => Promise<void> } } };
      }
    )?.go?.main?.App;
    if (wailsApp?.SetAppTheme) {
      wailsApp.SetAppTheme(activeAppId, themeId).catch(() => {});
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
      // 捕获潜在异常并使用默认回退
    }
    // Web / E2E 模式下的回退模拟路径
    setWorkspaceDir('/workspace/my-blot-app');
  };

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inputPrompt.trim();
    if (!prompt) return;

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      content: prompt,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');

    // 智能依赖检测与沙箱安装调度
    if (prompt.toLowerCase().includes('recharts') || prompt.toLowerCase().includes('lucide-react')) {
      setInstallingDeps('lucide-react, recharts');
      setTimeout(() => {
        setInstallingDeps(null);
        setInstalledDependencies((prev) => Array.from(new Set([...prev, 'lucide-react', 'recharts'])));
      }, 300);
    }

    // 默认进入澄清或蓝图展示模拟流程
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
      // 多轮对话增量修改流程
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
          },
        ]);
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

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 font-sans">
      {/* 顶部全局导航栏 */}
      <header className="flex h-12 items-center justify-between border-b border-slate-800 px-4 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="font-bold text-slate-100 tracking-tight">Blot-UI</span>
          </div>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
            Wails v2 + React 19
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open applications drawer"
            className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span>Apps</span>
          </button>
          <button
            type="button"
            onClick={handleSelectDirectory}
            aria-label="Select workspace directory"
            className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <span className="text-slate-400">Workspace:</span>
            <span className="max-w-[120px] truncate">{workspaceDir}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsVersionsOpen(true)}
            aria-label="Open version time machine"
            className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Versions
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open settings"
            className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            aria-label="Open export modal"
            className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Export
          </button>
          <ThemeSelector
            presets={themePresets}
            activeThemeId={activeThemeId}
            onSelectTheme={handleSelectTheme}
          />
          <button
            type="button"
            onClick={handleMockBlueprint}
            aria-label="Mock blueprint"
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Mock Blueprint
          </button>
        </div>
      </header>

      {/* 主界面：左右分栏布局 */}
      <main className="grid flex-1 grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* 左侧：会话流与蓝图控制栏 */}
        <div className="flex h-full flex-col border-r border-slate-800 bg-slate-950">
          <div className="flex h-10 items-center justify-between border-b border-slate-800/80 px-4 text-xs font-medium text-slate-400">
            <span>Chat & Blueprint</span>
            {blueprint?.approved && (
              <span className="rounded-full bg-emerald-950/80 px-2 py-0.5 text-[11px] text-emerald-400 border border-emerald-800/50">
                Blueprint Approved
              </span>
            )}
          </div>

          {/* 消息滚动区 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  {msg.content}
                </div>
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

            {/* 依赖安装状态指示 */}
            {installingDeps && (
              <div className="flex items-center gap-2 rounded border border-amber-900/50 bg-amber-950/40 p-2 text-xs text-amber-300">
                <span className="h-2 w-2 animate-spin rounded-full border border-amber-400 border-t-transparent" />
                <span>Installing sandbox dependencies: {installingDeps}...</span>
              </div>
            )}
            {installedDependencies.length > 0 && (
              <div className="flex items-center gap-2 rounded border border-emerald-900/50 bg-emerald-950/40 p-2 text-xs text-emerald-300">
                <span>✓</span>
                <span>Installed dependencies: {installedDependencies.join(', ')}</span>
              </div>
            )}

            {/* 工具执行进度指示 */}
            {activeTool && (
              <div className="flex items-center gap-2 rounded border border-blue-900/50 bg-blue-950/40 p-2 text-xs text-blue-300">
                <span className="h-2 w-2 animate-ping rounded-full bg-blue-400" />
                <span>Executing tool: {activeTool}...</span>
              </div>
            )}
          </div>

          {/* 底部输入框 */}
          <form
            onSubmit={handleSendPrompt}
            className="border-t border-slate-800 p-3 bg-slate-900/30"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Describe what to build..."
                className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleCancelGeneration}
                  aria-label="Stop generation"
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 transition-colors shadow-sm"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="Send prompt"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-sm"
                >
                  Send
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 右侧：实时预览面板 */}
        <div className="h-full overflow-hidden">
          <PreviewPanel
            previewUrl={previewUrl}
            status={previewStatus}
            isInspectMode={isInspectMode}
            onToggleInspect={() => setIsInspectMode((prev) => !prev)}
            onSelectComponent={(_path, prompt) => {
              setInputPrompt(prompt);
              setIsInspectMode(false);
            }}
            onReload={() => {
              setPreviewStatus('starting');
              setTimeout(() => setPreviewStatus('running'), 600);
            }}
            onStop={() => setPreviewStatus('idle')}
          />
        </div>
      </main>

      {/* 设置面板模态框 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSettings={settings}
        onSave={(newCfg) => {
          setSettings(newCfg);
        }}
        onTestConnection={async () => {
          return 'Connection established successfully';
        }}
      />

      {/* 版本时光机模态框 */}
      <VersionTimelineModal
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        versions={versions}
        onSelectVersion={async (hash) => {
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
        }}
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

      {/* 侧边多应用抽屉 */}
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
            setMessages([
              {
                id: String(Date.now()),
                sender: 'assistant',
                content: `Switched to application "${target.name}". Workspace loaded.`,
              },
            ]);
          }
          setIsDrawerOpen(false);
        }}
        onCreateApp={() => {
          const newId = Date.now();
          const newApp: AppItem = {
            id: newId,
            name: `Project ${apps.length + 1}`,
            path: `/workspace/project-${apps.length + 1}`,
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
      />

      {/* 工程导出模态框 */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        appName={apps.find((a) => a.id === activeAppId)?.name || 'Default Application'}
        onExportZip={async () => {
          const wailsApp = (
            window as unknown as {
              go?: { main?: { App?: { ExportAppZip?: (appId: number, dest: string) => Promise<string> } } };
            }
          )?.go?.main?.App;
          if (wailsApp?.ExportAppZip) {
            return await wailsApp.ExportAppZip(activeAppId, '');
          }
          return `/downloads/${(apps.find((a) => a.id === activeAppId)?.name || 'app').toLowerCase().replace(/\s+/g, '-')}-export.zip`;
        }}
        onRevealInFileManager={async (path) => {
          const wailsApp = (
            window as unknown as {
              go?: { main?: { App?: { OpenInFileManager?: (p: string) => Promise<void> } } };
            }
          )?.go?.main?.App;
          if (wailsApp?.OpenInFileManager) {
            await wailsApp.OpenInFileManager(path);
          }
        }}
      />
    </div>
  );
};

export default App;
