# 可追溯性矩阵（Traceability）· Blot-UI v7

> 文件路径：`docs/spec/versions/v7/traceability.md`  
> 规范版本：v7 · 日期：2026-11-21  
> 状态：初始化（STEP 5）  

---

## 矩阵说明

| 字段 | 含义 |
|------|------|
| `TASK ID` | 任务编号，对应 `tasks.md` |
| `REQ / AC` | 关联需求编号和验收标准编号 |
| `状态` | `待开始` / `进行中` / `done` / `BLOCKED` / `WONTFIX` |
| `实现文件` | 主要实现代码的文件路径（完成后填写） |
| `测试文件` | 对应测试文件路径（完成后填写） |
| `AC 报告` | 验收矩阵文件路径，如 `docs/spec/versions/v7/ac/TASK-029-AC.md` |
| `完成日期` | 任务关闭日期 |

---

## 追溯矩阵

| TASK ID | 任务名称 | REQ / AC | 状态 | 实现文件 | 测试文件 | AC 报告 | 完成日期 |
|---------|---------|---------|:----:|---------|---------|---------|---------|
| TASK-029 | 后端多服务商凭证隔离持久化与模型拉取服务 | v7.REQ-001-AC-001, v7.REQ-003-AC-001 | done | internal/settings/service.go, app.go | internal/settings/service_test.go, app_test.go | docs/spec/versions/v7/ac/TASK-029-AC.md | 2026-11-21 |
| TASK-030 | 后端 StreamChat 支持按请求指定 Provider 与 Model 定向调用 | v7.REQ-003-AC-002 | done | internal/agent/service.go, internal/agent/model_chat.go | internal/agent/service_test.go | docs/spec/versions/v7/ac/TASK-030-AC.md | 2026-11-21 |
| TASK-031 | 前端 SettingsModal 支持多服务商 Tabs 独立配置、连接测试与统一持久化 | v7.REQ-001-AC-002 | done | frontend/src/components/SettingsModal.tsx | frontend/src/components/SettingsModal.test.tsx | docs/spec/versions/v7/ac/TASK-031-AC.md | 2026-11-21 |
| TASK-032 | 前端 ModelSelector 联动已配置 Provider、支持定向选择与管理入口 | v7.REQ-002-AC-001, v7.REQ-002-AC-002 | done | frontend/src/components/ModelSelector.tsx, frontend/src/App.tsx | frontend/src/components/ModelSelector.test.tsx, frontend/e2e/model-selector.spec.ts | docs/spec/versions/v7/ac/TASK-032-AC.md | 2026-11-21 |

---

## 变更记录

| 日期 | 变更内容 | 原因 |
|------|---------|------|
| 2026-11-21 | 初始化追溯矩阵（共 4 项任务） | STEP 5 任务拆分完成 |
