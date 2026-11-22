# 可追溯性矩阵（Traceability）· Blot-UI v13

> 文件路径：`docs/spec/versions/v13/traceability.md`  
> 规范版本：v13 · 日期：2026-11-22  
> 创建步骤：STEP 5（拆分任务）  
> 更新步骤：STEP 6（全部任务完成）

---

## 追溯矩阵

| TASK ID | 任务名称 | REQ / AC | 状态 | 实现文件 | 测试文件 | AC 报告 | 完成日期 |
|---------|---------|---------|:----:|---------|---------|---------|---------|
| TASK-057 | 预览沙箱自由元素审查与悬停高亮拦截 | v13.REQ-001 / AC-001, AC-002, AC-003 | done | internal/scaffold/template/src/preview-inspector.ts | frontend/src/preview-inspector.test.ts | docs/spec/versions/v13/ac/TASK-057-AC.md | 2026-11-22 |
| TASK-058 | 智能代码定位器 sourceLocator 实现 (TDD) | v13.REQ-002 / AC-001, AC-002, AC-003 | done | frontend/src/utils/sourceLocator.ts | frontend/src/utils/sourceLocator.test.ts | docs/spec/versions/v13/ac/TASK-058-AC.md | 2026-11-22 |
| TASK-059 | 局部编辑控制器升级与一键切换 Code 视图 (TDD) | v13.REQ-003 / AC-001, AC-002, AC-003 | done | frontend/src/components/LocalEditPopover.tsx, ComponentInspector.tsx | frontend/src/components/LocalEditPopover.test.tsx, ComponentInspector.test.tsx | docs/spec/versions/v13/ac/TASK-059-AC.md | 2026-11-22 |
| TASK-060 | 定向局部 Prompt 格式化与工作台全链路联动 | v13.REQ-003 / AC-002, v13.REQ-004 / AC-001, AC-002 | done | frontend/src/utils/targetedPrompt.ts, WorkspacePanel.tsx, App.tsx | frontend/src/utils/targetedPrompt.test.ts, WorkspacePanel.test.tsx, App.test.tsx | docs/spec/versions/v13/ac/TASK-060-AC.md | 2026-11-22 |
| TASK-061 | Playwright 端到端视觉回归测试验收与 v13 交付 | 全量 v13 需求 | done | frontend/e2e/v13-local-edit.spec.ts | Playwright E2E 套件 | docs/spec/versions/v13/ac/TASK-061-AC.md | 2026-11-22 |

---

## 变更记录

| 日期 | 变更内容 | 原因 |
|------|---------|------|
| 2026-11-22 | 初始化 v13 追溯矩阵（共 5 项任务：TASK-057 ~ TASK-061） | STEP 5 任务拆分完成 |
| 2026-11-22 | 全量 5 项任务全部完成并验收通过 | STEP 6 执行验收完成 |
