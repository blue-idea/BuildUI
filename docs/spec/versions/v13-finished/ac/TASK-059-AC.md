# AC 验收矩阵（Acceptance Criteria Matrix）· Blot-UI v13

> 文件路径：`docs/spec/versions/v13/ac/TASK-059-AC.md`  
> 任务编号：TASK-059  
> 执行日期：2026-11-22  
> 执行人：Antigravity Agent  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-059 | v13.REQ-003-AC-001 | Component | LocalEditPopover 渲染定位行号徽章（如 Lines 8-13）及折叠式 Target Code Region 代码预览卡片 | PASS | `pnpm --filter frontend test LocalEditPopover.test.tsx` (6/6 pass) | — |
| TASK-059 | v13.REQ-003-AC-002 | Component | 点击 Jump to Code 按钮触发 onJumpToCode(filePath, line) 回调 | PASS | `pnpm --filter frontend test LocalEditPopover.test.tsx ComponentInspector.test.tsx` | — |
| TASK-059 | v13.REQ-003-AC-003 | Component | 快捷预设药丸点击填充 prompt，支持输入指令并触发 onSubmit 提交与 Esc/Cancel 退出 | PASS | `pnpm --filter frontend test LocalEditPopover.test.tsx` | — |
