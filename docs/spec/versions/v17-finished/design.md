# 技术方案设计（Design）· Blot-UI v17

> 文件路径：`docs/spec/versions/v17/design.md`  
> 规范版本：v17 · 日期：2026-11-23  
> 关联需求：[docs/spec/versions/v17/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v17/requirements.md)

---

## 1. 架构与设计原则

Blot-UI 采用 **macOS 极简美学设计系统**，支持系统级的 **Light Mode（浅色模式）** 与 **Dark Mode（深色模式）**。通过在 `document.documentElement`（根元素）挂载或移除 `.dark` 类，结合 Tailwind CSS 的 `dark:*` 变体与 macOS CSS 变量（`--macos-accent`, `--macos-canvas-bg` 等），实现全界面组件的响应式主题自适应。

### 1.1 核心色彩与样式对照表

| UI 语义 | 浅色模式 (Light) | 深色模式 (Dark) | 用途 |
|---|---|---|---|
| **Modal 容器背景** | `bg-white` | `dark:bg-zinc-900` | 浮层模态框主面板 |
| **Modal 容器边框** | `border-slate-200` | `dark:border-zinc-800` | 模态框外轮廓 |
| **标题文本** | `text-slate-900` | `dark:text-zinc-100` | 模态框 Header 标题 |
| **正文文本** | `text-slate-700` | `dark:text-zinc-300` | 核心描述、列表主文本 |
| **次要辅助文本** | `text-slate-500` | `dark:text-zinc-400` | 提示说明、元数据、时间戳 |
| **子区域/列表底色** | `bg-slate-50` / `bg-slate-100/60` | `dark:bg-zinc-950/60` | 分栏、时间线侧边栏、卡片背景 |
| **次级按钮** | `border-slate-200 bg-white text-slate-700 hover:bg-slate-100` | `dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700` | 辅助操作、取消按钮 |
| **选中项高亮** | `bg-blue-50 border-blue-500 text-slate-900` | `dark:bg-blue-950/40 dark:border-blue-500/80 dark:text-zinc-50` | 时间线选中、列表选中 |
| **主按钮 (Accent)** | `bg-blue-600 hover:bg-blue-500 text-white` | `bg-blue-600 hover:bg-blue-500 text-white` | 导出、确认等关键操作 |

---

## 2. 组件级改造方案

### 2.1 导出模态框 (`ExportModal.tsx`)
1. **容器**: 替换 `bg-slate-900 border-slate-700 text-slate-100` 为 `bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100`。
2. **头部**: `border-b border-slate-100 dark:border-zinc-800`；指示点使用主题色微光；关闭按钮提供 `text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200`。
3. **内容卡片**: `bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800`。
4. **底部按钮**: 辅助操作按钮采用自适应次级按钮样式，取消按钮自适应灰阶。

### 2.2 版本时光机模态框与代码差异 (`VersionTimelineModal.tsx` & `DiffViewer.tsx`)
1. **外层分栏**:
   - 左侧时间线列表采用 `bg-slate-50/70 dark:bg-zinc-950/60 border-r border-slate-200 dark:border-zinc-800`。
   - 右侧差异容器采用 `bg-white dark:bg-zinc-900/40`。
2. **快照条目**:
   - 普通态：`border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60`。
   - 选中态：`border-blue-500 dark:border-blue-500/80 bg-blue-50/80 dark:bg-blue-950/30 text-slate-900 dark:text-zinc-50`。
3. **DiffViewer**:
   - 文件条目背景：`bg-slate-50 dark:bg-zinc-950/80 border-slate-200 dark:border-zinc-800`。
   - 文件标头：`bg-slate-100 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300`。
   - 差异代码块：双模自适应增删行对比度（新增行 `bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300`，删除行 `bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300`）。

### 2.3 模版中心、命令面板与主题选择器 (`TemplateModal.tsx`, `CommandPalette.tsx`, `ThemeSelector.tsx`)
1. 统一升级为 `bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100`。
2. 输入框、列表项 hover 效果与高亮态同步支持双模。
