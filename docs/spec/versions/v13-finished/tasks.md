# 实施计划（Tasks）· Blot-UI v13

> 文件路径：`docs/spec/versions/v13/tasks.md`  
> 规范版本：v13 · 日期：2026-11-22  
> 关联需求：[docs/spec/versions/v13/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v13/requirements.md)  
> 关联设计：[docs/spec/versions/v13/design.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v13/design.md)

执行时须严格遵循 `requirements.md` 中的验收标准，采用 TDD（红-绿-重构）开发方式。

---

## 任务清单

---

- [x] **TASK-057 · 预览沙箱自由元素审查、悬停高亮框与点击锁定采集（`preview-inspector.ts` 增强）**

  > 依赖：无

  - [x] 在 `internal/scaffold/template/src/preview-inspector.ts` 中增强沙箱内 DOM 事件监听：
    - 在审查模式下监听 mousemove，创建动态 Hover Highlight 浮层并显示 `<tagName>` 徽章
    - 监听 click 拦截默认导航与冒泡，锁定元素高亮
    - 解析 `data-dyad-id` 中的文件路径、起始行号与列号，提取 tagName, className, textSnippet, boundingBox
    - 向 parent 窗口分发 `buildui:element-selected` 结构化事件
  - [x] 同步更新 `frontend/src/preview-inspector.ts` 及 scaffold 中的对应文件
  - [x] 编写测试用例验证沙箱消息交互逻辑（`frontend/src/preview-inspector.test.ts`）

  **验证方式：**
  ```bash
  pnpm --filter frontend test preview-inspector.test.ts
  ```

  **验收证据：** 测试覆盖沙箱自由审查消息协议分发（3/3 pass）。  
  _需求: `requirements.md` 中 `v13.REQ-001` (AC-001, AC-002, AC-003)  
  _测试类型: Component, Integration

---

- [x] **TASK-058 · 智能代码定位器 `sourceLocator.ts` 实现（完整外层容器范围与代码片段提取，TDD）**

  > 依赖：无

  - [x] 编写测试用例 `frontend/src/utils/sourceLocator.test.ts`（Red）覆盖：
    - 根据目标行号向上/向下扫描识别完整外层容器闭合范围（startLine ~ endLine）
    - 提取匹配的完整代码片段 `codeSnippet`
    - 单行自闭合标签匹配
    - 行号缺失时的语义降级匹配
  - [x] 实现 `frontend/src/utils/sourceLocator.ts`（Green）
  - [x] 运行 Vitest 确保测试通过并重构优化（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test sourceLocator.test.ts
  ```

  **验收证据：** 单元测试通过（6/6 pass），准确输出完整容器起止行号与代码片段。  
  _需求: `requirements.md` 中 `v13.REQ-002` (AC-001, AC-002, AC-003)  
  _测试类型: Unit

---

- [x] **TASK-059 · 局部编辑控制器升级与一键切换 Code 视图（`LocalEditPopover.tsx` & `ComponentInspector.tsx`，TDD）**

  > 依赖：TASK-057, TASK-058

  - [x] 编写/扩展测试用例 `frontend/src/components/LocalEditPopover.test.tsx` 和 `ComponentInspector.test.tsx`（Red）：
    - 验证渲染完整代码区域徽章（如 `src/components/Header.tsx:14-22`）
    - 验证渲染可折叠的代码片段预览卡片（Target Code Region Preview）
    - 验证点击“Jump to Code”按钮触发视图切换回调
  - [x] 升级 `frontend/src/components/LocalEditPopover.tsx`（Green）
  - [x] 升级 `frontend/src/components/ComponentInspector.tsx` 支持动态注入选中的 DOM 元素与代码定位结果
  - [x] 运行 Vitest 确保测试全部通过（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test LocalEditPopover.test.tsx ComponentInspector.test.tsx
  ```

  **验收证据：** 组件测试通过（11/11 pass），局部编辑弹窗完整呈现代码区域与 Jump to Code 按钮。  
  _需求: `requirements.md` 中 `v13.REQ-003` (AC-001, AC-002, AC-003)  
  _测试类型: Component

