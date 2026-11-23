# 需求规格说明书 · Blot-UI v17

> 文件路径：`docs/spec/versions/v17/requirements.md`  
> 规范版本：v17 · 日期：2026-11-23  
> 状态：草稿 / 待确认  
> 依据规则：[docs/spec/steering/](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/steering/) · [docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 1. 业务背景与问题分析

在 Blot-UI 的现代 macOS 风格工作台中，系统整体已具备明暗主题切换（`ThemeModeToggle`，浅色模式与深色模式）以及主题色设计规范。但目前部分弹窗和次级视图组件（包括导出工程 `ExportModal`、版本时光机历史与代码差异审查 `VersionTimelineModal` / `DiffViewer`、模版中心弹窗 `TemplateModal`、全局命令面板 `CommandPalette` 及主题选择下拉框 `ThemeSelector`）依然使用早期硬编码的 `bg-slate-900` / `border-slate-700` / `text-slate-100` 等深色类名。

这导致当用户处于**浅色模式（Light Mode）**或切换不同主题时，这些弹窗依然呈现死板漆黑的界面，无法响应系统当前的主题明暗模式与主题色（Accent / Primary），造成视觉体验撕裂与不一致。

---

## 2. 需求列表

### 需求 v17.REQ-001：导出弹窗（ExportModal）配色与当前主题对齐

- **需求描述**: 当用户在工作台点击导出或打开 `ExportModal` 时，弹窗必须自动适配当前主题模式（浅色/深色）与主题强调色。
- **验收标准 (AC)**:
  - **`v17.REQ-001-AC-001`**: 在浅色模式下，`ExportModal` 的外层卡片背景呈现明亮白色（`bg-white`），边框为淡灰（`border-slate-200`），文字主色为深灰（`text-slate-800` / `text-slate-900`）；在深色模式下呈现精致深色（`dark:bg-zinc-900` / `dark:border-zinc-800` / `dark:text-zinc-100`）。
  - **`v17.REQ-001-AC-002`**: 弹窗内部应用信息卡片、成功导出反馈卡片、错误反馈条以及各层级按钮（取消、查看文件夹、主导出按钮）均具备双模适配与平滑过渡，主操作按钮风格与主题强调色（Accent / Primary）统一。

### 需求 v17.REQ-002：版本历史与代码差异面板（VersionTimelineModal & DiffViewer）配色与当前主题对齐

- **需求描述**: 当用户打开版本历史时光机模态框（`VersionTimelineModal`）并查看代码差异（`DiffViewer`）时，左右分栏、快照列表项、选中高亮、控制条以及代码行增删高亮均须与当前主题色和明暗模式对齐。
- **验收标准 (AC)**:
  - **`v17.REQ-002-AC-001`**: `VersionTimelineModal` 容器、顶部栏及左侧快照时间线在浅色模式下自适应为明亮底色（如 `bg-white` 与 `bg-slate-50`），在深色模式下自适应为深色底（`dark:bg-zinc-900` 与 `dark:bg-zinc-950/60`），消除硬编码全黑。
  - **`v17.REQ-002-AC-002`**: 快照选中态使用主题强调色柔和微光高亮（如浅色 `bg-blue-50 border-blue-500 text-slate-900`，深色 `dark:bg-blue-950/40 dark:border-blue-500`），提交哈希字符使用主题色。
  - **`v17.REQ-002-AC-003`**: `DiffViewer` 中文件条目与代码变更行（+新增行、-删除行、@@块头）在浅色模式与深色模式下均保持高辨识度与自然对比度，文件容器与状态徽章支持双模适配。

### 需求 v17.REQ-003：模版中心、命令面板与相关交互组件全景主题对齐

- **需求描述**: 同步优化 `TemplateModal`、`CommandPalette` 与 `ThemeSelector` 的配色，确保整个应用的弹窗与下拉交互系统无任何孤立的硬编码深色残留。
- **验收标准 (AC)**:
  - **`v17.REQ-003-AC-001`**: `TemplateModal` 容器、搜索输入框、模版卡片在浅色模式与深色模式下自适应切换。
  - **`v17.REQ-003-AC-002`**: `CommandPalette` 命令面板搜索输入框与动作列表支持明暗双模。
  - **`v17.REQ-003-AC-003`**: `ThemeSelector` 触发按钮与下拉列表支持明暗双模。
