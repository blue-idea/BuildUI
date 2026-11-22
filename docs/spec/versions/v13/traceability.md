# 可追溯性矩阵（Traceability）· Blot-UI v13

> 文件路径：`docs/spec/versions/v13/traceability.md`  
> 规范版本：v13 · 日期：2026-11-22  
> 创建步骤：STEP 5（拆分任务）

---

## 追溯矩阵

| TASK ID | 任务名称 | REQ / AC | 状态 | 实现文件 | 测试文件 | AC 报告 | 完成日期 |
|---------|---------|---------|:----:|---------|---------|---------|---------|
| TASK-057 | 预览沙箱自由元素审查与悬停高亮拦截 | v13.REQ-001 / AC-001, AC-002, AC-003 | 待开始 | internal/scaffold/template/src/preview-inspector.ts | frontend/src/components/WorkspacePanel.test.tsx | docs/spec/versions/v13/ac/TASK-057-AC.md | — |
| TASK-058 | 智能代码定位器 sourceLocator 实现 (TDD) | v13.REQ-002 / AC-001, AC-002, AC-003 | 待开始 | frontend/src/utils/sourceLocator.ts | frontend/src/utils/sourceLocator.test.ts | docs/spec/versions/v13/ac/TASK-058-AC.md | — |
| TASK-059 | 局部编辑控制器升级与一键切换 Code 视图 (TDD) | v13.REQ-003 / AC-001, AC-002, AC-003 | 待开始 | frontend/src/components/LocalEditPopover.tsx, ComponentInspector.tsx | frontend/src/components/LocalEditPopover.test.tsx, ComponentInspector.test.tsx | docs/spec/versions/v13/ac/TASK-059-AC.md | — |
| TASK-060 | 定向局部 Prompt 格式化与工作台全链路联动 | v13.REQ-003 / AC-002, v13.REQ-004 / AC-001, AC-002 | 待开始 | frontend/src/utils/targetedPrompt.ts, WorkspacePanel.tsx, App.tsx | frontend/src/utils/targetedPrompt.test.ts, WorkspacePanel.test.tsx, App.test.tsx | docs/spec/versions/v13/ac/TASK-060-AC.md | — |
| TASK-061 | Playwright 端到端视觉回归测试验收与 v13 交付 | 全量 v13 需求 | 待开始 | e2e / 全项目 | Playwright E2E 套件 | docs/spec/versions/v13/ac/TASK-061-AC.md | — |

---

## 变更记录

| 日期 | 变更内容 | 原因 |
|------|---------|------|
| 2026-11-22 | 初始化 v13 追溯矩阵（共 5 项任务：TASK-057 ~ TASK-061） | STEP 5 任务拆分完成 |
