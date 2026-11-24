import { ExtractedStyle, ColorPalette, StyleAppType } from '../types/style';
import type { ThemePreset } from '../components/ThemeSelector';

export interface PresetDefinition {
  name: string;
  aliases: string[];
  palette: ColorPalette;
  tags: string[];
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  typography: string;
}

/**
 * 标杆级真实网站与知名设计系统特征知识库
 */
export const BENCHMARK_PRESETS: Record<string, PresetDefinition> = {
  linear: {
    name: 'Linear',
    aliases: ['linear', 'linear.app', 'https://linear.app', 'http://linear.app'],
    palette: {
      primary: '#5e6ad2',
      accent: '#8792e8',
      background: '#08090a',
      surface: '#121316',
      text: '#f7f8f8',
      textMuted: '#8a8f98',
      border: '#222326',
    },
    tags: ['Dark Mode', 'Minimal', 'Obsidian', 'Developer', 'Frosted'],
    borderRadius: 'xl',
    typography: 'Inter, system-ui, -apple-system, sans-serif',
  },
  stripe: {
    name: 'Stripe',
    aliases: ['stripe', 'stripe.com', 'https://stripe.com', 'http://stripe.com'],
    palette: {
      primary: '#635bff',
      accent: '#00d4aa',
      background: '#ffffff',
      surface: '#f6f9fc',
      text: '#0a2540',
      textMuted: '#425466',
      border: '#e6ebf1',
    },
    tags: ['Fintech', 'Clean', 'Modern SaaS', 'High Contrast'],
    borderRadius: '2xl',
    typography: 'Sohne, system-ui, -apple-system, sans-serif',
  },
  supabase: {
    name: 'Supabase',
    aliases: ['supabase', 'supabase.com', 'https://supabase.com', 'http://supabase.com'],
    palette: {
      primary: '#3ecf8e',
      accent: '#24b47e',
      background: '#1c1c1c',
      surface: '#242424',
      text: '#ededed',
      textMuted: '#898989',
      border: '#343434',
    },
    tags: ['Developer Dark', 'Emerald Neon', 'Database', 'Precision'],
    borderRadius: 'lg',
    typography: 'Circular, system-ui, -apple-system, sans-serif',
  },
  vercel: {
    name: 'Vercel',
    aliases: ['vercel', 'vercel.com', 'https://vercel.com', 'http://vercel.com'],
    palette: {
      primary: '#000000',
      accent: '#0070f3',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#171717',
      textMuted: '#666666',
      border: '#eaeaea',
    },
    tags: ['Geek Monochrome', 'Precision', 'High Density', 'Triangle'],
    borderRadius: 'md',
    typography: 'Geist, Geist Mono, system-ui, sans-serif',
  },
  airbnb: {
    name: 'Airbnb',
    aliases: ['airbnb', 'airbnb.com', 'https://airbnb.com', 'http://airbnb.com'],
    palette: {
      primary: '#ff385c',
      accent: '#e00b41',
      background: '#ffffff',
      surface: '#f7f7f7',
      text: '#222222',
      textMuted: '#717171',
      border: '#dddddd',
    },
    tags: ['Lifestyle', 'Warm Consumer', 'Friendly', 'Soft Elevation'],
    borderRadius: '2xl',
    typography: 'Circular, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  apple: {
    name: 'Apple',
    aliases: ['apple', 'apple.com', 'https://apple.com', 'http://apple.com'],
    palette: {
      primary: '#0071e3',
      accent: '#2997ff',
      background: '#f5f5f7',
      surface: '#ffffff',
      text: '#1d1d1f',
      textMuted: '#86868b',
      border: '#d2d2d7',
    },
    tags: ['Human Interface', 'Cupertino', 'Rounded', 'Aesthetic'],
    borderRadius: '2xl',
    typography: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },
  github: {
    name: 'GitHub',
    aliases: ['github', 'github.com', 'https://github.com', 'http://github.com'],
    palette: {
      primary: '#2da44e',
      accent: '#2eaadc',
      background: '#0d1117',
      surface: '#161b22',
      text: '#c9d1d9',
      textMuted: '#8b949e',
      border: '#30363d',
    },
    tags: ['Developer Hub', 'Git Dark', 'Productive', 'Open Source'],
    borderRadius: 'md',
    typography: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  notion: {
    name: 'Notion',
    aliases: ['notion', 'notion.so', 'https://notion.so', 'http://notion.so'],
    palette: {
      primary: '#2eaadc',
      accent: '#0f7b6c',
      background: '#ffffff',
      surface: '#f7f6f3',
      text: '#37352f',
      textMuted: '#787774',
      border: '#e9e9e7',
    },
    tags: ['Warm Monochrome', 'Document', 'Productivity', 'Typography'],
    borderRadius: 'sm',
    typography: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  raycast: {
    name: 'Raycast',
    aliases: ['raycast', 'raycast.com', 'https://raycast.com', 'http://raycast.com'],
    palette: {
      primary: '#ff6363',
      accent: '#ff8f8f',
      background: '#0f0f10',
      surface: '#1c1c1f',
      text: '#ffffff',
      textMuted: '#8b8b93',
      border: '#2c2c30',
    },
    tags: ['Fast Utility', 'Dark Obsidian', 'Keyboard First', 'Vibrant Accent'],
    borderRadius: 'lg',
    typography: 'SF Mono, Menlo, monospace',
  },
};

/**
 * 组装结构化、工业级 AI 设计系统 Prompt
 */
export const buildDesignSystemPrompt = (
  name: string,
  palette: ColorPalette,
  borderRadius: string,
  typography: string,
  tags: string[],
  appType: StyleAppType = 'web'
): string => {
  const accent = palette.accent || palette.primary;
  const textMuted = palette.textMuted || '#64748b';

  const platformDirectives =
    appType === 'app'
      ? [
          `[Platform Architecture Directives: Mobile App]`,
          `- Touch targets: Aim for at least 44×44 pt on iOS and 48×48 dp on Android.`,
          `- Layout: Use one task per screen, with the main action visible at 390×844 and actual device safe-area insets.`,
          `- Navigation: Stack details and use a bottom tab bar for 3–5 stable top-level destinations.`,
        ]
      : appType === 'desktop'
      ? [
          `[Platform Architecture Directives: Desktop Workstation]`,
          `- Structure: 3-column split workstation with collapsible sidebar dock and native titlebar window controls.`,
          `- Surface Polish: Subtle translucent glass (backdrop-blur-md) with 1px hairline divider borders.`,
          `- Density: High information density optimized for mouse precision, keyboard shortcuts (kbd), and modal dialogs.`,
        ]
      : [
          `[Platform Architecture Directives: Web]`,
          `- Viewport: Responsive desktop and tablet grid with flexible container max-widths.`,
          `- Navigation: Sticky top navigation bar with breadcrumbs and persistent workspace switcher.`,
          `- Interactive States: Explicit hover elevation and pointer feedback on interactive elements.`,
        ];

  return [
    `# Design System Specification: ${name}`,
    `[Visual Language & Identity]`,
    `Platform Target: ${appType.toUpperCase()}`,
    `Aesthetic Tags: ${tags.join(', ')}.`,
    `Core Tone: Industrial-grade, high polish UI inspired by ${name} with crisp hierarchy and restrained accents.`,
    ``,
    `[Color Palette Tokens]`,
    `- Primary Brand Accent: ${palette.primary}`,
    `- Secondary Accent: ${accent}`,
    `- Base Background: ${palette.background}`,
    `- Surface / Panel: ${palette.surface}`,
    `- High Contrast Text: ${palette.text}`,
    `- Muted Subtext: ${textMuted}`,
    `- Hairline Divider: ${palette.border}`,
    ``,
    ...platformDirectives,
    ``,
    `[Layout & Component Directives]`,
    `- Corner Radius: Apply 'rounded-${borderRadius}' systematically to cards, modals, chips, and controls.`,
    `- Typography: Headings & Body font-family stack '${typography}'. Tight tracking on titles, generous line-height on paragraphs.`,
    `- Elevation & Surface: Clean flat obsidian surfaces or soft ambient blur (backdrop-blur-md) with subtle hairline borders (border ${palette.border}).`,
    ``,
    `[Tailwind Implementation Directives]`,
    `- Use '${palette.primary}' as the accent highlight for active tabs, badges, and primary action buttons.`,
    `- Background canvas: bg-[${palette.background}], card containers: bg-[${palette.surface}].`,
    `- Text hierarchy: text-[${palette.text}] for primary headings, text-[${textMuted}] for secondary metadata.`,
  ].join('\n');
};

/**
 * 解析并规范化 URL 或名称
 */
const cleanDomainName = (raw: string): string => {
  try {
    const urlStr = raw.startsWith('http') ? raw : `https://${raw}`;
    const url = new URL(urlStr);
    const host = url.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    if (parts.length > 0 && parts[0]) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  } catch {
    // 忽略异常
  }
  return raw;
};

/**
 * 格式化展示标题
 */
const formatTitleFromInput = (input: string): string => {
  if (!input.trim()) return 'Custom Design Style';
  if (input.includes('.') || input.startsWith('http')) {
    const domain = cleanDomainName(input);
    const formatted = domain.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return `${formatted} Inspired`;
  }
  return `${input.trim()} Inspired`;
};

/**
 * 风格提取核心函数：将参照物或图片特征提取为色彩矩阵和工业级设计 Prompt
 */
export const extractStyleFromReference = (
  referenceInput: string,
  hasImageAttachment = false,
  appType: StyleAppType = 'web'
): ExtractedStyle => {
  const rawInput = (referenceInput || '').trim();
  const lowerInput = rawInput.toLowerCase();

  // 1. 尝试匹配标杆知识库
  let matchedPreset: PresetDefinition | null = null;
  for (const preset of Object.values(BENCHMARK_PRESETS)) {
    if (preset.aliases.some((alias) => lowerInput.includes(alias.toLowerCase()))) {
      matchedPreset = preset;
      break;
    }
  }

  let finalName: string;
  let finalPalette: ColorPalette;
  let finalTags: string[];
  let finalRadius: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  let finalTypography: string;

  if (matchedPreset) {
    finalName = `${matchedPreset.name} Inspired`;
    finalPalette = { ...matchedPreset.palette };
    finalTags = [...matchedPreset.tags];
    finalRadius = matchedPreset.borderRadius;
    finalTypography = matchedPreset.typography;
  } else {
    finalName = formatTitleFromInput(rawInput);
    const isDarkKeyword = /dark|night|obsidian|midnight|cyber|neon|black/i.test(lowerInput);
    const isWarmKeyword = /warm|sunset|retro|editorial|coffee|nature/i.test(lowerInput);
    const isFintechKeyword = /finance|fintech|bank|crypto|stripe|wealth/i.test(lowerInput);

    if (isDarkKeyword) {
      finalPalette = {
        primary: lowerInput.includes('neon') ? '#00ffcc' : '#3b82f6',
        accent: '#6366f1',
        background: '#090a0f',
        surface: '#13141c',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        border: '#242736',
      };
      finalTags = ['Dark Mode', 'Obsidian', 'High Contrast', 'Modern Tech'];
      finalRadius = 'xl';
      finalTypography = 'Inter, system-ui, -apple-system, sans-serif';
    } else if (isWarmKeyword) {
      finalPalette = {
        primary: '#ea580c',
        accent: '#f59e0b',
        background: '#fafaf9',
        surface: '#ffffff',
        text: '#1c1917',
        textMuted: '#78716c',
        border: '#e7e5e4',
      };
      finalTags = ['Warm Editorial', 'Crafted', 'Artisanal', 'Lifestyle'];
      finalRadius = 'lg';
      finalTypography = 'ui-serif, Georgia, Cambria, serif';
    } else if (isFintechKeyword) {
      finalPalette = {
        primary: '#2563eb',
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textMuted: '#475569',
        border: '#e2e8f0',
      };
      finalTags = ['Fintech', 'Enterprise SaaS', 'Trustworthy', 'Clean'];
      finalRadius = 'xl';
      finalTypography = 'Inter, system-ui, -apple-system, sans-serif';
    } else {
      const defaultColor = hasImageAttachment ? '#2563eb' : '#3b82f6';
      finalPalette = {
        primary: defaultColor,
        accent: '#60a5fa',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textMuted: '#64748b',
        border: '#e2e8f0',
      };
      finalTags = hasImageAttachment
        ? ['Custom Visual Screenshot', 'Adaptive', 'Contemporary']
        : ['Contemporary SaaS', 'Polished UI', 'Minimal'];
      finalRadius = 'xl';
      finalTypography = 'Inter, system-ui, -apple-system, sans-serif';
    }
  }

  // 注入端形态标签
  const platformTag =
    appType === 'app' ? 'Mobile App' : appType === 'desktop' ? 'Desktop Native' : 'Web SaaS';
  if (!finalTags.includes(platformTag)) {
    finalTags.push(platformTag);
  }

  const generatedPrompt = buildDesignSystemPrompt(
    finalName,
    finalPalette,
    finalRadius,
    finalTypography,
    finalTags,
    appType
  );

  return {
    id: `style-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: finalName,
    appType,
    referenceSource: rawInput || (hasImageAttachment ? 'Uploaded Screenshot' : 'Custom'),
    palette: finalPalette,
    borderRadius: finalRadius,
    typography: finalTypography,
    tags: finalTags,
    stylePrompt: generatedPrompt,
    designPrompt: generatedPrompt,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 获取系统内置的标杆设计系统 ThemePreset 列表
 */
export const getBenchmarkThemePresets = (): ThemePreset[] => {
  return Object.entries(BENCHMARK_PRESETS).map(([key, item]) => {
    const appType: StyleAppType =
      key === 'apple' || key === 'raycast' ? 'desktop' : 'web';
    return {
      id: `benchmark-${key}`,
      name: `${item.name} Inspired`,
      appType,
      description: `Industrial design system inspired by ${item.name}`,
      primary: item.palette.primary,
      background: item.palette.background,
      surface: item.palette.surface,
      text: item.palette.text,
      border: item.palette.border,
      stylePrompt: buildDesignSystemPrompt(
        `${item.name} Inspired`,
        item.palette,
        item.borderRadius,
        item.typography,
        item.tags,
        appType
      ),
      tags: item.tags,
      borderRadius: item.borderRadius,
      typography: item.typography,
    };
  });
};
