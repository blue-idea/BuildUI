# 数据模型与主题契约（Data & Theme Contract）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/data.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：就绪（Ready for Review）  
> 选型基准：TypeScript + Tailwind CSS + LocalStorage  

---

## 1. macOS 视觉设计令牌模型 (macOS Design Tokens)

### 1.1 模式定义与颜色契约

```typescript
export type ThemeMode = 'light' | 'dark';

export interface MacOSThemeColors {
  // Window and canvas background
  canvasBg: string;
  // Elevated container / card background (frosted glass)
  surfaceBg: string;
  surfaceBgHover: string;
  // Header / Toolbar background
  headerBg: string;
  // Borders and dividers
  borderColor: string;
  borderSubtle: string;
  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accents and states
  accent: string;
  accentHover: string;
  accentForeground: string;
  // Traffic lights
  trafficLightClose: string;
  trafficLightMinimize: string;
  trafficLightZoom: string;
}
```

### 1.2 主题数值映射表

| 语义 Token | macOS 浅色模式 (`light`) | macOS 深色模式 (`dark`) |
|:---|:---|:---|
| `canvasBg` | `#f5f5f7` (macOS 系统浅灰) | `#1c1c1e` (macOS Space Gray) |
| `surfaceBg` | `rgba(255, 255, 255, 0.82)` | `rgba(44, 44, 46, 0.8)` |
| `surfaceBgHover` | `rgba(240, 240, 243, 0.95)` | `rgba(58, 58, 60, 0.9)` |
| `headerBg` | `rgba(255, 255, 255, 0.75)` | `rgba(28, 28, 30, 0.75)` |
| `borderColor` | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.12)` |
| `borderSubtle` | `rgba(0, 0, 0, 0.04)` | `rgba(255, 255, 255, 0.06)` |
| `textPrimary` | `#1d1d1f` (SF Pro Black) | `#f5f5f7` (SF Pro White) |
| `textSecondary`| `#424245` (SF Pro Dark Gray) | `#d1d1d6` (SF Pro Gray) |
| `textMuted` | `#86868b` (SF Pro Light Gray) | `#8e8e93` (SF Pro Mid Gray) |
| `accent` | `#0071e3` (Apple Royal Blue) | `#0a84ff` (Apple Neon Blue) |
| `accentHover` | `#0077ed` | `#409cff` |
| `accentForeground` | `#ffffff` | `#ffffff` |
| `trafficLights` | Close `#ff5f56`, Min `#ffbd2e`, Max `#27c93f` | Close `#ff5f56`, Min `#ffbd2e`, Max `#27c93f` |

---

## 2. 国际化字典数据结构 (i18n Dictionary Schema)

### 2.1 语言类型与契约

```typescript
export type Locale = 'en' | 'zh';

export interface I18nDictionary {
  app: {
    title: string;
    tagline: string;
    version: string;
  };
  trafficLights: {
    close: string;
    minimize: string;
    zoom: string;
  };
  header: {
    apps: string;
    templates: string;
    themeMode: string;
    themeLight: string;
    themeDark: string;
    language: string;
    export: string;
    settings: string;
    commandHint: string;
  };
  drawer: {
    title: string;
    currentApp: string;
    allApps: string;
    createApp: string;
    newAppName: string;
    newAppPath: string;
    createButton: string;
    cancelButton: string;
    noApps: string;
  };
  templates: {
    title: string;
    subtitle: string;
    all: string;
    createFromTemplate: string;
    useTemplate: string;
    cancel: string;
  };
  command: {
    placeholder: string;
    noResults: string;
    navTitle: string;
    themeTitle: string;
    actionTitle: string;
    toggleTheme: string;
    switchLangEn: string;
    switchLangZh: string;
    openApps: string;
    openTemplates: string;
    exportProject: string;
  };
  chat: {
    title: string;
    placeholder: string;
    send: string;
    statusGenerating: string;
    statusReady: string;
  };
  preview: {
    title: string;
    loading: string;
    refresh: string;
    openExternal: string;
    codeTab: string;
    diffTab: string;
    previewTab: string;
  };
  common: {
    close: string;
    cancel: string;
    confirm: string;
    success: string;
    error: string;
  };
}
```

---

## 3. 持久化存储契约 (Local Storage)

| 键名 | 类型 | 可选值 | 默认值 | 描述 |
|:---|:---|:---|:---|:---|
| `blot_theme_mode` | `string` | `"light"` \| `"dark"` | `"dark"` | 用户选择的 macOS 视觉主题模式 |
| `blot_locale` | `string` | `"en"` \| `"zh"` | `"zh"` | 用户选择的应用主界面显示语言 |
