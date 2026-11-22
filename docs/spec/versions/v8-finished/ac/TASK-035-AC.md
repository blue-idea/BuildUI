# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v8/ac/TASK-035-AC.md`  
> 任务编号：TASK-035 · App 全局诊断状态流与代码检视全链路打通  
> 执行日期：2026-11-21  
> 执行人：Antigravity Agent  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-035 | v8.REQ-001-AC-001 | Integration | 主应用中切换至代码检视时，以左侧目录树与右侧轻量语法高亮代码编辑器完整呈现 | PASS | `App.test.tsx` 20 项集成测试全部通过 | — |
| TASK-035 | v8.REQ-002-AC-002 | Integration | 主应用全链路支持点击诊断问题项一键跳转，跨文件切换至目标代码并高亮目标错误代码行 | PASS | `App.test.tsx` 诊断跳转集成测试通过 | — |
| TASK-035 | v8.REQ-002-AC-001 | Unit | CheckTypeScript 返回问题时自动更新全局 diagnostics 状态并传递至工作区面板 | PASS | `wailsBridge.test.ts` 与 `tsc` 类型检查通过 | — |
