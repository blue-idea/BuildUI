# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v7/ac/TASK-032-AC.md`  
> 任务编号：TASK-032  
> 执行日期：2026-11-21  
> 执行人：Antigravity Agent  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-032 | v7.REQ-002-AC-001 | Unit | ModelSelector 默认显示 Auto，根据 settings 解析所有已配 Provider 及其模型，底部提供 Manage Providers 动作项 | PASS | `pnpm --dir frontend test src/components/ModelSelector.test.tsx` (7/7 passed) | — |
| TASK-032 | v7.REQ-002-AC-002 | E2E | 点击 Manage Providers 动作项成功唤起 SettingsModal，支持独立切换 Provider 标签页 | PASS | Playwright E2E `model-selector.spec.ts` 截图证据：`docs/spec/screenshots/model-selector-settings-modal-tabs.png` | — |
