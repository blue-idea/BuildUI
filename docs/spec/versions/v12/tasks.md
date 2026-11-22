# 实施计划（Tasks）· Blot-UI v12

> 文件路径：`docs/spec/versions/v12/tasks.md`  
> 规范版本：v12 · 日期：2026-11-22  

执行时须严格遵循 [docs/spec/versions/v12/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v12/requirements.md) 中对应需求的验收标准。

---

## 任务清单

---

- [x] **TASK-050 · 强化 PromptAssembler 注入工业级脚手架规范与零占位符铁律（TDD）**

  > 依赖：无

  - [x] 编写 Go 单元测试 `internal/agent/prompt_test.go`（Red），断言生成的 SystemPrompt 严格包含：
    1. 40+ shadcn/ui 内置组件清单与 `@/components/ui/` 导入使用指南，严禁手写重复基础 UI 原语；
    2. 目录分层规范：`src/pages/` 放置页面、`src/components/` 放置可复用组件、根路由维护在 `src/App.tsx` 且默认首页为 `src/pages/Index.tsx`；
    3. 严格使用 Tailwind CSS 工具类，绝对禁止任何自定义 CSS；
    4. 零占位符铁律：严禁 `// TODO`、`/* TODO */`、省略号或半成品，每个组件必须全功能可用；
    5. 缺失内部文件即时创建铁律：若 import 了当前工作区尚不存在的内部模块，必须在同次流中立即用 `<dyad-write>` 完整落盘。
  - [x] 升级实现 `internal/agent/prompt.go`，注入 `SCAFFOLD_RULES` 与 `ZERO_PLACEHOLDER_POLICY` 工业级模板（Green）。
  - [x] 运行 `go test ./internal/agent -run TestPromptAssembler` 验证通过并重构（Refactor）。

  **验证方式：**
  ```bash
  go test -v ./internal/agent -run TestPromptAssembler
  ```

  _需求: `requirements.md` 中 `v12.REQ-002`, `v12.REQ-003`  
  _验收标准: `v12.REQ-002-AC-001`, `v12.REQ-002-AC-002`, `v12.REQ-002-AC-003`, `v12.REQ-003-AC-001`, `v12.REQ-003-AC-002`  
  _测试类型: Unit

---

- [x] **TASK-051 · 强化 FileWriter 占位符拦截与安全写盘保障（TDD）**

  > 依赖：无

  - [x] 编写 Go 单元测试 `internal/agent/writer_test.go`（Red），增加各种变体（如 `/* TODO */`, `// ... existing code`, `/* implement */`, `// ... rest of code` 等）的拦截用例。
  - [x] 强化 `internal/agent/writer.go` 正则与校验逻辑（Green）。
  - [x] 运行 `go test ./internal/agent -run TestFileWriter` 验证通过并重构（Refactor）。

  **验证方式：**
  ```bash
  go test -v ./internal/agent -run TestFileWriter
  ```

  _需求: `requirements.md` 中 `v12.REQ-003`  
  _验收标准: `v12.REQ-003-AC-003`  
  _测试类型: Unit

---

- [x] **TASK-052 · 完善蓝图前置问卷澄清与审批门禁闭环流程（TDD）**

  > 依赖：TASK-050

  - [x] 编写 Go 测试，验证 `planning_questionnaire` 引导提示词及未审批时严格阻断代码写盘（Red）。
  - [x] 更新 `internal/agent/model_chat.go`，蓝图提示词中强化必须包含设计方向（Design Direction）、主色调（Primary Color）、视觉资产清单（Visuals prompts：Logo/插图/图标）（Green）。
  - [x] 运行 `go test ./internal/blueprint ./internal/agent` 验证通过并重构（Refactor）。

  **验证方式：**
  ```bash
  go test -v ./internal/agent ./internal/blueprint
  ```

  _需求: `requirements.md` 中 `v12.REQ-001`  
  _验收标准: `v12.REQ-001-AC-001`, `v12.REQ-001-AC-002`  
  _测试类型: Unit, Integration

---

- [x] **TASK-053 · 前端澄清问卷答复、蓝图审批卡片展示与代码生成全链路打通（TDD）**

  > 依赖：TASK-052

  - [x] 编写前端 Vitest 测试 `frontend/src/App.test.tsx` 和 `frontend/src/components/QuestionnaireCard.test.tsx`（Red），覆盖：
    - 问卷卡片支持交互与答复提交；
    - 提交后蓝图卡片展示（含设计方向、主色调、视觉清单、审批按钮）；
    - 点击审批后持久化并触发写盘工具解锁。
  - [x] 优化前端状态流（Green）。
  - [x] 运行 `npm test --prefix frontend` 验证通过并重构（Refactor）。

  **验证方式：**
  ```bash
  npm test --prefix frontend
  ```

  _需求: `requirements.md` 中 `v12.REQ-001`, `v12.REQ-002`, `v12.REQ-003`  
  _验收标准: `v12.REQ-001-AC-003`  
  _测试类型: Component, Integration

---

- [x] **TASK-054 · Playwright 视觉验收与 v12 终结交付**

  > 依赖：TASK-053

  - [x] 使用 Playwright 针对澄清问卷卡片、蓝图展示卡片、审批后工作区等进行实景截屏留证。
  - [x] 生成 AC 矩阵报告与 `v12-final-report.md`。
  - [x] 全量执行后端与前端测试套件与代码规范检查。

  **验证方式：**
  ```bash
  go test ./... ; npm test --prefix frontend ; npm run lint --prefix frontend
  ```

  _需求: 全量 v12 需求  
  _测试类型: Visual Regression, QA Acceptance
