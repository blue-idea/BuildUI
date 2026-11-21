# 可追溯性矩阵（Traceability）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/traceability.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项交付任务）  
> 选型架构：Wails v2 + React 19 + TypeScript + Tailwind CSS  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 矩阵说明

本矩阵严格维护 v6 版本需求（REQ/AC）、设计方案、实现任务（TASK）以及测试验收文件之间的双向可追溯关系。

---

## 2. 追溯矩阵

| TASK ID | 任务名称 | REQ / AC | 状态 | 设计对应模块 | 测试类型 | 官方上游参考源码链接 |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **TASK-025** | macOS 设计令牌库与双模（Light / Dark）主题上下文引擎 | `v6.REQ-001` / `AC-001, AC-003` | `ready` | MacOS Design Tokens & ThemeContext (`src/theme/macos.ts`, `ThemeContext.tsx`) | Unit / UI | [src/context/ThemeContext.tsx](https://github.com/dyad-sh/dyad/blob/main/src/context/ThemeContext.tsx) |
| **TASK-026** | 轻量强类型双语国际化引擎（i18n）与中英字典库 | `v6.REQ-002` / `AC-001, AC-002` | `ready` | Strongly-Typed i18n Engine (`src/i18n/`, `I18nContext.tsx`) | Unit / UI | [src/i18n/index.ts](https://github.com/dyad-sh/dyad/blob/main/src/i18n/index.ts) |
| **TASK-027** | macOS 标志性交通灯窗口头部与应用主界面全局视觉升级 | `v6.REQ-001` ~ `v6.REQ-002` | `ready` | MacOS Header, Traffic Lights & App Restyle (`MacOSWindowHeader.tsx`, `App.tsx`) | Unit / UI | [src/components/TitleBar.tsx](https://github.com/dyad-sh/dyad/blob/main/src/components/TitleBar.tsx) |
| **TASK-028** | Blot-UI v6 双模双语视觉回归自动化验收与端到端测试 | `v6.REQ-001` ~ `v6.REQ-002` 全量 AC | `ready` | Playwright Visual Regression Suite (`frontend/e2e/v6-workflow.spec.ts`) | E2E / Visual | [playwright.config.ts](https://github.com/dyad-sh/dyad/blob/main/playwright.config.ts) |

---

## 3. 变更记录

| 日期 | 变更内容 | 原因 |
| :---: | :--- | :--- |
| 2026-11-21 | 归档 v5 到 `v5-finished/`，正式启动 v6 规格规划，完成需求、设计、数据契约、API 契约、审查、任务与追溯文件 | 开启 v6 里程碑（macOS 审美 UI 与中英双语国际化） |
