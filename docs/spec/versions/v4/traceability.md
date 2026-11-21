# 可追溯性矩阵（Traceability）· Blot-UI v4

> 文件路径：`docs/spec/versions/v4/traceability.md`  
> 规范版本：v4 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项交付任务）  
> 选型架构：Wails v2 + React 19 + TypeScript + Go 1.26 + SQLite + Git  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 矩阵说明

本矩阵严格维护 v4 版本需求（REQ/AC）、设计方案、实现任务（TASK）以及测试验收文件之间的双向可追溯关系。

---

## 2. 追溯矩阵

| TASK ID | 任务名称 | REQ / AC | 状态 | 设计对应模块 | 测试类型 | 官方上游参考源码链接 |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **TASK-017** | 智能第三方依赖提取、白名单安全校验与沙箱异步安装服务 | `v4.REQ-001` / `AC-001..003` | `done` | Dynamic DependencyManager (`internal/agent`, `internal/app/runner`) | Unit / Integ | [src/services/package_service.ts](https://github.com/dyad-sh/dyad/blob/main/src/services/package_service.ts) |
| **TASK-018** | UI 视觉主题引擎、预设集管理与跨沙箱动态 CSS 注入 | `v4.REQ-002` / `AC-001..002` | `done` | UI Theme Engine & ThemeSelector (`internal/theme`, `ThemeSelector.tsx`) | Unit / UI | [src/themes/theme_manager.ts](https://github.com/dyad-sh/dyad/blob/main/src/themes/theme_manager.ts) |
| **TASK-019** | 主界面集成：依赖安装实时进度反馈与主题持久化联动 | `v4.REQ-001..002` | `done` | Main Shell Integration (`App.tsx`, `PreviewPanel.tsx`) | UI / Unit | [src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts) |
| **TASK-020** | Blot-UI v4 全流程整合与 Playwright E2E 自动化验收 | `v4.REQ-001..002` 全量 AC | 待开始 | Desktop Shell & Playwright E2E Suite (`frontend/e2e/v4-workflow.spec.ts`) | E2E / Visual | [src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts) |

---

## 3. 变更记录

| 日期 | 变更内容 | 原因 |
| :---: | :--- | :--- |
| 2026-11-21 | 归档 v3 到 `v3-finished/`，正式启动 v4 规格规划，完成需求、设计、审查、任务与追溯文件 | 开启 v4 里程碑 |
