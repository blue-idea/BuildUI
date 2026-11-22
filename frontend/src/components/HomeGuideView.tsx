import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Globe,
  Monitor,
  Smartphone,
  Plus,
  Palette,
  Sparkles,
  ArrowUp,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

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
  onStartBuilding: (prompt: string, options: GuideCustomizationOptions) => void;
  onBrowseTemplates?: () => void;
  initialCategory?: AppCategory;
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
    desc: 'Cyberpunk midnight with high-energy cyan and magenta glow',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0">
        <span className="w-1/2 h-full bg-[#06b6d4]" />
        <span className="w-1/2 h-full bg-[#f43f5e]" />
      </span>
    ),
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    desc: 'Crisp typography, generous whitespace, and subtle micro-borders',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-slate-300 dark:border-zinc-600 shrink-0 bg-slate-200 dark:bg-zinc-700">
        <span className="w-1/2 h-full bg-white dark:bg-zinc-900" />
      </span>
    ),
  },
  {
    id: 'bento-grid',
    name: 'Bento Grid',
    desc: 'Modular card hierarchy with clean pill badges and subtle borders',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0">
        <span className="w-1/2 h-full bg-[#10b981]" />
        <span className="w-1/2 h-full bg-[#0f766e]" />
      </span>
    ),
  },
];

// 参照物预设
const REFERENCE_PRESETS = [
  { id: 'linear', name: 'Linear', tag: 'Keyboard-first dark agile workspace' },
  { id: 'stripe', name: 'Stripe', tag: 'Fintech metrics, clean tables & receipts' },
  { id: 'notion', name: 'Notion', tag: 'Collapsible modular canvas & docs' },
  { id: 'apple', name: 'Apple HIG', tag: 'Grouped rounded cards & switches' },
  { id: 'vercel', name: 'Vercel', tag: 'Dark telemetry charts & activity feeds' },
  { id: 'shopify', name: 'Shopify', tag: 'E-commerce operational orders & summary' },
];

