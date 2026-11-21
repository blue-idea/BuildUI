# 可追溯性矩阵（Traceability）· Blot-UI v3

> 文件路径：`docs/spec/versions/v3/traceability.md`  
> 规范版本：v3 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项交付任务）  
> 选型架构：Wails v2 + React 19 + TypeScript + Go 1.26 + SQLite + Git  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 矩阵说明

本矩阵严格维护 v3 版本需求（REQ/AC）、设计方案、实现任务（TASK）以及测试验收文件之间的双向可追溯关系。

---

## 2. 追溯矩阵

| TASK ID | 任务名称 | REQ / AC | 状态 | 设计对应模块 | 测试类型 | 官方上游参考源码链接 |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **TASK-013** | 多应用工作区管理服务、活跃应用切换与 SQLite 级联安全删除 | `v3.REQ-001` / `AC-001..003` | 待开始 | Multi-App Drawer & AppService (`internal/app`, `internal/db`, `AppDrawer.tsx`) | Unit / Integ | [src/ipc/handlers/apps_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/apps_handlers.ts) |
| **TASK-014** | 可视化组件定位审查器（Component Inspector）与定向 Prompt 联动 | `v3.REQ-002` / `AC-001..003` | 待开始 | Component Inspector & PostMessage Resolver (`internal/inspector`, `ComponentInspector.tsx`) | Unit / Integ | [scaffold/src/App.tsx](https://github.com/dyad-sh/dyad/blob/main/scaffold/src/App.tsx) |
| **TASK-015** | 一键工程 Zip 归档导出服务与操作系统原生资源管理器定位 | `v3.REQ-003` / `AC-001..003` | 待开始 | Zip Archive Exporter & Native Reveal (`internal/export`, `ExportModal.tsx`) | Unit / Desktop | [src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts) |
| **TASK-016** | Blot-UI v3 全流程整合与 Playwright E2E 自动化验收 | `v3.REQ-001..003` 全量 AC | 待开始 | Desktop Shell & Playwright E2E Suite (`frontend/e2e/v3-workflow.spec.ts`) | E2E / Visual | [src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts) |

---

## 3. 变更记录

| 日期 | 变更内容 | 原因 |
| :---: | :--- | :--- |
| 2026-11-21 | 归档 v2 到 `v2-finished/`，正式启动 v3 规格规划，完成需求、设计、审查、任务与追溯文件 | 开启 v3 里程碑 |
