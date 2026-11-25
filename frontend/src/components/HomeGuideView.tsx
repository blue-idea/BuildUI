import React, { useState, useMemo, useRef, useEffect, useId } from 'react';
import {
  Globe,
  Monitor,
  Smartphone,
  Plus,
  Palette,
  ArrowUp,
  Check,
  LayoutTemplate,
} from 'lucide-react';
import {
  BLANK_PROJECT_TEMPLATE,
  isProjectTemplateCompatible,
  LOCAL_PROJECT_TEMPLATES,
  NATIVE_APP_STACK,
  NEXT_APP_STACK,
  NEXT_APP_TEMPLATE,
} from '../config/projectTemplates';
import { useI18n } from '../i18n/I18nContext';
import { pluginBridge } from '../services/wailsBridge';
import type { InstalledPlugin, PluginAutomation } from '../types/plugin';
import { HomePluginPicker } from './HomePluginPicker';
import { ModelSelector } from './ModelSelector';
import type { AttachmentItem } from '../App';
import type { ProjectPlatform } from './AppDrawer';
import type { ThemePreset } from './ThemeSelector';

export type AppCategory = ProjectPlatform;

const presetPopoverClass = 'absolute bottom-11 right-0 z-30 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl dark:border-zinc-800 dark:bg-zinc-900';
const presetRowClass = (selected: boolean) => `flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors ${
  selected
    ? 'bg-blue-50 font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
    : 'text-slate-800 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
}`;

export interface GuideCustomizationOptions {
  category: AppCategory;
  userInput: string;
  style: string;
  reference: string;
  customReference: string;
  template: string;
  pluginAutomation?: PluginAutomation;
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
  styleTemplates?: ThemePreset[];
  activeStyleId?: string;
  onSelectStyleId?: (id: string) => void;
  onOpenStyleCenter?: () => void;
}

export interface StyleOption {
  id: string;
  name: string;
  appType?: AppCategory;
  desc: string;
  swatch: React.ReactNode;
  stylePrompt?: string;
}

