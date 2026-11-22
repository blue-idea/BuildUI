# AC 验收矩阵（Acceptance Criteria Matrix）· Blot-UI v13

> 文件路径：`docs/spec/versions/v13/ac/TASK-060-AC.md`  
> 任务编号：TASK-060  
> 执行日期：2026-11-22  
> 执行人：Antigravity Agent  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-060 | v13.REQ-003-AC-002 | Integration | 在 WorkspacePanel 中捕获沙箱 element-selected 事件，点击 Jump to Code 一键切换到 code 视图并高亮对应行 | PASS | `pnpm --filter frontend test WorkspacePanel.test.tsx` (9/9 pass) | — |
| TASK-060 | v13.REQ-004-AC-001 | Unit | formatTargetedPrompt 格式化装配目标文件、起止行号范围、原始代码块与边界隔离铁律的结构化 Prompt | PASS | `pnpm --filter frontend test targetedPrompt.test.ts` (3/3 pass) | — |
| TASK-060 | v13.REQ-004-AC-002 | Integration | LocalEditPopover 提交后在 App 中将结构化 Prompt 注入会话并切换到构建区，全量 35 个测试套件通过 | PASS | `pnpm --filter frontend test App.test.tsx` (32/32 pass) | — |