export const HomeGuideView: React.FC<HomeGuideViewProps> = ({
  onStartBuilding,
  onBrowseTemplates,
  initialCategory = 'web',
}) => {
  const { t } = useI18n();

  // 1. 选项卡：App、Desktop、Web
  const [category, setCategory] = useState<AppCategory>(initialCategory);

  // 2. 核心提示词输入
  const [userInput, setUserInput] = useState('');

  // 3. 风格选择（参考 Stitch 预设风格）
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [isStylePopoverOpen, setIsStylePopoverOpen] = useState(false);

  // 4. 参照物选择
  const [selectedReference, setSelectedReference] = useState('');
  const [customReference, setCustomReference] = useState('');
  const [isRefPopoverOpen, setIsRefPopoverOpen] = useState(false);

  // 5. 模版选择
  const [selectedTemplate, setSelectedTemplate] = useState('blank');

  // 6. 模式（Balanced / Creative / Precise）
  const [generationMode, setGenerationMode] = useState<'balanced' | 'creative' | 'precise'>('balanced');
  const [isModePopoverOpen, setIsModePopoverOpen] = useState(false);

  const stylePopoverRef = useRef<HTMLDivElement>(null);
  const refPopoverRef = useRef<HTMLDivElement>(null);
  const modePopoverRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭弹层
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (stylePopoverRef.current && !stylePopoverRef.current.contains(target)) {
        setIsStylePopoverOpen(false);
      }
      if (refPopoverRef.current && !refPopoverRef.current.contains(target)) {
        setIsRefPopoverOpen(false);
      }
      if (modePopoverRef.current && !modePopoverRef.current.contains(target)) {
        setIsModePopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 风格预设与参照物预设
  const stylePresets = STYLE_PRESETS;
  const referencePresets = REFERENCE_PRESETS;

  // 组合生成的构建提示词（精简且无组件库负担）
  const assembledPrompt = useMemo(() => {
    const platformLabel =
      category === 'app'
        ? 'Native Mobile App (iOS / Android touch viewport)'
        : category === 'desktop'
        ? 'Desktop Client Application (Windowed macOS / Windows UI)'
        : 'Web Application (Responsive Browser)';

    const styleName = STYLE_PRESETS.find((s) => s.id === selectedStyle)?.name ?? 'Auto-adaptive';
    const refText = [selectedReference, customReference.trim()].filter(Boolean).join(' + ');

    const coreGoal =
      userInput.trim() ||
      `Design an elegant, user-friendly ${category.toUpperCase()} application with modern layouts and polished interactions.`;

    return `Create a high-quality ${platformLabel}:
• Core Goal: ${coreGoal}
• Platform: ${platformLabel}
• Design System & Palette: ${styleName}
• UI Reference & Counterpart: ${refText || 'Modern clean benchmark'}
• Base Starter Template: ${selectedTemplate === 'blank' ? 'Blank Canvas' : selectedTemplate}
• Implementation Requirements:
  - Clean modular React 19 + Tailwind CSS
  - Responsive design adapting dynamically to both Light and Dark themes
  - Accessible controls, polished micro-interactions, and crisp typography`;
  }, [category, userInput, selectedStyle, selectedReference, customReference, selectedTemplate]);

  // 根据当前类别切换默认 placeholder
  const inputPlaceholder = useMemo(() => {
    if (category === 'app') return t('homeGuide.placeholderApp');
    if (category === 'desktop') return t('homeGuide.placeholderDesktop');
    return t('homeGuide.placeholderWeb');
  }, [category, t]);

  const handleStart = () => {
    onStartBuilding(assembledPrompt, {
      category,
      userInput,
      style: selectedStyle,
      reference: selectedReference,
      customReference,
      template: selectedTemplate,
    });
  };

  const handleBlankProject = () => {
    setSelectedTemplate('blank');
    const blankPrompt = `Create a clean Blank Canvas ${category.toUpperCase()} application with minimal starting layout and light/dark theme support.`;
    onStartBuilding(blankPrompt, {
      category,
      userInput: '',
      style: 'modern-minimalist',
      reference: '',
      customReference: '',
      template: 'blank',
    });
  };

  const activeStyleObj = stylePresets.find((s) => s.id === selectedStyle);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col justify-center px-6 py-12 transition-colors select-none">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* 顶部标题与轻量操作按钮栏 */}
        <div className="flex items-center justify-between w-full px-2">
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-zinc-100">
            {t('homeGuide.welcome')}
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRefPopoverOpen(true)}
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
            {/* 左侧：+ 参照物图标 与 选项卡（App / Desktop / Web） */}
            <div className="flex items-center gap-2 relative">
              {/* + 按钮：添加参照物对标 */}
              <button
                type="button"
                data-testid="guide-ref-btn"
                title={t('homeGuide.referenceTitle')}
                onClick={() => setIsRefPopoverOpen((prev) => !prev)}
                className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-300/40 dark:hover:bg-zinc-800 transition-colors ${
                  selectedReference || customReference ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* 参照物 Popover 浮层 */}
              {isRefPopoverOpen && (
                <div
                  ref={refPopoverRef}
                  className="absolute bottom-11 left-0 z-30 w-72 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      {t('homeGuide.referenceTitle')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRefPopoverOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    data-testid="guide-custom-ref-input"
                    value={customReference}
                    onChange={(e) => setCustomReference(e.target.value)}
                    placeholder={t('homeGuide.customRefPlaceholder')}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  />

                  <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
                    {referencePresets.map((r) => {
                      const isSelected = selectedReference === r.name;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          data-testid={`ref-preset-${r.id}`}
                          onClick={() => {
                            setSelectedReference(isSelected ? '' : r.name);
                            setIsRefPopoverOpen(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium'
                              : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <span className="font-medium">{r.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[130px]">
                            {r.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

              {/* 参照物已选小标签 */}
              {(selectedReference || customReference) && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">{selectedReference || customReference}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReference('');
                      setCustomReference('');
                    }}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            {/* 右侧：🎨 调色板设计系统图标 + 模式下拉 + 提交按钮 */}
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

              {/* 模式选择按钮（参考图中的 Balanced ▾） */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModePopoverOpen((prev) => !prev)}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-slate-300/40 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300/60 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-slate-500" />
                  <span className="capitalize">{generationMode}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isModePopoverOpen && (
                  <div
                    ref={modePopoverRef}
                    className="absolute bottom-10 right-0 z-30 w-36 p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col gap-0.5 text-xs"
                  >
                    {(['balanced', 'creative', 'precise'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setGenerationMode(m);
                          setIsModePopoverOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-left capitalize transition-colors ${
                          generationMode === m
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium'
                            : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 提交按钮：圆形 ArrowUp，点击进入构建区开始生成 */}
              <button
                type="button"
                data-testid="guide-submit-btn"
                title={t('homeGuide.enterBuilder')}
                onClick={handleStart}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-900 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
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
