# 接口与上下文契约（API & Context Contract）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/api.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：就绪（Ready for Review）  
> 选型基准：React 19 Context + Custom Hooks + PostMessage  

---

## 1. 主题上下文契约 `ThemeContext`

### 1.1 接口声明

```typescript
export interface ThemeContextValue {
  /** 当前生效的 macOS 主题模式 ('light' | 'dark') */
  themeMode: 'light' | 'dark';
  /** 设置主题模式 */
  setThemeMode: (mode: 'light' | 'dark') => void;
  /** 切换明暗主题 (light <-> dark) */
  toggleTheme: () => void;
  /** 是否为深色模式 */
  isDark: boolean;
  /** 当前模式下的设计令牌集合 */
  tokens: MacOSThemeColors;
}
```

### 1.2 挂载与 DOM 副作用
- 在 HTML 根元素 (`<html class="...">`) 自动添加或移除 `dark` 类；
- 注入 CSS 自定义变量，例如：
  - `--macos-canvas-bg`
  - `--macos-surface-bg`
  - `--macos-border-color`
  - `--macos-text-primary`
  - `--macos-accent`

---

## 2. 国际化上下文契约 `I18nContext`

### 2.1 接口声明

```typescript
export interface I18nContextValue {
  /** 当前激活的语言 ('en' | 'zh') */
  locale: 'en' | 'zh';
  /** 切换激活语言 */
  setLocale: (locale: 'en' | 'zh') => void;
  /** 字典访问函数: t('header.apps') => '应用抽屉' */
  t: (key: string, defaultVal?: string) => string;
  /** 当前完整的强类型词条对象 */
  dict: I18nDictionary;
}
```

### 2.2 词条查找规则
- 支持扁平路径点分语法（例如 `t('header.apps')`）；
- 若词条不存在，返回 `defaultVal` 或回退至 `en` 词条，确保 UI 永远不会白屏或显示 `undefined`。

---

## 3. 沙箱消息同步契约 (Iframe PostMessage Protocol)

在主应用切换主题模式时，向内部代码沙箱广播同步事件：

```typescript
// 主应用向沙箱发送
interface ThemeSyncEvent {
  type: 'BLOT_THEME_MODE_SYNC';
  mode: 'light' | 'dark';
}

// 广播代码
iframeRef.current?.contentWindow?.postMessage(
  { type: 'BLOT_THEME_MODE_SYNC', mode: currentMode },
  '*'
);
```
