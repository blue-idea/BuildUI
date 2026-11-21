# 实施任务分解（Tasks）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/tasks.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项交付任务）  
> 选型架构：Wails v2 + React 19 + TypeScript + Tailwind CSS  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 任务概览表

| 任务编号 | 任务名称 | 对应需求 | 预计产物 | 测试类型 | 状态 |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **TASK-025** | macOS 设计令牌库与双模（Light / Dark）主题上下文引擎 | `v6.REQ-002` | `src/theme/macos.ts`, `ThemeContext.tsx`, `ThemeModeToggle.tsx` | Unit / UI | 已完成 |
| **TASK-026** | 轻量强类型双语国际化引擎（i18n）与中英字典库 | `v6.REQ-003` | `src/i18n/`, `I18nContext.tsx`, `LanguageSwitcher.tsx` | Unit / UI | 已完成 |
| **TASK-027** | macOS 标志性交通灯窗口头部、微坞、文件进度卡片与三态工作区重构 | `v6.REQ-001` | `WindowHeader.tsx`, `LeftDock.tsx`, `FileChangeCard.tsx`, `WorkspacePanel.tsx`, `App.tsx` | Unit / UI | 已完成 |
| **TASK-028** | Blot-UI v6 双模双语视觉回归自动化验收与端到端测试 | `v6.REQ-001` ~ `v6.REQ-003` | `frontend/e2e/v6-workflow.spec.ts`, 4 组视觉截图 | E2E / Visual | 待开始 |

---

## 任务详情

### TASK-025 · macOS 设计令牌库与双模（Light / Dark）主题上下文引擎

