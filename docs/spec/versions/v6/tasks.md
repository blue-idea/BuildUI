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
| **TASK-025** | macOS 设计令牌库与双模（Light / Dark）主题上下文引擎 | `v6.REQ-001` | `src/theme/macos.ts`, `ThemeContext.tsx`, `ThemeModeToggle.tsx` | Unit / UI | 待开始 |
| **TASK-026** | 轻量强类型双语国际化引擎（i18n）与中英字典库 | `v6.REQ-002` | `src/i18n/`, `I18nContext.tsx`, `LanguageSwitcher.tsx` | Unit / UI | 待开始 |
| **TASK-027** | macOS 标志性交通灯窗口头部与应用主界面全局视觉升级 | `v6.REQ-001` ~ `v6.REQ-002` | `TitleBar.tsx`, `App.tsx`, `CommandPalette.tsx` | Unit / UI | 待开始 |
| **TASK-028** | Blot-UI v6 双模双语视觉回归自动化验收与端到端测试 | `v6.REQ-001` ~ `v6.REQ-002` | `frontend/e2e/v6-workflow.spec.ts`, 4 组视觉截图 | E2E / Visual | 待开始 |

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
cd frontend && pnpm test -- macos
```

**验收证据：** 单元测试通过，生成 `docs/spec/versions/v6/ac/TASK-025-AC.md`。  
_需求:_ `requirements.md` 中 `v6.REQ-001`  
_验收标准:_ `v6.REQ-001-AC-001`, `v6.REQ-001-AC-003`  
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
cd frontend && pnpm test -- i18n
```

**验收证据：** 单元测试通过，生成 `docs/spec/versions/v6/ac/TASK-026-AC.md`。  
_需求:_ `requirements.md` 中 `v6.REQ-002`  
_验收标准:_ `v6.REQ-002-AC-001`, `v6.REQ-002-AC-002`  
_测试类型:_ Unit / UI

---

### TASK-027 · macOS 标志性交通灯窗口头部与应用主界面全局视觉升级

> 依赖：TASK-025, TASK-026  
> 官方源码参考：[src/components/TitleBar.tsx](https://github.com/dyad-sh/dyad/blob/main/src/components/TitleBar.tsx)

- [ ] 创建 `frontend/src/components/MacOSWindowHeader.tsx`：
  - 标志性三色交通灯点（关闭 `#ff5f56`, 最小化 `#ffbd2e`, 缩放 `#27c93f`，带微妙的深色边框）；
  - 居中应用标题及当前活跃应用状态标签；
  - 集成 `ThemeModeToggle`, `LanguageSwitcher`, 快捷键提示及各控制面板触发按钮。
- [ ] 全面重构 `frontend/src/App.tsx`、`AppDrawer.tsx`、`TemplateModal.tsx`、`CommandPalette.tsx`：
  - 应用统一的磨砂玻璃背景、Apple 系统字体、精细微边框与平滑圆角；
  - 接入 `t()` 国际化多语言翻译；
  - 在 `CommandPalette.tsx` 中增加明暗主题切换与中英语言切换快捷命令。
- [ ] 编写更新前端测试 `App.test.tsx` 与各组件测试用例

**验证方式：**
```bash
cd frontend && pnpm test --run
```

**验收证据：** 单元测试与组件测试全部通过，生成 `docs/spec/versions/v6/ac/TASK-027-AC.md`。  
_需求:_ `requirements.md` 中 `v6.REQ-001`, `v6.REQ-002`  
_验收标准:_ `v6.REQ-001-AC-002`, `v6.REQ-002-AC-002`  
_测试类型:_ Unit / UI

---

### TASK-028 · Blot-UI v6 双模双语视觉回归自动化验收与端到端测试

> 依赖：TASK-025 ~ TASK-027  
> 官方源码参考：[playwright.config.ts](https://github.com/dyad-sh/dyad/blob/main/playwright.config.ts)

- [ ] 编写 `frontend/e2e/v6-workflow.spec.ts` 端到端视觉回归测试：
  1. **macOS 浅色主题 + 英文模式**：捕获并留存 `01-v6-macos-light-en.png`；
  2. **macOS 浅色主题 + 中文模式**：切换语言，捕获并留存 `02-v6-macos-light-zh.png`；
  3. **macOS 深色主题 + 中文模式**：切换深色，捕获并留存 `03-v6-macos-dark-zh.png`；
  4. **macOS 深色主题 + 英文模式**：切换英文，捕获并留存 `04-v6-macos-dark-en.png`。
- [ ] 编写 `docs/spec/versions/v6/ac/TASK-028-AC.md` 与最终报告 `v6-final-report.md`。
- [ ] 执行全套自动化回归（Go + Vitest + Playwright）。

**验证方式：**
```bash
cd frontend && pnpm exec playwright test e2e/v6-workflow.spec.ts
```

**验收证据：** Playwright 测试全绿，4 张高保真全屏视觉截图产出，生成最终验收报告。  
_需求:_ `requirements.md` 中 `v6.REQ-001`, `v6.REQ-002` 全量 AC  
_验收标准:_ 全量 AC 闭环验证  
_测试类型:_ E2E / Visual
