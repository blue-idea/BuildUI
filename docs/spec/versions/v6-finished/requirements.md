# 需求规格说明书（Requirements）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/requirements.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：已定稿（Approved）  
> 核心目标：macOS 原生审美三栏式界面重构、中英双语多语言切换、浅色与深色双模主题系统  
> 架构基准：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)  
> 继承规则：`docs/spec/steering/` 与 `docs/spec/versions/v1-finished/constitution.md`

---

## 1. 业务背景与演进目标

在完成基础架构、多模型接入、时光机版本控制、组件定位、动态依赖与模版系统后，Blot-UI 的底层能力已经极为扎实。  
**v6 版本的核心演进目标**是面向现代开发者工作台标准，进行**全面的视觉与交互工业级重构**，严格参照官方前沿产品布局（Dyad / Bolt / macOS Sequoia 窗口美学）：

1. **macOS 原生三栏式桌面布局（macOS Triple-Pane Workbench Layout）**：
   - 顶部窗口栏：包含红黄绿三色交通灯按钮（Traffic Lights）、多项目标签页（Tab Bar）、`Manage app` 快速管理与 `Pro` 状态徽章；
   - 最左侧图标微坞（Left Slim Dock）：包含侧栏收起、主页（Home）、设置（Settings）、文档（Docs）、模版（Templates）、组件（Components）、帮助（Help）垂直快捷图标条；
   - 中间会话与任务列（Chat & Task Panel）：包含 `+ New Chat`、`Version 1` 历史时光机下拉、用户消息气泡、助手响应、**文件写入进度卡片（含图标、文件名、路径、旋转中 Writing... 与绿色对勾 Completed 状态）**，以及底部富输入框（支持 Build/Plan 模式切换、模型选择、附件与发送）；
   - 右侧工作区容器（Preview / Code / Publish Workspace）：顶部支持 `👁 Preview` / `<> Code` / `🌐 Publish` 分段控制器切换、拟真浏览器地址栏（前进后退、外部打开、地址展示、刷新），以及底部可折叠的 `System Messages` 系统日志抽屉。
2. **浅色与深色原生主题（macOS Light & Dark Themes）**：
   - 浅色模式（Light）：以纯净白和灰白磨砂底色为主，高对比度排版，柔和阴影，淡紫/淡蓝激活高亮；
   - 深色模式（Dark）：以深邃暗黑与金属灰黑微质感为主，细腻高光描边，护眼低眩光；
   - 支持一键无刷新平滑切换。
3. **中英双语国际化支持（Bilingual Internationalization）**：
   - 提供全界面一键切换中文（`zh-CN`）与英文（`en-US`）；
   - 包含菜单、按钮、输入框占位符、操作指引、状态通知的无缝多语言切换。

---

## 2. 需求列表与 EARS 验收标准

---

### 需求 v6.REQ-001 · macOS 原生三栏式工作台界面布局

**用户故事：** 作为 追求极致审美与操作流转的开发者，我希望 桌面工作台采用标准的 macOS 风格布局与精致组件层级，以便 在视觉舒适的同时高效掌控生成过程与结果。

#### 验收标准

```yaml
- id: v6.REQ-001-AC-001
  ears: >
    The system shall render a macOS-style window header featuring traffic lights (red, yellow, green),
    active application tabs with close triggers, a 'Manage app' launcher,
    and a right-aligned Pro status indicator.
  test_type: UI / Visual
  expected:
    ui_state: "Header displays traffic lights, tabs, and action badges matching reference layout"
    side_effects: []

- id: v6.REQ-001-AC-002
  ears: >
    The system shall render a leftmost vertical slim icon dock
    containing Navigation icons for Collapse, Home (active pill), Settings, Docs, Templates, Components, and Help.
  test_type: UI / Visual
  expected:
    ui_state: "Left dock contains all 7 icons with proper tooltip labels and active indicator"
    side_effects: []

- id: v6.REQ-001-AC-003
  ears: >
    While code generation or file writing is in progress,
    the chat stream shall render interactive file modification cards
    showing file icon, filename, full path, live status indicator ('Writing...' with spinner or '✔' completed),
    and a chevron link for component inspection.
  test_type: UI / Unit
  expected:
    ui_state: "FileCards render dynamically with status indicators"
    side_effects: []

- id: v6.REQ-001-AC-004
  ears: >
    The right workspace panel shall provide a segmented control allowing instant switching
    between 'Preview', 'Code', and 'Publish' views,
    accompanied by a browser URL navigation bar and a collapsible bottom 'System Messages' console drawer.
  test_type: UI / E2E
  expected:
    ui_state: "Segmented tabs switch active view; browser bar and system drawer expand/collapse"
    side_effects: []
```

---

### 需求 v6.REQ-002 · 浅色与深色双模主题系统（Light & Dark Themes）

**用户故事：** 作为 习惯在不同光照环境下工作的开发者，我希望 能自由切换浅色和深色主题，以便 在白天获得高清晰度，在夜间获得护眼体验。

#### 验收标准

```yaml
- id: v6.REQ-002-AC-001
  ears: >
    The system shall provide both 'light' and 'dark' theme modes adhering to macOS design tokens,
    controlling surface colors, text contrasts, borders, shadows, and interactive state highlights.
  test_type: Unit / Visual
  expected:
    return_value: "theme tokens configured for light and dark"
    throws: null
    side_effects: []

- id: v6.REQ-002-AC-002
  ears: >
    When the user clicks the theme toggle button,
    the UI shall instantly switch between light and dark themes without refreshing the application
    or losing current input and preview state.
  test_type: UI / E2E
  expected:
    ui_state: "Document root classes and CSS variables update to active theme"
    side_effects:
      - "localStorage updated with active theme preference"
```

---

### 需求 v6.REQ-003 · 中英双语多语言国际化系统（i18n）

**用户故事：** 作为 双语用户，我希望 界面支持简体中文与英文无缝切换，以便 根据使用习惯选择最舒适的母语或专业英文术语。

#### 验收标准

```yaml
- id: v6.REQ-003-AC-001
  ears: >
    The system shall maintain dictionary maps for English ('en') and Simplified Chinese ('zh'),
    covering all visible UI strings, button labels, tooltips, placeholder texts, and system logs.
  test_type: Unit
  expected:
    return_value: "Complete translation dictionary for both locales"
    throws: null
    side_effects: []

- id: v6.REQ-003-AC-002
  ears: >
    When the user clicks the language toggle button,
    the entire interface shall immediately re-render with the selected locale's text,
    persisting the user preference to local storage.
  test_type: UI / E2E
  expected:
    ui_state: "All texts updated instantly to English or Chinese"
    side_effects:
      - "Active locale updated in state and storage"
```
