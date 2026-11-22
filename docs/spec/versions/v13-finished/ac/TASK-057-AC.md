# AC 验收矩阵（Acceptance Criteria Matrix）· Blot-UI v13

> 文件路径：`docs/spec/versions/v13/ac/TASK-057-AC.md`  
> 任务编号：TASK-057  
> 执行日期：2026-11-22  
> 执行人：Antigravity Agent  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-057 | v13.REQ-001-AC-001 | Unit | 激活检查模式后光标切换为 crosshair，鼠标悬停元素展示高亮浮层及 tagName、组件路径徽章 | PASS | `pnpm --filter frontend test preview-inspector.test.ts` (3/3 pass) | — |
| TASK-057 | v13.REQ-001-AC-002 | Unit | 拦截元素点击默认跳转，提取 tagName, componentPath, line, col, className, textSnippet, boundingBox | PASS | `pnpm --filter frontend test preview-inspector.test.ts` | — |
| TASK-057 | v13.REQ-001-AC-003 | Unit | 向 parent window postMessage 发送包含完整元数据的 `buildui:element-selected` 事件 | PASS | `pnpm --filter frontend test preview-inspector.test.ts` | — |