> 依赖：无  
> 官方源码参考：[src/context/ThemeContext.tsx](https://github.com/dyad-sh/dyad/blob/main/src/context/ThemeContext.tsx)

- [ ] 创建 `frontend/src/theme/macos.ts`：导出 `light` 与 `dark` 完整的 macOS 设计令牌与 CSS 变量生成工具
- [ ] 创建 `frontend/src/context/ThemeContext.tsx`：提供 `useMacOSTheme()` Hook，支持 `themeMode`, `toggleTheme`, `setThemeMode`，自动同步 DOM `.dark` 类与 `localStorage`
- [ ] 创建 `frontend/src/components/ThemeModeToggle.tsx`：符合 macOS 审美的明暗双模切换胶囊/图标按钮
- [ ] 编写前端单元测试 `frontend/src/theme/macos.test.tsx`

**验证方式：**
```bash
cd frontend; pnpm test -- macos
```

**验收证据：** 单元测试通过，生成 `docs/spec/versions/v6/ac/TASK-025-AC.md`。  
_需求:_ `requirements.md` 中 `v6.REQ-002`  
_验收标准:_ `v6.REQ-002-AC-001`, `v6.REQ-002-AC-002`  
_测试类型:_ Unit / UI

---

### TASK-026 · 轻量强类型双语国际化引擎（i18n）与中英字典库

> 依赖：无  
> 官方源码参考：[src/i18n/index.ts](https://github.com/dyad-sh/dyad/blob/main/src/i18n/index.ts)

- [ ] 创建 `frontend/src/i18n/locales/en.ts` 与 `frontend/src/i18n/locales/zh.ts`：100% 键对应的完整中英双语词条字典
- [ ] 创建 `frontend/src/i18n/I18nContext.tsx`：提供 `useI18n()` Hook，支持 `locale`, `setLocale`, `t(key, defaultVal)`，自动保存至 `localStorage`
- [ ] 创建 `frontend/src/components/LanguageSwitcher.tsx`：精致的 macOS 分段切换或多语言切换微组件
- [ ] 编写前端单元测试 `frontend/src/i18n/i18n.test.tsx`

**验证方式：**
```bash
cd frontend; pnpm test -- i18n
```

**验收证据：** 单元测试通过，生成 `docs/spec/versions/v6/ac/TASK-026-AC.md`。  
_需求:_ `requirements.md` 中 `v6.REQ-003`  
_验收标准:_ `v6.REQ-003-AC-001`, `v6.REQ-003-AC-002`  
_测试类型:_ Unit / UI

---

### TASK-027 · macOS 标志性交通灯窗口头部、微坞、文件进度卡片与三态工作区重构

> 依赖：TASK-025, TASK-026  
> 官方源码参考：[src/components/TitleBar.tsx](https://github.com/dyad-sh/dyad/blob/main/src/components/TitleBar.tsx)

- [ ] 创建 `frontend/src/components/MacOSWindowHeader.tsx`：
  - 标志性三色交通灯点（关闭 `#ff5f56`, 最小化 `#ffbd2e`, 缩放 `#27c93f`，带微妙的深色边框）；
  - 项目标签页（Tab，带关闭按钮）、`Manage app` 启动按钮、右侧 `Pro` 徽章；
  - 集成 `ThemeModeToggle`, `LanguageSwitcher`, 快捷键提示及各控制面板触发按钮。
- [ ] 创建 `frontend/src/components/LeftDock.tsx`：
  - 最左侧图标微坞（52px），垂直排列折叠、Home（紫色胶囊背景）、Settings、Docs、Templates、Components、Help 图标。
- [ ] 创建 `frontend/src/components/FileChangeCard.tsx`：
  - 文件修改进度微卡片（文件图标、文件名、路径、`Writing...` 旋转指示器或 `✔` 完成状态、`>` 审查跳转）。
- [ ] 创建/重构 `frontend/src/components/WorkspacePanel.tsx`：
  - 顶部分段控制器（`👁 Preview`、`<> Code`、`🌐 Publish`）；
  - 拟真浏览器地址栏（`← →`、`⎋`、`/`、`↻`）；
  - 中间画布视图（支持实时 Preview 沙箱、Code 源码查阅、Publish 构建发布）；
  - 底部可折叠 `System Messages` 日志控制台抽屉。
- [ ] 全面重构 `frontend/src/App.tsx` 整合三栏式布局，支持富输入框（Mode 切换 `🔨 Build ⌄`、Model 选择 `Model: Auto ⌄`、`+` 附件与 `⊙` 发送）。
- [ ] 编写更新前端测试 `App.test.tsx` 与各新组件测试用例。

**验证方式：**
```bash
cd frontend; pnpm test --run
```

**验收证据：** 单元测试与组件测试全部通过，生成 `docs/spec/versions/v6/ac/TASK-027-AC.md`。  
_需求:_ `requirements.md` 中 `v6.REQ-001` 全量 AC  
_验收标准:_ `v6.REQ-001-AC-001` ~ `v6.REQ-001-AC-004`  
_测试类型:_ Unit / UI

---

### TASK-028 · Blot-UI v6 双模双语视觉回归自动化验收与端到端测试

> 依赖：TASK-025 ~ TASK-027  
> 官方源码参考：[playwright.config.ts](https://github.com/dyad-sh/dyad/blob/main/playwright.config.ts)

- [ ] 编写 `frontend/e2e/v6-workflow.spec.ts` 端到端视觉回归测试：
  1. **macOS 浅色主题 + 英文模式**：严格比对设计图三栏式布局，捕获并留存 `01-v6-macos-light-en.png`；
  2. **macOS 浅色主题 + 中文模式**：切换语言，捕获并留存 `02-v6-macos-light-zh.png`；
  3. **macOS 深色主题 + 中文模式**：切换深色，捕获并留存 `03-v6-macos-dark-zh.png`；
  4. **macOS 深色主题 + 英文模式**：切换英文，捕获并留存 `04-v6-macos-dark-en.png`。
- [ ] 编写 `docs/spec/versions/v6/ac/TASK-028-AC.md` 与最终报告 `v6-final-report.md`。
- [ ] 执行全套自动化回归（Go + Vitest + Playwright）。

**验证方式：**
```bash
cd frontend; pnpm exec playwright test e2e/v6-workflow.spec.ts
```

**验收证据：** Playwright 测试全绿，4 张高保真全屏视觉截图产出，生成最终验收报告。  
_需求:_ `requirements.md` 中 `v6.REQ-001` ~ `v6.REQ-003` 全量 AC  
_验收标准:_ 全量 AC 闭环验证  
_测试类型:_ E2E / Visual