// 风格预设列表（精确匹配圆色盘设计系统规范，覆盖 App / Desktop / Web）
const DEFAULT_STYLE_PRESETS: StyleOption[] = [
  // Web 经典风格
  {
    id: 'alexandria',
    name: 'Alexandria',
    appType: 'web',
    desc: 'Classical Mediterranean balance with sand gold and navy',
    stylePrompt:
      'Design System & Visual Language Specification: Alexandria. Balanced Mediterranean classical aesthetic with deep navy blue (#1e40af) and warm golden sand (#facc15). Clean typography with rounded-xl cards.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
        <span className="w-1/2 h-full bg-[#1e40af]" />
        <span className="w-1/2 h-full bg-[#facc15]" />
      </span>
    ),
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    appType: 'web',
    desc: 'Bold primary geometry with sharp red, blue, and black contrast',
    stylePrompt:
      'Design System & Visual Language Specification: Bauhaus. Modernist high-contrast aesthetic with primary geometry, sharp black borders, red (#ef4444) and blue (#3b82f6) accents.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex flex-col border border-black/10 shrink-0 shadow-2xs">
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
    appType: 'web',
    desc: 'Cool pastel blues, frosted lavender, and airy glass gradients',
    stylePrompt:
      'Design System & Visual Language Specification: Glacier. Ethereal cool glass aesthetic with sky blue (#38bdf8), lavender (#c084fc), frosted backdrops, and generous whitespace.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
        <span className="w-1/2 h-full bg-[#38bdf8]" />
        <span className="w-1/2 h-full bg-[#c084fc]" />
      </span>
    ),
  },
  // App (移动端) 经典风格（明亮浅色优质设计语言）
  {
    id: 'ios-clean',
    name: 'iOS Modern Clean',
    appType: 'app',
    desc: 'Apple HIG light canvas, squircle cards, and crisp system blue',
    stylePrompt:
      'Design System & Visual Language Specification: iOS Modern Clean. Pristine iOS light canvas (#f2f2f7) with solid white cards (#ffffff), system blue (#007aff) accents, and continuous rounded-2xl touch targets.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
        <span className="w-1/2 h-full bg-[#007aff]" />
        <span className="w-1/2 h-full bg-[#34c759]" />
      </span>
    ),
  },
  {
    id: 'airbnb-mobile',
    name: 'Airbnb Mobile',
    appType: 'app',
    desc: 'Boutique lifestyle cards, Rausch coral highlights, and modern rounded flow',
    stylePrompt:
      'Design System & Visual Language Specification: Airbnb Mobile. Crisp white background (#ffffff) with elevated neutral cards (#f7f7f7), iconic Rausch coral (#ff385c), and spacious boutique travel aesthetics.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
        <span className="w-1/2 h-full bg-[#ff385c]" />
        <span className="w-1/2 h-full bg-[#008489]" />
      </span>
    ),
  },
  {
    id: 'duolingo-gamified',
    name: 'Duolingo Mobile',
    appType: 'app',
    desc: 'Vibrant playful green and yellow with chunky tactile controls',
    stylePrompt:
      'Design System & Visual Language Specification: Duolingo Mobile. Gamified high-energy UI with feather green (#58cc02) and yellow accents, playful 3D buttons.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
        <span className="w-1/2 h-full bg-[#58cc02]" />
        <span className="w-1/2 h-full bg-[#ffc800]" />
      </span>
    ),
  },
  // Desktop (桌面客户端) 经典风格
  {
    id: 'windows-fluent',
    name: 'Windows Fluent',
    appType: 'desktop',
    desc: 'Mica acrylic frosted glass with high precision window chrome',
    stylePrompt:
      'Design System & Visual Language Specification: Windows Fluent. Subtle Mica acrylic translucent depth (#f3f3f3 / #0067c0), 1px hairline dividers and window titlebar.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
        <span className="w-1/2 h-full bg-[#0067c0]" />
        <span className="w-1/2 h-full bg-[#4cc2ff]" />
      </span>
    ),
  },
  {
    id: 'slack-workstation',
    name: 'Slack Workstation',
    appType: 'desktop',
    desc: 'Classic multi-column desktop workstation with aubergine sidebar',
    stylePrompt:
      'Design System & Visual Language Specification: Slack Workstation. Productivity workstation with aubergine dock (#4a154b), high information density and keyboard shortcuts.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
        <span className="w-1/2 h-full bg-[#4a154b]" />
        <span className="w-1/2 h-full bg-[#1264a3]" />
      </span>
    ),
  },
  {
    id: 'carbon',
    name: 'Carbon Dark',
    appType: 'desktop',
    desc: 'Technical dark slate, graphite monochrome, and emerald accents',
    stylePrompt:
      'Design System & Visual Language Specification: Carbon. High-density developer workstation with slate (#2563eb) and emerald (#15803d) accents on deep dark graphite surfaces.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex flex-col border border-black/10 shrink-0 shadow-2xs">
        <span className="w-full h-1/2 bg-[#2563eb]" />
        <span className="w-full h-1/2 bg-[#15803d]" />
      </span>
    ),
  },
  {
    id: 'neon-tokyo',
    name: 'Neon Tokyo',
    appType: 'web',
    desc: 'Cyberpunk neon gradients with electric cyan and hot magenta',
    stylePrompt:
      'Design System & Visual Language Specification: Neon Tokyo. Cyberpunk futuristic aesthetic with electric cyan (#06b6d4) and hot magenta (#ec4899) glowing accents against pitch-black OLED surfaces.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
        <span className="w-1/2 h-full bg-[#06b6d4]" />
        <span className="w-1/2 h-full bg-[#ec4899]" />
      </span>
    ),
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    appType: 'web',
    desc: 'Quiet monochrome grays with sharp hairline dividers',
    stylePrompt:
      'Design System & Visual Language Specification: Modern Minimalist. Quiet monochrome grays (#f4f4f5 / #71717a) with hairline borders, understated micro-interactions, and spacious layouts.',
    swatch: (
      <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
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
  styleTemplates,
  activeStyleId,
  onSelectStyleId,
  onOpenStyleCenter,
}) => {
  const { t, locale } = useI18n();
  const bridge = pluginBridge();
  const [availablePlugins, setAvailablePlugins] = useState<InstalledPlugin[] | null>(null);
  const [pluginLoadError, setPluginLoadError] = useState(false);
  const [pluginSelection, setPluginSelection] = useState<PluginAutomation>({ enabled: false, pluginIds: [] });

  useEffect(() => {
    if (!bridge) return;
    let active = true;
    // 首页创建新项目，只列出全局插件。项目专属插件仍由原项目管理。
    void bridge.ListPlugins().then((plugins) => {
      if (active) setAvailablePlugins((plugins ?? []).filter((plugin) => plugin.enabled && plugin.appId == null));
    }).catch(() => {
      if (active) setPluginLoadError(true);
    });
    return () => { active = false; };
  }, [bridge]);

  // 1. 选项卡：App、Desktop、Web
  const [category, setCategory] = useState<AppCategory>(initialCategory);

  // 2. 核心提示词输入
  const [userInput, setUserInput] = useState('');

  // 3. 风格选择（优先从风格页模版列表获取，支持受控与非受控）
  const [internalSelectedStyle, setInternalSelectedStyle] = useState('auto');
  const selectedStyle = activeStyleId ?? internalSelectedStyle;
  const [activePresetPopover, setActivePresetPopover] = useState<'style' | 'template' | null>(null);
  const [popoverStyleFilter, setPopoverStyleFilter] = useState<'all' | AppCategory>('all');

  const handleSelectStyle = (id: string) => {
    setInternalSelectedStyle(id);
    onSelectStyleId?.(id);
  };

  // null 表示关闭定制，空字符串表示已开启但尚未选择模板。
  const [customTemplateId, setCustomTemplateId] = useState<string | null>(null);
  const customTemplateEnabled = customTemplateId !== null;
  const templateOptions = LOCAL_PROJECT_TEMPLATES.filter((template) => isProjectTemplateCompatible(template, category));
  const selectedTemplate = templateOptions.find((template) => template.id === customTemplateId);
  const canStart = !customTemplateEnabled || !!selectedTemplate;

  const handleCategoryChange = (platform: AppCategory) => {
    setCategory(platform);
    if (selectedTemplate && !isProjectTemplateCompatible(selectedTemplate, platform)) {
      setCustomTemplateId('');
    }
  };

  // 5. 附件上传列表与引用
  const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stylePopoverRef = useRef<HTMLDivElement>(null);
  const templatePopoverRef = useRef<HTMLDivElement>(null);
  const templatePopoverId = useId();
  const stylePopoverId = useId();

  // 两个预设菜单共用关闭逻辑，Esc 将焦点还给打开菜单的按钮。
  useEffect(() => {
    if (!activePresetPopover) return;
    const popover = activePresetPopover === 'template' ? templatePopoverRef.current : stylePopoverRef.current;
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !popover?.contains(event.target)) setActivePresetPopover(null);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      popover?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')?.focus();
      setActivePresetPopover(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activePresetPopover]);

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
    e.target.value = '';
  };

  // 有效风格列表：若外部传入 styleTemplates 则以此为准，否则使用默认预设
  const effectivePresets = useMemo<StyleOption[]>(() => {
    if (styleTemplates && styleTemplates.length > 0) {
      return styleTemplates.map((item) => {
        const itemAppType: AppCategory =
          item.appType || (item.id === 'macos' ? 'desktop' : 'web');
        return {
          id: item.id,
          name: item.name,
          appType: itemAppType,
          desc: item.description || '',
          stylePrompt: item.stylePrompt,
          swatch: (
            <span className="w-5 h-5 rounded-full overflow-hidden inline-flex border border-black/10 shrink-0 shadow-2xs">
              <span
                className="w-1/2 h-full"
                style={{ backgroundColor: item.primary || '#3b82f6' }}
              />
              <span
                className="w-1/2 h-full"
                style={{ backgroundColor: item.background || '#0f172a' }}
              />
            </span>
          ),
        };
      });
    }
    return DEFAULT_STYLE_PRESETS;
  }, [styleTemplates]);

  // 根据 Popover 选中的分类（All / App / Desktop / Web）过滤展示风格
  const filteredStylePresets = useMemo(() => {
    if (popoverStyleFilter === 'all') return effectivePresets;
    return effectivePresets.filter(
      (preset) => (preset.appType || 'web') === popoverStyleFilter
    );
  }, [effectivePresets, popoverStyleFilter]);

  // 提交时使用选中的脚手架和风格组装构建提示词。
  const assemblePrompt = () => {
    const platformLabel =
      category === 'app'
        ? 'Native Mobile App (iOS / Android touch viewport)'
        : category === 'desktop'
        ? 'Desktop Client Application (Windowed macOS / Windows UI)'
        : 'Web Application (Responsive Browser)';

    const activePreset = effectivePresets.find((s) => s.id === selectedStyle);
    const styleName = activePreset?.name ?? 'Auto-adaptive';

    const coreGoal =
      userInput.trim() ||
      `Design an elegant, user-friendly ${category.toUpperCase()} application with modern layouts and polished interactions.`;

    const stack = category === 'app'
      ? NATIVE_APP_STACK
      : selectedTemplate?.id === NEXT_APP_TEMPLATE ? NEXT_APP_STACK : 'React 19 + Tailwind CSS';

    let prompt = `Create a high-quality ${platformLabel}:
• Core Goal: ${coreGoal}
• Platform: ${platformLabel}
• Design System & Palette: ${styleName}
• Base Starter Template: ${selectedTemplate?.name ?? 'Blank Canvas'}
• Implementation Requirements:
  - Clean modular ${stack}
  - ${category === 'app' ? 'Phone-first screens with a visible primary action, native navigation, and device safe areas' : 'Responsive design adapting dynamically to both Light and Dark themes'}
  - Accessible controls, polished micro-interactions, and crisp typography`;

    // 将风格模版中的 stylePrompt 注入到项目生成提示词中
    if (activePreset?.stylePrompt && selectedStyle !== 'auto') {
      prompt += `\n\n[Design System Style Prompt]\n${activePreset.stylePrompt}`;
    }

    return prompt;
  };

  // 根据当前类别切换默认 placeholder
  const inputPlaceholder = useMemo(() => {
    if (category === 'app') return t('homeGuide.placeholderApp');
    if (category === 'desktop') return t('homeGuide.placeholderDesktop');
    return t('homeGuide.placeholderWeb');
  }, [category, t]);

  const startProject = (prompt: string, template: string, input: string) => {
    const pluginAutomation = bridge ? {
      enabled: pluginSelection.enabled,
      pluginIds: pluginSelection.enabled && availablePlugins
        ? pluginSelection.pluginIds.filter((id) => availablePlugins.some((plugin) => plugin.id === id))
        : [],
    } : undefined;
    onStartBuilding(prompt, {
      category,
      userInput: input,
      style: selectedStyle,
      reference: '',
      customReference: '',
      template,
      pluginAutomation,
    }, attachments);
  };

  const handleStart = () => {
    if (!canStart) return;
    startProject(assemblePrompt(), selectedTemplate?.id ?? BLANK_PROJECT_TEMPLATE, userInput);
  };

  const handleBlankProject = () => {
    startProject(`Create a new blank project for ${category.toUpperCase()} application. (Blank Canvas)`, BLANK_PROJECT_TEMPLATE, '');
  };

  const activeStyleObj = effectivePresets.find((s) => s.id === selectedStyle);

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
              onClick={() => {
                if (onOpenStyleCenter) {
                  onOpenStyleCenter();
                } else {
                  setActivePresetPopover('style');
                }
              }}
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

        {/* 核心 AI 输入卡片 */}
        <div className="relative w-full rounded-3xl bg-slate-200/50 dark:bg-zinc-900/90 border border-slate-300/60 dark:border-zinc-800 p-4 sm:p-5 shadow-sm transition-all focus-within:border-blue-400 dark:focus-within:border-blue-500/80 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:shadow-md">
          {/* 已选附件缩略条 */}
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
          {bridge && (
            <HomePluginPicker
              plugins={availablePlugins}
              loadError={pluginLoadError}
              selection={pluginSelection}
              onChange={setPluginSelection}
            />
          )}

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
                  onClick={() => handleCategoryChange('app')}
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
                  onClick={() => handleCategoryChange('desktop')}
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
                  onClick={() => handleCategoryChange('web')}
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

            {/* 右侧：模板、设计系统、模型和提交 */}
            <div className="flex items-center gap-2 relative">
              <div ref={templatePopoverRef} className="relative flex items-center gap-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={customTemplateEnabled}
                  title={t('homeGuide.customTemplate')}
                  aria-label={t('homeGuide.customTemplate')}
                  aria-controls={activePresetPopover === 'template' ? templatePopoverId : undefined}
                  onClick={() => {
                    setCustomTemplateId(customTemplateEnabled ? null : '');
                    setActivePresetPopover(customTemplateEnabled ? null : 'template');
                  }}
                  className="group flex items-center gap-1.5 rounded-full p-2 text-xs font-medium text-slate-600 hover:bg-slate-300/40 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <span aria-hidden="true" className="relative h-4 w-7 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform group-aria-checked:bg-blue-600 group-aria-checked:after:translate-x-3 dark:bg-zinc-700" />
                  {!customTemplateEnabled && <span className="hidden whitespace-nowrap md:block">{t('homeGuide.customTemplate')}</span>}
                </button>
                {customTemplateEnabled && (
                  <button
                    type="button"
                    data-testid="guide-template-btn"
                    title={t('homeGuide.starterTemplate')}
                    aria-label={t('homeGuide.starterTemplate')}
                    aria-expanded={activePresetPopover === 'template'}
                    aria-haspopup="dialog"
                    aria-controls={activePresetPopover === 'template' ? templatePopoverId : undefined}
                    onClick={() => setActivePresetPopover((current) => current === 'template' ? null : 'template')}
                    className="flex items-center gap-1.5 rounded-full bg-slate-300/50 p-2 text-blue-600 hover:bg-slate-300/70 dark:bg-zinc-800 dark:text-blue-400"
                  >
                    <LayoutTemplate aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="hidden max-w-28 truncate text-[11px] font-medium md:block">{selectedTemplate?.name ?? t('homeGuide.starterTemplate')}</span>
                  </button>
                )}
                {customTemplateEnabled && activePresetPopover === 'template' && (
                  <div id={templatePopoverId} role="dialog" aria-label={t('homeGuide.customTemplate')} className={presetPopoverClass}>
                    <p className="px-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">{t('homeGuide.starterTemplate')}</p>
                    <div role="radiogroup" aria-label={t('homeGuide.starterTemplate')} className="flex max-h-56 flex-col gap-1 overflow-y-auto border-t border-slate-100 pt-2 dark:border-zinc-800">
                      {templateOptions.map(({ id, name, description, platform }) => {
                        const isSelected = id === customTemplateId;
                        const PlatformIcon = platform === 'app' ? Smartphone : platform === 'desktop' ? Monitor : Globe;
                        return (
                          <label key={id} className={`${presetRowClass(isSelected)} relative has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-blue-500`}>
                            <input
                              type="radio"
                              name={templatePopoverId}
                              value={id}
                              aria-label={name}
                              checked={isSelected}
                              onChange={() => setCustomTemplateId(id)}
                              className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
                            />
                            <PlatformIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate font-medium">{name}</span>
                              <span className="truncate text-[10px] text-slate-500 dark:text-zinc-400">{description}</span>
                            </span>
                            {isSelected && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* 风格 Popover 容器与触发按钮 */}
              <div ref={stylePopoverRef} className="relative">
                <button
                  type="button"
                  data-testid="guide-style-btn"
                  title={t('homeGuide.stylePresetsTitle')}
                  aria-expanded={activePresetPopover === 'style'}
                  aria-haspopup="dialog"
                  aria-controls={activePresetPopover === 'style' ? stylePopoverId : undefined}
                  onClick={() => setActivePresetPopover((current) => current === 'style' ? null : 'style')}
                  className={`flex items-center gap-1.5 p-2 rounded-full transition-all ${
                    activeStyleObj && selectedStyle !== 'auto'
                      ? 'bg-slate-300/50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-300/40 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  {activeStyleObj && selectedStyle !== 'auto' && (
                    <span
                      data-testid="guide-selected-style-badge"
                      className="hidden md:inline-flex text-[11px] font-medium pr-1 text-slate-700 dark:text-zinc-300"
                    >
                      {activeStyleObj.name}
                    </span>
                  )}
                </button>

                {/* 风格 Popover 弹层 */}
                {activePresetPopover === 'style' && (
                  <div
                    id={stylePopoverId}
                    role="dialog"
                    aria-label={t('homeGuide.stylePresetsTitle')}
                    className={presetPopoverClass}
                  >
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-snug">
                      {t('homeGuide.styleAutoHint')}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenStyleCenter) {
                          onOpenStyleCenter();
                          setActivePresetPopover(null);
                        } else {
                          handleSelectStyle('auto');
                          setActivePresetPopover(null);
                        }
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{t('homeGuide.startWithDesign')}</span>
                    </button>

                    {/* 端形态分类胶囊筛选栏：All | Web | Desktop | App */}
                    <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 select-none text-[11px]">
                      <button
                        type="button"
                        data-testid="guide-style-filter-all"
                        onClick={() => setPopoverStyleFilter('all')}
                        className={`flex-1 text-center py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          popoverStyleFilter === 'all'
                            ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {locale === 'zh' ? '全部' : 'All'}
                      </button>
                      <button
                        type="button"
                        data-testid="guide-style-filter-web"
                        onClick={() => setPopoverStyleFilter('web')}
                        className={`flex-1 text-center py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          popoverStyleFilter === 'web'
                            ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        Web
                      </button>
                      <button
                        type="button"
                        data-testid="guide-style-filter-desktop"
                        onClick={() => setPopoverStyleFilter('desktop')}
                        className={`flex-1 text-center py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          popoverStyleFilter === 'desktop'
                            ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        data-testid="guide-style-filter-app"
                        onClick={() => setPopoverStyleFilter('app')}
                        className={`flex-1 text-center py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          popoverStyleFilter === 'app'
                            ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-2xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        App
                      </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-zinc-800 pt-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between px-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          {t('homeGuide.stylePresetsTitle')}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                          {filteredStylePresets.length}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                        {filteredStylePresets.map((preset) => {
                          const isSelected = selectedStyle === preset.id;
                          const presetAppType = preset.appType || 'web';
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              data-testid={`preset-${preset.id}`}
                              onClick={() => {
                                handleSelectStyle(preset.id);
                                setActivePresetPopover(null);
                              }}
                              className={presetRowClass(isSelected)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {preset.swatch}
                                <div className="flex flex-col text-left truncate">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-medium truncate">{preset.name}</span>
                                    <span
                                      data-testid={`preset-badge-${preset.id}`}
                                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium border shrink-0 ${
                                        presetAppType === 'app'
                                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/50'
                                          : presetAppType === 'desktop'
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50'
                                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50'
                                      }`}
                                    >
                                      {presetAppType === 'app' ? (
                                        <Smartphone className="w-2.5 h-2.5" />
                                      ) : presetAppType === 'desktop' ? (
                                        <Monitor className="w-2.5 h-2.5" />
                                      ) : (
                                        <Globe className="w-2.5 h-2.5" />
                                      )}
                                      <span>
                                        {presetAppType === 'app'
                                          ? 'App'
                                          : presetAppType === 'desktop'
                                          ? 'Desktop'
                                          : 'Web'}
                                      </span>
                                    </span>
                                  </div>
                                  {preset.desc && (
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[190px]">
                                      {preset.desc}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 模型选择下拉组件 */}
              <ModelSelector
                value={selectedModel}
                onChange={onSelectModel}
                settings={settings}
                configuredProvider={settings?.['llm.provider']}
                configuredModel={settings?.['llm.model']}
                onOpenSettings={onOpenSettings}
              />

              {/* 提交按钮：圆形 ArrowUp */}
              <button
                type="button"
                data-testid="guide-submit-btn"
                title={t('homeGuide.enterBuilder')}
                onClick={handleStart}
                disabled={!canStart}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-900 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-sm hover:shadow transition-all active:scale-95 enabled:cursor-pointer disabled:opacity-40 shrink-0"
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
