# v19 任务清单 (Tasks)

> 规范版本：v19 · 创建日期：2026-11-23  
> 遵循流程：TDD (红-绿-重构) + HNS-SDD 闭环

---

## 任务列表

- [x] **TASK-077**: `preview-inspector.ts` 仿 DevTools 点选识别、防跳转拦截与盒模型计算
  - **对应需求**: `v19.REQ-002`, `v19.REQ-003` (AC-002-1, AC-002-2, AC-003-1)
  - **实现内容**:
    - 在沙箱中实现 `getBoxModelMetrics(el)` 计算 margin, border, padding, content 及绝对矩形坐标。
    - 在捕获阶段拦截 `click`, `auxclick`, `submit` 等，调用 `preventDefault()` 和 `stopImmediatePropagation()` 彻底杜绝页面跳转。
    - 改造沙箱内高亮浮层：悬停时仿 DevTools 跟随，选中时渲染锁定状态的多层盒模型高亮框（分色呈现 Margin, Border, Padding, Content）。
    - 随 `buildui:element-selected` 上报完整的 `boxModel` 结构体。
  - **测试用例**: `frontend/src/preview-inspector.test.ts` (PASS, 6/6)

- [x] **TASK-078**: `ComponentInspector.tsx` 与 `LocalEditPopover.tsx` 交互状态改造与盒模型图解卡片
  - **对应需求**: `v19.REQ-001`, `v19.REQ-003` (AC-001-1, AC-001-2, AC-003-2, AC-003-3)
  - **实现内容**:
    - `types/inspect.ts` 增加 `BoxModelMetrics` 定义。
    - `ComponentInspector.tsx` 顶部横幅文案强化为局部编辑状态（Local Edit Mode: Select Elements）。
    - `LocalEditPopover.tsx` 增加仿 DevTools 的盒模型图解卡片（BoxModelDiagram），以同心嵌套矩形直观展示 Margin、Border、Padding、Content 实时数值。
  - **测试用例**: `frontend/src/components/ComponentInspector.test.tsx`, `frontend/src/components/LocalEditPopover.test.tsx` (PASS, 12/12)

- [x] **TASK-079**: `WorkspacePanel.tsx` 与主应用全流程贯通
  - **对应需求**: `v19.REQ-001`, `v19.REQ-002`, `v19.REQ-003` (AC-001-1, AC-002-2, AC-003-1)
  - **实现内容**:
    - `WorkspacePanel.tsx` 接收沙箱包含盒模型的元素，并透传给局部编辑控制器。
    - 优化审查按钮文案与状态指示，保证切换和退出流畅。
    - 更新 `WorkspacePanel.test.tsx` 和 `App.test.tsx` 覆盖全流程。
  - **测试用例**: `frontend/src/components/WorkspacePanel.test.tsx`, `frontend/src/App.test.tsx` (PASS, 50/50)

- [x] **TASK-080**: 自动化全量回归、Playwright MCP 视觉验收与 v19 交付归档
  - **对应需求**: 全量需求项
  - **实现内容**:
    - 运行 Vitest 全量单元测试（36/36 文件全过，231/231 用例 PASS）。
    - 运行 Go 后端测试（23/23 包全部 PASS）与前端 `tsc && vite build` 生产构建。
    - 使用 Playwright MCP 进行端到端视觉回归，捕获悬停与选中盒模型框的高清截图。
    - 编写各 AC 验收报告、更新 traceability 矩阵、编写 `v19-final-report.md`，合并分支并推送。
