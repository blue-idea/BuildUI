import React, { useState } from 'react';
import { BlueprintCard, BlueprintDTO } from './components/BlueprintCard';
import { QuestionnaireCard, QuestionItem } from './components/QuestionnaireCard';
import { PreviewPanel } from './components/PreviewPanel';
import { SettingsModal } from './components/SettingsModal';

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
  const [settings, setSettings] = useState<Record<string, string>>({});
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open settings"
            className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Settings
          </button>
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
    </div>
  );
};

export default App;
