/**
 * macOS 主题设计令牌与 CSS 变量生成器
 */

export type ThemeMode = 'light' | 'dark';

export interface MacOSThemeColors {
  canvasBg: string;
  surfaceBg: string;
  headerBg: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  hoverBg: string;
  userBubbleBg: string;
  userBubbleText: string;
  assistantCardBg: string;
}

export const macosTokens: Record<ThemeMode, MacOSThemeColors> = {
  light: {
    canvasBg: '#f5f5f7',
    surfaceBg: '#ffffff',
    headerBg: 'rgba(255, 255, 255, 0.85)',
    borderColor: '#e5e5ea',
    textPrimary: '#1d1d1f',
    textSecondary: '#6e6e73',
    textMuted: '#86868b',
    accent: '#0071e3',
    hoverBg: 'rgba(0, 0, 0, 0.04)',
    userBubbleBg: '#e8e5ff',
    userBubbleText: '#2c246b',
    assistantCardBg: '#ffffff',
  },
  dark: {
    canvasBg: '#121214',
    surfaceBg: '#1c1c1e',
    headerBg: 'rgba(28, 28, 30, 0.85)',
    borderColor: '#2c2c2e',
    textPrimary: '#f5f5f7',
    textSecondary: '#98989d',
    textMuted: '#636366',
    accent: '#0a84ff',
    hoverBg: 'rgba(255, 255, 255, 0.06)',
    userBubbleBg: '#312e81',
    userBubbleText: '#ede9fe',
    assistantCardBg: '#1e1e24',
  },
};

/**
 * 将指定模式的主题变量注入到指定 DOM 元素样式表中
 */
export function applyThemeToElement(el: HTMLElement, mode: ThemeMode) {
  const tokens = macosTokens[mode];
  el.style.setProperty('--macos-canvas-bg', tokens.canvasBg);
  el.style.setProperty('--macos-surface-bg', tokens.surfaceBg);
  el.style.setProperty('--macos-header-bg', tokens.headerBg);
  el.style.setProperty('--macos-border-color', tokens.borderColor);
  el.style.setProperty('--macos-text-primary', tokens.textPrimary);
  el.style.setProperty('--macos-text-secondary', tokens.textSecondary);
  el.style.setProperty('--macos-text-muted', tokens.textMuted);
  el.style.setProperty('--macos-accent', tokens.accent);
  el.style.setProperty('--macos-hover-bg', tokens.hoverBg);
  el.style.setProperty('--macos-user-bubble-bg', tokens.userBubbleBg);
  el.style.setProperty('--macos-user-bubble-text', tokens.userBubbleText);
  el.style.setProperty('--macos-assistant-card-bg', tokens.assistantCardBg);
}
