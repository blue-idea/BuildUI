# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v8/ac/TASK-036-AC.md`  
> 任务编号：TASK-036 · 视觉回归验证、Playwright 截图留证与 v8 收尾定稿  
> 执行日期：2026-11-21  
> 执行人：Antigravity Agent  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-036 | v8.REQ-001-AC-001 | Visual | Playwright 端到端捕获浅色主题（Light Mode）下代码检视面板左侧文件树与右侧轻量语法高亮代码编辑器完整布局 | PASS | `docs/spec/versions/v8/reports/screenshots/01-v8-code-editor-light-mode.png` | — |
| TASK-036 | v8.REQ-002-AC-002 | Visual | Playwright 端到端捕获浅色主题下点击诊断项自动切换至 RecipeCard.tsx 并高亮聚焦第 3 行代码的视觉证据 | PASS | `docs/spec/versions/v8/reports/screenshots/02-v8-diagnostics-jump-light.png` | — |
| TASK-036 | v8.REQ-001-AC-002 | Visual | Playwright 端到端捕获深色主题（Dark Mode）下代码编辑器、行号指示与诊断面板的自适应视觉呈现 | PASS | `docs/spec/versions/v8/reports/screenshots/03-v8-editor-dark-mode.png` | — |
