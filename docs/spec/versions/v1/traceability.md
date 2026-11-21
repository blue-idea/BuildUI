# 可追溯性矩阵（Traceability）· Blot-UI (Wails + React)

> 文件路径：`docs/spec/versions/v1/traceability.md`  
> 规范版本：v1 · 日期：2026-11-20  
> 状态：就绪（已拆分 8 项实施任务）  
> 核心选型：Wails v2 (Go 1.26+) + React 19 + TypeScript  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 矩阵说明

本矩阵严格维护需求（REQ/AC）、架构设计、实现任务（TASK）以及测试验收文件之间的双向可追溯关系。

---

## 2. 追溯矩阵

| TASK ID | 任务名称 | REQ / AC | 状态 | 设计对应模块 | 测试类型 | 官方上游参考源码链接 |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **TASK-001** | Wails v2 + React 19 基础底座与纯 Go SQLite 数据层 | `v1.REQ-001` / `AC-002` | `done` | SQLite Storage & DB Migration (`internal/db`, `internal/errs`) | Unit | [src/db/schema.ts](https://github.com/dyad-sh/dyad/blob/main/src/db/schema.ts) |
| **TASK-002** | 脚手架目录展开与应用初始化服务（AppService） | `v1.REQ-001` / `AC-001` | `done` | Scaffold Replicator & Git Init (`internal/app`, `internal/scaffold`) | Integration | [src/ipc/handlers/createFromTemplate.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/createFromTemplate.ts) |
| **TASK-003** | 需求澄清问卷与蓝图前置审批门禁（BlueprintService） | `v1.REQ-002` / `AC-001..003` | `done` | Blueprint Gating & Questionnaire (`internal/blueprint`, `BlueprintCard.tsx`) | Integration | [src/ipc/handlers/app_blueprint_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/app_blueprint_handlers.ts) |
| **TASK-004** | Agent 提示词工程与增量 XML 流式落盘引擎（AgentEngine） | `v1.REQ-003` / `AC-001..002` | `done` | Agent Engine & Streaming XML Parser (`internal/agent`) | Unit/Integ | [src/prompts/local_agent_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/local_agent_prompt.ts) |
| **TASK-005** | TypeScript 静态类型检查与自愈验证引擎 | `v1.REQ-004` / `AC-001..002` | `done` | Verification Engine (`internal/verification/tsc`) | Integration | [src/ipc/handlers/problems_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/problems_handlers.ts) |
| **TASK-006** | Git Worktree 隔离快照生产打包验证沙箱 | `v1.REQ-005` / `AC-001` | `done` | Worktree Build Sandbox (`internal/verification/worktree`) | Integration | [src/pro/main/ipc/handlers/local_agent/tools/run_build.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/run_build.ts) |
| **TASK-007** | 本地 Vite 开发服务器监管与实时预览代理 | `v1.REQ-006` / `AC-001..002` | `done` | App Run Supervisor & Iframe Proxy (`internal/app/runner`, `PreviewPanel.tsx`) | Integ/E2E | [src/preview_iframe/controller.ts](https://github.com/dyad-sh/dyad/blob/main/src/preview_iframe/controller.ts) |
| **TASK-008** | Turn-Level 自动 Git 提交与端到端核心流程贯通及验收 | `v1.REQ-007` / `AC-001` | `done` | Git Turn Commits & Playwright E2E | E2E | [src/ipc/services/git_service.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/services/git_service.ts) |

---

## 3. 变更记录

| 日期 | 变更内容 | 原因 |
| :---: | :--- | :--- |
| 2026-11-20 | 将整体架构全面迁移至 Wails v2 + React 19 + Go 1.26，重新梳理 8 项高内聚交付任务 | 技术栈决策切换为 Wails |
