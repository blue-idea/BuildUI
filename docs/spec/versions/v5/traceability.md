# 可追溯性矩阵（Traceability）· Blot-UI v5

> 文件路径：`docs/spec/versions/v5/traceability.md`  
> 规范版本：v5 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项交付任务）  
> 选型架构：Wails v2 + React 19 + TypeScript + Go 1.26 + SQLite + Git  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 矩阵说明

本矩阵严格维护 v5 版本需求（REQ/AC）、设计方案、实现任务（TASK）以及测试验收文件之间的双向可追溯关系。

---

## 2. 追溯矩阵

| TASK ID | 任务名称 | REQ / AC | 状态 | 设计对应模块 | 测试类型 | 官方上游参考源码链接 |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **TASK-021** | 应用模版元数据管理与脚手架初始化服务 | `v5.REQ-001` / `AC-001..002` | 待开始 | TemplateService & Scaffolder (`internal/template`, `app.go`) | Unit / Integ | [src/services/template_service.ts](https://github.com/dyad-sh/dyad/blob/main/src/services/template_service.ts) |
| **TASK-022** | 前端模版选择器组件 `TemplateModal.tsx` 与新建项目联动 | `v5.REQ-001` / `AC-003` | 待开始 | TemplatePicker Modal (`frontend/src/components/TemplateModal.tsx`) | Unit / UI | [src/components/TemplatePicker.tsx](https://github.com/dyad-sh/dyad/blob/main/src/components/TemplatePicker.tsx) |
| **TASK-023** | 全局命令面板 `CommandPalette.tsx` 与全键盘快捷键系统集成 | `v5.REQ-002` / `AC-001..003` | 待开始 | CommandPalette & Global Keyboard Shortcuts (`CommandPalette.tsx`, `App.tsx`) | UI / Unit | [src/components/CommandPalette.tsx](https://github.com/dyad-sh/dyad/blob/main/src/components/CommandPalette.tsx) |
| **TASK-024** | Blot-UI v5 全流程整合与 Playwright E2E 自动化验收 | `v5.REQ-001..002` 全量 AC | 待开始 | Desktop Shell & Playwright E2E Suite (`frontend/e2e/v5-workflow.spec.ts`) | E2E / Visual | [src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts) |

---

## 3. 变更记录

| 日期 | 变更内容 | 原因 |
| :---: | :--- | :--- |
| 2026-11-21 | 归档 v4 到 `v4-finished/`，正式启动 v5 规格规划，完成需求、设计、审查、任务与追溯文件 | 开启 v5 里程碑 |
