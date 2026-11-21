# 可追溯性矩阵（Traceability）· Blot-UI v2

> 文件路径：`docs/spec/versions/v2/traceability.md`  
> 规范版本：v2 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项交付任务）  
> 选型架构：Wails v2 + React 19 + TypeScript + Go 1.26 + SQLite + Git  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 矩阵说明

本矩阵严格维护 v2 版本需求（REQ/AC）、设计方案、实现任务（TASK）以及测试验收文件之间的双向可追溯关系。

---

## 2. 追溯矩阵

| TASK ID | 任务名称 | REQ / AC | 状态 | 设计对应模块 | 测试类型 | 官方上游参考源码链接 |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **TASK-009** | LLM Provider 抽象层、OpenAI 兼容流式客户端与配置中心（Settings） | `v2.REQ-001` / `AC-001..002` | `done` | LLM Engine & Settings (`internal/llm`, `internal/settings`, `SettingsModal.tsx`) | Unit / Integ | [src/ipc/handlers/settings_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/settings_handlers.ts) |
| **TASK-010** | 多轮会话上下文组装、增量 Prompt 裁剪与流式生成中断控制 | `v2.REQ-002` / `AC-001..002` | `done` | Multi-turn Prompt Assembler & Cancelable Stream (`internal/agent`) | Integ / Unit | [src/prompts/local_agent_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/local_agent_prompt.ts) |
| **TASK-011** | Git 版本快照时光机、代码 Diff 提取与一键工作区安全回滚 | `v2.REQ-003` / `AC-001..002` | 待开始 | Git Time Machine & Diff Parser (`internal/version`, `DiffViewer.tsx`) | Integ / Unit | [src/ipc/services/git_service.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/services/git_service.ts) |
| **TASK-012** | Wails 原生桌面增强与 v2 全流程 Playwright E2E 验证 | `v2.REQ-004` / `AC-001..002` | 待开始 | Desktop Shell & Playwright E2E Suite (`e2e/v2-workflow.spec.ts`) | E2E / Visual | [src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts) |

---

## 3. 变更记录

| 日期 | 变更内容 | 原因 |
| :---: | :--- | :--- |
| 2026-11-21 | 归档 v1 到 `v1-finished/`，正式启动 v2 规格规划，完成需求、设计、审查、任务与追溯文件 | 开启 v2 里程碑 |
