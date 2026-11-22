import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Globe,
  Monitor,
  Smartphone,
  Plus,
  Palette,
  ArrowUp,
  Check,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { ModelSelector } from './ModelSelector';
import type { AttachmentItem } from '../App';

export type AppCategory = 'app' | 'desktop' | 'web';

export interface GuideCustomizationOptions {
  category: AppCategory;
  userInput: string;
  style: string;
  reference: string;
  customReference: string;
  template: string;
}

export interface HomeGuideViewProps {
  onStartBuilding: (
    prompt: string,
    options: GuideCustomizationOptions,
    attachments?: AttachmentItem[]
  ) => void;
  onBrowseTemplates?: () => void;
  initialCategory?: AppCategory;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
  settings?: Record<string, string>;
  onOpenSettings?: () => void;
  initialAttachments?: AttachmentItem[];
}

// 风格预设列表（精确匹配参考图中的圆色盘设计系统）
const STYLE_PRESETS = [
  {
    id: 'alexandria',
    name: 'Alexandria',
    desc: 'Classical Mediterranean balance with sand gold and navy',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0">
        <span className="w-1/2 h-full bg-[#1e40af]" />
        <span className="w-1/2 h-full bg-[#facc15]" />
      </span>
    ),
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    desc: 'Bold primary geometry with sharp red, blue, and black contrast',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex flex-col border border-black/10 shrink-0">
        <span className="w-full h-1/2 bg-[#18181b]" />
        <span className="w-full h-1/2 flex">
          <span className="w-1/2 h-full bg-[#ef4444]" />
          <span className="w-1/2 h-full bg-[#3b82f6]" />
        </span>
      </span>
    ),
  },
  {
    id: 'glacier',
    name: 'Glacier',
    desc: 'Cool pastel blues, frosted lavender, and airy glass gradients',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0">
        <span className="w-1/2 h-full bg-[#38bdf8]" />
        <span className="w-1/2 h-full bg-[#c084fc]" />
      </span>
    ),
  },
  {
    id: 'carbon',
    name: 'Carbon',
    desc: 'Technical dark slate, graphite monochrome, and emerald accents',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex flex-col border border-black/10 shrink-0">
        <span className="w-full h-1/2 bg-[#2563eb]" />
        <span className="w-full h-1/2 bg-[#15803d]" />
      </span>
    ),
  },
  {
    id: 'neon-tokyo',
    name: 'Neon Tokyo',
    desc: 'Cyberpunk neon gradients with electric cyan and hot magenta',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0">
        <span className="w-1/2 h-full bg-[#06b6d4]" />
        <span className="w-1/2 h-full bg-[#ec4899]" />
      </span>
    ),
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    desc: 'Quiet monochrome grays with sharp hairline dividers',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0">
        <span className="w-1/2 h-full bg-[#f4f4f5]" />
        <span className="w-1/2 h-full bg-[#71717a]" />
      </span>
    ),
  },
];