---

- [x] **TASK-060 · 定向局部 Prompt 格式化装配与工作台全链路联动**

  > 依赖：TASK-058, TASK-059

  - [x] 编写测试用例 `frontend/src/utils/targetedPrompt.test.ts` 验证包含完整容器代码片段、行号区间与隔离铁律
  - [x] 升级 `frontend/src/utils/targetedPrompt.ts`（Green）
  - [x] 在 `frontend/src/components/WorkspacePanel.tsx` 中：
    - 监听 `buildui:element-selected` 事件
    - 异步调用 `onReadFile` 获取源文件并执行 `sourceLocator`，将定位结果传入局部编辑控制器
    - 接入 `onJumpToCode`：切换 `activeView = 'code'`，高亮并聚焦目标文件行号
  - [x] 在 `frontend/src/App.tsx` 中接收定向编辑指令并送入 AI 流式生成链路
  - [x] 运行全量前端测试验证（35 个测试套件，207 个用例全过）

  **验证方式：**
  ```bash
  pnpm --filter frontend test WorkspacePanel.test.tsx App.test.tsx targetedPrompt.test.ts
  ```

  **验收证据：** 交互与工作台全链路无缝联动，全测试通过。  
  _需求: `requirements.md` 中 `v13.REQ-003`, `v13.REQ-004` (AC-001, AC-002)  
  _测试类型: Integration

---

- [x] **TASK-061 · Playwright 端到端视觉回归测试验收与 v13 交付**

  > 依赖：TASK-060

  - [x] 编写/执行 Playwright E2E 测试脚本（`frontend/e2e/v13-local-edit.spec.ts`），对全链路进行真实截屏留证：
    - `01-v13-inspect-hover-highlight.png`：沙箱内自由悬停高亮与标签徽章
    - `02-v13-element-locked-popover.png`：点击锁定元素后弹出局部编辑控制器（显示完整代码区域与代码片段）
    - `03-v13-jump-to-code-view.png`：点击“Jump to Code”切换到 Code 视图并高亮对应行
    - `04-v13-targeted-prompt-submitted.png`：提交局部定向编辑后触发 AI 流式重构
  - [x] 运行全量质量门禁：TypeScript 编译（0 错误）、Vitest 全量通过、Go 单元测试全量通过
  - [x] 产出 `docs/spec/versions/v13/v13-final-report.md`
  - [x] 更新 `docs/book/todo.md` 中的完成项

  **验证方式：**
  ```bash
  pnpm --filter frontend build && pnpm --filter frontend test && go test ./...
  ```

  **验收证据：** 全量测试通过，0 编译错误，4 份截屏留证。  
  _需求: 全量 v13 需求  
  _测试类型: E2E, Visual Regression

---

## 进度汇总

| TASK ID | 名称 | 测试类型 | 状态 | 关联需求 |
|---------|------|:-------:|:----:|---------|
| TASK-057 | 预览沙箱自由元素审查与悬停高亮拦截 | Component, Integration | 🟢 已完成 | v13.REQ-001 |
| TASK-058 | 智能代码定位器 sourceLocator 实现 (TDD) | Unit | 🟢 已完成 | v13.REQ-002 |
| TASK-059 | 局部编辑控制器升级与一键切换 Code 视图 (TDD) | Component | 🟢 已完成 | v13.REQ-003 |
| TASK-060 | 定向局部 Prompt 格式化与工作台全链路联动 | Integration | 🟢 已完成 | v13.REQ-003, v13.REQ-004 |
| TASK-061 | Playwright 端到端视觉回归测试验收与 v13 交付 | E2E, Visual Regression | 🟢 已完成 | 全量 v13 需求 |
