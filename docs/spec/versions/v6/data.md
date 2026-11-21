# 数据契约（Data Contracts）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/data.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：就绪（Ready for Review）  
> 选型基准：TypeScript Interfaces + JSON Schema  

---

## 1. 主题令牌契约 (Theme Data Contract)

```typescript
export type ThemeMode = 'light' | 'dark';

export interface MacOSThemeColors {
  /** 窗口顶层底色 */
  canvasBg: string;
  /** 表面/面板底色 */
  surfaceBg: string;
  /** 头部工具栏底色（半透明毛玻璃） */
  headerBg: string;
  /** 边框与分隔线颜色 */
  borderColor: string;
  /** 主要正文文本颜色 */
  textPrimary: string;
  /** 次要辅助文本颜色 */
  textSecondary: string;
  /** 弱化占位符文本颜色 */
  textMuted: string;
  /** 系统主强调色（Apple Accent） */
  accent: string;
  /** 鼠标悬停高亮底色 */
  hoverBg: string;
  /** 用户消息气泡背景色 */
  userBubbleBg: string;
  /** 用户消息气泡文字颜色 */
  userBubbleText: string;
  /** 助手消息卡片背景色 */
  assistantCardBg: string;
}
```

---

## 2. 国际化词条契约 (i18n Data Contract)

```typescript
export type Locale = 'en' | 'zh';

export interface I18nDictionary {
  common: {
    appName: string;
    proBadge: string;
    manageApp: string;
    loading: string;
    confirm: string;
    cancel: string;
  };
  dock: {
    toggle: string;
    home: string;
    settings: string;
    docs: string;
    templates: string;
    components: string;
    help: string;
  };
  chat: {
    newChat: string;
    historyVersion: string;
    placeholder: string;
    send: string;
    modeBuild: string;
    modePlan: string;
    modelAuto: string;
    writing: string;
    completed: string;
  };
  workspace: {
    preview: string;
    code: string;
    publish: string;
    startingApp: string;
    systemMessages: string;
    reload: string;
  };
  theme: {
    light: string;
    dark: string;
    toggle: string;
  };
  language: {
    en: string;
    zh: string;
  };
}
```

---

## 3. 文件修改进度卡片契约 (File Change Action Contract)

```typescript
export type FileActionStatus = 'writing' | 'completed' | 'idle';

export interface FileActionItem {
  id: string;
  filename: string;
  path: string;
  status: FileActionStatus;
}
```