export const HomeGuideView: React.FC<HomeGuideViewProps> = ({
  onStartBuilding,
  onBrowseTemplates,
  initialCategory = 'web',
  selectedModel = 'auto',
  onSelectModel = () => {},
  settings,
  onOpenSettings,
  initialAttachments = [],
}) => {
  const { t, locale } = useI18n();

  // 1. 选项卡：App、Desktop、Web
  const [category, setCategory] = useState<AppCategory>(initialCategory);

  // 2. 核心提示词输入
  const [userInput, setUserInput] = useState('');

  // 3. 风格选择（参考 Stitch 预设风格）
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [isStylePopoverOpen, setIsStylePopoverOpen] = useState(false);

  // 4. 模版选择
  const [selectedTemplate, setSelectedTemplate] = useState('blank');

  // 5. 附件上传列表与引用
  const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stylePopoverRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭弹层
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (stylePopoverRef.current && !stylePopoverRef.current.contains(target)) {
        setIsStylePopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 复用构建页的附件选择处理
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
            {
              id: `${Date.now()}-${Math.random()}`,
              name: file.name,
              dataUrl,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    // 重置 input 允许重复上传相同文件
    e.target.value = '';
  };

  // 风格预设
  const stylePresets = STYLE_PRESETS;

  // 组合生成的构建提示词（精简且无组件库负担）
  const assembledPrompt = useMemo(() => {
    const platformLabel =
      category === 'app'
        ? 'Native Mobile App (iOS / Android touch viewport)'
        : category === 'desktop'
        ? 'Desktop Client Application (Windowed macOS / Windows UI)'
        : 'Web Application (Responsive Browser)';

    const styleName = STYLE_PRESETS.find((s) => s.id === selectedStyle)?.name ?? 'Auto-adaptive';

    const coreGoal =
      userInput.trim() ||
      `Design an elegant, user-friendly ${category.toUpperCase()} application with modern layouts and polished interactions.`;

    return `Create a high-quality ${platformLabel}:
• Core Goal: ${coreGoal}
• Platform: ${platformLabel}
• Design System & Palette: ${styleName}
• Base Starter Template: ${selectedTemplate === 'blank' ? 'Blank Canvas' : selectedTemplate}
• Implementation Requirements:
  - Clean modular React 19 + Tailwind CSS
  - Responsive design adapting dynamically to both Light and Dark themes
  - Accessible controls, polished micro-interactions, and crisp typography`;
  }, [category, userInput, selectedStyle, selectedTemplate]);

  // 根据当前类别切换默认 placeholder
  const inputPlaceholder = useMemo(() => {
    if (category === 'app') return t('homeGuide.placeholderApp');
    if (category === 'desktop') return t('homeGuide.placeholderDesktop');
    return t('homeGuide.placeholderWeb');
  }, [category, t]);

  const handleStart = () => {
    onStartBuilding(
      assembledPrompt,
      {
        category,
        userInput,
        style: selectedStyle,
        reference: '',
        customReference: '',
        template: selectedTemplate,
      },
      attachments
    );
  };

  const handleBlankProject = () => {
    setSelectedTemplate('blank');
    onStartBuilding(
      `Create a new blank project for ${category.toUpperCase()} application. (Blank Canvas)`,
      {
        category,
        userInput: '',
        style: selectedStyle,
        reference: '',
        customReference: '',
        template: 'blank',
      },
      attachments
    );
  };

  const activeStyleObj = stylePresets.find((s) => s.id === selectedStyle);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col justify-center px-6 py-12 transition-colors select-none">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* 顶部标题区与空白项目快捷入口 */}
        <div className="flex items-center justify-between w-full px-2">
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-zinc-100">
            {locale === 'zh' ? '欢迎使用 Blot-UI..' : 'Welcome to Blot-UI..'}
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStylePopoverOpen(true)}
              className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('homeGuide.startWithDesign')}</span>
            </button>

            <button
              type="button"
              data-testid="guide-blank-project-btn"
              onClick={handleBlankProject}
              className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('homeGuide.blankProject')}</span>
            </button>

            {onBrowseTemplates && (
              <button
                type="button"
                data-testid="guide-templates-btn"
                onClick={onBrowseTemplates}
                className="text-xs font-medium px-3 py-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all"
              >
                {t('homeGuide.browseTemplates')}
              </button>
            )}
          </div>
        </div>

        {/* 核心 AI 输入卡片（精简极简设计，参照 Stitch 设计图） */}
        <div className="relative w-full rounded-3xl bg-slate-200/50 dark:bg-zinc-900/90 border border-slate-300/60 dark:border-zinc-800 p-4 sm:p-5 shadow-sm transition-all focus-within:border-blue-400 dark:focus-within:border-blue-500/80 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:shadow-md">
          {/* 已选附件缩略条（复用构建页样式） */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-2 bg-white/80 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700/80">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-zinc-700 rounded-xl text-[11px] text-slate-700 dark:text-zinc-200 shadow-2xs"
                >
                  <img src={att.dataUrl} alt={att.name} className="w-4 h-4 rounded object-cover" />
                  <span className="truncate max-w-[140px] font-mono">{att.name}</span>
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

          {/* 输入框主体 */}
          <textarea
            data-testid="guide-user-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleStart();
              }
            }}
            placeholder={inputPlaceholder}
            rows={3}
            className="w-full resize-none bg-transparent text-sm sm:text-base text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none leading-relaxed"
          />

          {/* 底部操作栏（图标 + 选项卡） */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-300/40 dark:border-zinc-800/80">
            {/* 左侧：+ 附件上传图标 与 选项卡（App / Desktop / Web） */}
            <div className="flex items-center gap-2 relative">
              {/* 隐藏的文件上传 input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                aria-label="Upload attachment input"
                data-testid="guide-upload-input"
                className="hidden"
                multiple
              />

              {/* + 按钮：附件上传 */}
              <button
                type="button"
                data-testid="guide-upload-btn"
                title={t('chat.addAttachment')}
                aria-label={t('chat.addAttachment')}
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-300/40 dark:hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* 选项卡胶囊控制条：App | Desktop | Web */}
              <div
                role="tablist"
                aria-label="Platform tabs"
                className="flex items-center p-1 bg-slate-300/40 dark:bg-zinc-800/80 rounded-full border border-slate-300/50 dark:border-zinc-700/60"
              >
                <button
                  type="button"
                  role="tab"
                  data-testid="guide-tab-app"
                  aria-selected={category === 'app'}
                  onClick={() => setCategory('app')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    category === 'app'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{t('homeGuide.tabApp')}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  data-testid="guide-tab-desktop"
                  aria-selected={category === 'desktop'}
                  onClick={() => setCategory('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    category === 'desktop'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>{t('homeGuide.tabDesktop')}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  data-testid="guide-tab-web"
                  aria-selected={category === 'web'}
                  onClick={() => setCategory('web')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    category === 'web'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t('homeGuide.tabWeb')}</span>
                </button>
              </div>
            </div>

            {/* 右侧：🎨 调色板设计系统图标 + 模型选择器 + 提交按钮 */}
            <div className="flex items-center gap-2 relative">
              {/* 风格 Popover 触发按钮 */}
              <div className="relative">
                <button
                  type="button"
                  data-testid="guide-style-btn"
                  title={t('homeGuide.stylePresetsTitle')}
                  onClick={() => setIsStylePopoverOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 p-2 rounded-full transition-all ${
                    activeStyleObj
                      ? 'bg-slate-300/50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-300/40 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  {activeStyleObj && (
                    <span
                      data-testid="guide-selected-style-badge"
                      className="hidden md:inline-flex text-[11px] font-medium pr-1 text-slate-700 dark:text-zinc-300"
                    >
                      {activeStyleObj.name}
                    </span>
                  )}
                </button>

                {/* 风格 Popover 弹层（严格参照图片中的 Stitch 浮层样式） */}
                {isStylePopoverOpen && (
                  <div
                    ref={stylePopoverRef}
                    className="absolute bottom-11 right-0 z-30 w-80 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100 select-none text-left"
                  >
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-snug">
                      {t('homeGuide.styleAutoHint')}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStyle('auto');
                        setIsStylePopoverOpen(false);
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{t('homeGuide.startWithDesign')}</span>
                    </button>

                    <div className="border-t border-slate-100 dark:border-zinc-800 pt-2 flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2 mb-1">
                        {t('homeGuide.stylePresetsTitle')}
                      </span>

                      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                        {stylePresets.map((preset) => {
                          const isSelected = selectedStyle === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              data-testid={`preset-${preset.id}`}
                              onClick={() => {
                                setSelectedStyle(preset.id);
                                setIsStylePopoverOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium'
                                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {preset.swatch}
                                <span className="font-medium">{preset.name}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 模型选择下拉组件（复用构建页相关代码，替换 Balanced ▾） */}
              <ModelSelector
                value={selectedModel}
                onChange={onSelectModel}
                settings={settings}
                configuredProvider={settings?.['llm.provider']}
                configuredModel={settings?.['llm.model']}
                onOpenSettings={onOpenSettings}
              />

              {/* 提交按钮：圆形 ArrowUp，点击进入构建区开始生成 */}
              <button
                type="button"
                data-testid="guide-submit-btn"
                title={t('homeGuide.enterBuilder')}
                onClick={handleStart}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-900 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeGuideView;
