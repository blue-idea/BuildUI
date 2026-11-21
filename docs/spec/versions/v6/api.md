# 接口契约（API & Context Contract）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/api.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：就绪（Ready for Review）  
> 选型基准：React 19 Context + Custom Hooks  

---

## 1. 主题上下文契约 `ThemeContext`

### 1.1 接口声明

```typescript
import { ThemeMode, MacOSThemeColors } from '../theme/macos';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  tokens: MacOSThemeColors;
}
```

### 1.2 挂载与 DOM 副作用
- 在 HTML 根元素 (`<html class="...">`) 自动添加或移除 `dark` 类；
- 注入 CSS 自定义变量。

---

## 2. 国际化上下文契约 `I18nContext`

### 2.1 接口声明

```typescript
import { Locale, I18nDictionary } from '../i18n/types';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, defaultVal?: string) => string;
  dict: I18nDictionary;
}
```

---

## 3. UI 视图组件契约

### 3.1 `LeftDock.tsx`
```typescript
export interface LeftDockProps {
  activeTab: 'home' | 'settings' | 'docs' | 'templates' | 'components' | 'help';
  onSelectTab: (tab: 'home' | 'settings' | 'docs' | 'templates' | 'components' | 'help') => void;
  onOpenTemplates?: () => void;
  onOpenSettings?: () => void;
}
```

### 3.2 `FileChangeCard.tsx`
```typescript
import { FileActionItem } from '../types/fileAction';

export interface FileChangeCardProps {
  item: FileActionItem;
  onInspect?: (path: string) => void;
}
```

### 3.3 `WorkspacePanel.tsx`
```typescript
export interface WorkspacePanelProps {
  activeView: 'preview' | 'code' | 'publish';
  onViewChange: (view: 'preview' | 'code' | 'publish') => void;
  previewUrl?: string;
  isLoading?: boolean;
}
```
