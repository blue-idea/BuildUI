# 需求追溯矩阵（Traceability Matrix）· Blot-UI v8

> 文件路径：`docs/spec/versions/v8/traceability.md`  
> 规范版本：v8 · 日期：2026-11-21  

---

## 1. 需求至任务双向映射

| 需求 ID | 需求名称 | 验收标准 (AC) | 任务 ID | 实现文件 | 测试文件 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **v8.REQ-001** | 轻量代码高亮与行号指示栏 | `v8.REQ-001-AC-001` (行号指示)<br>`v8.REQ-001-AC-002` (语法分词)<br>`v8.REQ-001-AC-003` (高亮行滚动) | TASK-033<br>TASK-035 | `CodeEditorViewer.tsx`<br>`WorkspacePanel.tsx` | `CodeEditorViewer.test.tsx`<br>`WorkspacePanel.test.tsx` |
| **v8.REQ-002** | 错误诊断项展示与直达跳转 | `v8.REQ-002-AC-001` (诊断面板)<br>`v8.REQ-002-AC-002` (同文件跳转)<br>`v8.REQ-002-AC-003` (跨文件跳转)<br>`v8.REQ-002-AC-004` (行内错误标记) | TASK-034<br>TASK-035 | `WorkspacePanel.tsx`<br>`CodeEditorViewer.tsx`<br>`App.tsx` | `WorkspacePanel.test.tsx`<br>`App.test.tsx` |

---

## 2. 状态追溯

- [x] TASK-033: 已完成 (CodeEditorViewer 轻量分词语法高亮、行号 Gutter、目标行高亮、行内诊断标记)
- [x] TASK-034: 已完成 (WorkspacePanel 代码视图集成 CodeEditorViewer、DiagnosticsPanel 问题面板与跳转联动)
- [x] TASK-035: 已完成 (App.tsx 全局 diagnostics 接入与端到端集成测试)
- [x] TASK-036: 已完成 (Playwright 真实截屏留证、AC 验收矩阵与总结报告归档)
