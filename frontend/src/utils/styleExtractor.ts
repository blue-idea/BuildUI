import { ExtractedStyle, ColorPalette } from '../types/style';

/**
 * 知名设计参照物特征预设库
 */
const REFERENCE_PRESETS: Record<string, { palette: ColorPalette; tags: string[]; borderRadius: 'sm' | 'md' | 'lg' | 'xl' | 'full'; typography: string }> = {
  linear: {
    palette: {
      primary: '#5e6ad2',
      background: '#0d0e11',
      surface: '#16181d',
      text: '#f7f8f8',
      border: '#282b33',
    },
    tags: ['Dark Mode', 'Minimal', 'Developer', 'Frosted'],
    borderRadius: 'lg',
    typography: 'Inter, system-ui, sans-serif',
  },
  stripe: {
    palette: {
      primary: '#635bff',
      background: '#ffffff',
      surface: '#f6f9fc',
      text: '#0a2540',
      border: '#e6ebf1',
    },
    tags: ['Fintech', 'Clean', 'Modern SaaS', 'High Contrast'],
    borderRadius: 'md',
    typography: 'Sohne, system-ui, -apple-system, sans-serif',
  },
  apple: {
    palette: {
      primary: '#0071e3',
      background: '#f5f5f7',
      surface: '#ffffff',
      text: '#1d1d1f',
      border: '#d2d2d7',
    },
    tags: ['Aesthetic', 'Rounded', 'Human Interface', 'Clean'],
    borderRadius: 'xl',
    typography: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },
  notion: {
    palette: {
      primary: '#2eaadc',
      background: '#ffffff',
      surface: '#f7f6f3',
      text: '#37352f',
      border: '#e9e9e7',
    },
    tags: ['Document', 'Warm Monochrome', 'Productivity', 'Typography'],
    borderRadius: 'sm',
    typography: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  raycast: {
    palette: {
      primary: '#ff6363',
      background: '#0f0f10',
      surface: '#1c1c1f',
      text: '#ffffff',
      border: '#2c2c30',
    },
    tags: ['Fast Utility', 'Dark Obsidian', 'Keyboard First', 'Vibrant Accent'],
    borderRadius: 'lg',
    typography: 'SF Mono, Menlo, monospace',
  },
  vercel: {
    palette: {
      primary: '#000000',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#171717',
      border: '#eaeaea',
    },
    tags: ['Geek Monochrome', 'Precision', 'High Density', 'Triangle'],
    borderRadius: 'md',
    typography: 'Geist, Geist Mono, system-ui, sans-serif',
  },
};

/**
 * 组装结构化 AI 系统级设计 Prompt
 */
export const buildDesignSystemPrompt = (
  name: string,
  palette: ColorPalette,
  borderRadius: string,
  typography: string,
  tags: string[]
): string => {
  return [
    `# Design System: ${name}`,
    `[Role & Aesthetics]`,
    `Apply a polished, modern design language inspired by ${name}. Visual tags: ${tags.join(', ')}.`,
    ``,
    `[Color Tokens]`,
    `- Primary Accent: ${palette.primary}`,
    `- Canvas Background: ${palette.background}`,
    `- Card & Surface: ${palette.surface}`,
    `- Primary Typography: ${palette.text}`,
    `- Border / Divider: ${palette.border}`,
    ``,
    `[Component Guidelines]`,
    `- Corner Radius: Apply '${borderRadius}' rounded borders across cards, buttons, and inputs.`,
    `- Typography Hierarchy: Use clean font stack (${typography}) with tight letter spacing for headers.`,
    `- Elevation & Polish: Use subtle soft shadows (shadow-xs/shadow-sm) with 1px border stroke for crisp separation.`,
  ].join('\n');
};

/**
 * 风格提取主函数：将参照物或图片特征提取为色彩矩阵和设计 Prompt
 */
export const extractStyleFromReference = (
  referenceInput: string,
  hasImageAttachment = false
): ExtractedStyle => {
  const normalized = (referenceInput || '').trim().toLowerCase();

  // 1. 查找已知预设
  let matched = REFERENCE_PRESETS[normalized];

  if (!matched) {
    // 模糊匹配预设关键字
    for (const [key, value] of Object.entries(REFERENCE_PRESETS)) {
      if (normalized.includes(key)) {
        matched = value;
        break;
      }
    }
  }

  // 2. 若未匹配，基于输入哈希或默认值动态推导色彩方案
  if (!matched) {
    const defaultColor = hasImageAttachment ? '#2563eb' : '#3b82f6';
    matched = {
      palette: {
        primary: defaultColor,
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        border: '#e2e8f0',
      },
      tags: hasImageAttachment
        ? ['Custom Screenshot', 'Visual Extracted', 'Adaptive']
        : ['Custom Style', 'Contemporary', 'Minimal'],
      borderRadius: 'lg',
      typography: 'Inter, system-ui, sans-serif',
    };
  }

  const displayName = referenceInput.trim()
    ? `${referenceInput.trim()} Inspired`
    : hasImageAttachment
      ? 'Extracted Visual Theme'
      : 'Custom Design Style';

  const designPrompt = buildDesignSystemPrompt(
    displayName,
    matched.palette,
    matched.borderRadius,
    matched.typography,
    matched.tags
  );

  return {
    id: `style-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: displayName,
    referenceSource: referenceInput.trim() || (hasImageAttachment ? 'Uploaded Screenshot' : 'Custom'),
    palette: matched.palette,
    borderRadius: matched.borderRadius,
    typography: matched.typography,
    tags: matched.tags,
    designPrompt,
    createdAt: new Date().toISOString(),
  };
};
