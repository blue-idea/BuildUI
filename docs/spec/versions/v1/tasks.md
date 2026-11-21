# 实施任务清单（Tasks）· Blot-UI (Wails + React)

> 文件路径：`docs/spec/versions/v1/tasks.md`  
> 规范版本：v1 · 日期：2026-11-20  
> 关联需求：[requirements.md](requirements.md)  
> 技术架构：[design.md](design.md)  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

执行时须严格遵循 TDD 红绿重构循环，测试结果必须来自真实调用。
每项任务均绑定关联需求编号、测试类型和验收标准。

---

## 任务清单

---

- [x] **TASK-001 · Wails v2 + React 19 基础底座与纯 Go SQLite 数据层**

  > 依赖：无  
  > 官方源码参考：[src/db/schema.ts](https://github.com/dyad-sh/dyad/blob/main/src/db/schema.ts) 与 [src/db/index.ts](https://github.com/dyad-sh/dyad/blob/main/src/db/index.ts)

  - [x] 初始化 Wails v2 项目骨架（Go 1.26 后端 + React 19 / Vite / TypeScript 前端）
  - [x] 引入 `modernc.org/sqlite` 驱动，编写数据库迁移工具，实现 `apps`、`chats`、`messages`、`blueprints`、`versions` 数据表创建
  - [x] 实现基础领域错误类型 `BlotError`（支持 `Validation`、`NotFound`、`Precondition`、`External`、`Internal`）
  - [x] 编写 Go 单元测试验证数据库连接、表结构自动迁移与基础 CRUD 操作

  **验证方式：**
  ```bash
  go test -v -race ./internal/db/...
  ```

  **验收证据：** 数据库表自动建表成功，CRUD 操作经测试通过并输出覆盖率数据。  
  _需求:_ `requirements.md` 中 `v1.REQ-001`  
  _验收标准:_ `v1.REQ-001-AC-002`  
  _测试类型:_ Unit

---

- [x] **TASK-002 · 脚手架目录展开与应用初始化服务（AppService）**

  > 依赖：TASK-001  
  > 官方源码参考：[scaffold/](https://github.com/dyad-sh/dyad/tree/main/scaffold) 与 [src/ipc/handlers/createFromTemplate.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/createFromTemplate.ts)

  - [x] 固化内置应用脚手架 `scaffold/`（集成 React 19、Tailwind CSS、40+ shadcn/ui 组件与 `AI_RULES.md`）
  - [x] 在 Go 后端实现 `AppService.CreateApp` 方法，使用递归复制将模板文件展开至目标用户目录
  - [x] 在展开的目标目录下调用 Git CLI 初始化本地仓库，生成首个干净提交（`Initial commit from Blot scaffold`）
  - [x] 在 SQLite `apps` 表中持久化应用记录并返回 `CreateAppResponse`

  **验证方式：**
  ```bash
  go test -v -race ./internal/app/...
  ```

  **验收证据：** 目标路径成功展开包含完整组件的脚手架工程，Git 状态为 clean，数据库存在新记录。  
  _需求:_ `requirements.md` 中 `v1.REQ-001`  
  _验收标准:_ `v1.REQ-001-AC-001`  
  _测试类型:_ Integration

---

- [x] **TASK-003 · 需求澄清问卷与蓝图前置审批门禁（BlueprintService）**

  > 依赖：TASK-002  
  > 官方源码参考：[src/ipc/handlers/app_blueprint_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/app_blueprint_handlers.ts) 与 [src/pro/main/ipc/handlers/local_agent/tools/write_app_blueprint.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/write_app_blueprint.ts)

  - [x] 实现 `planning_questionnaire` 问卷注入机制，支持向前端分发 1~5 个需求澄清问题
  - [x] 实现 `write_app_blueprint` 数据提取器，生成应用名称、设计风格与视觉规范
  - [x] 构建会话审批门禁状态机：在用户未点击 Approve 前，锁定写盘工具；Approve 后解锁并推送 `app-blueprint:approved` 事件
  - [x] 前端实现交互式问卷卡片与蓝图审批卡片组件（React 19 + Base UI）

  **验证方式：**
  ```bash
  go test -v -race ./internal/blueprint/...
  pnpm test -- BlueprintCard.test.tsx
  ```

  **验收证据：** 未审批时写盘工具被拦截并报错，审批后状态解锁，蓝图持久化到 SQLite。  
  _需求:_ `requirements.md` 中 `v1.REQ-002`  
  _验收标准:_ `v1.REQ-002-AC-001`, `v1.REQ-002-AC-002`, `v1.REQ-002-AC-003`  
  _测试类型:_ Integration

---

- [x] **TASK-004 · Agent 提示词工程与增量 XML 流式落盘引擎（AgentEngine）**

  > 依赖：TASK-003  
  > 官方源码参考：[src/prompts/local_agent_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/local_agent_prompt.ts) 与 [src/prompts/system_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/system_prompt.ts)

  - [x] 构建 Go 提示词装配模块，集成严苛的“零占位符、功能闭环”系统提示词
  - [x] 编写 Go 增量流式 XML 状态机，逐 Token 识别 `<dyad-write path="...">` 并在流传输中落盘
  - [x] 实现 `add_dependency` 依赖自动检测与安装（调用 `pnpm add <pkg>`）
  - [x] 配合 Wails `runtime.EventsEmit` 实现 `chat:chunk`、`chat:tool-start`、`chat:tool-end`、`chat:end` 事件流

  **验证方式：**
  ```bash
  go test -v -race ./internal/agent/...
  ```

  **验收证据：** 模拟大模型 Token 流输入，测试自动解析并精准写盘，无 TODO 占位符。  
  _需求:_ `requirements.md` 中 `v1.REQ-003`  
  _验收标准:_ `v1.REQ-003-AC-001`, `v1.REQ-003-AC-002`  
  _测试类型:_ Unit / Integration

---

- [x] **TASK-005 · TypeScript 静态类型检查与自愈验证引擎（VerificationEngine）**

  > 依赖：TASK-004  
  > 官方源码参考：[src/pro/main/ipc/handlers/local_agent/tools/run_type_checks.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/run_type_checks.ts) 与 [src/ipc/handlers/problems_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/problems_handlers.ts)

  - [x] 编写 `ProblemsService.CheckTypeScript`，调用目标应用的 `tsc --noEmit`
  - [x] 解析 TypeScript 编译诊断输出（文件、行号、列号、诊断消息）
  - [x] 构造类型错误修复 Prompt，自动送回大模型触发自愈重写循环

  **验证方式：**
  ```bash
  go test -v -race ./internal/verification/tsc/...
  ```

  **验收证据：** 人工注入 TypeScript 语法错误，验证模块能精准捕获错误并触发自愈反馈。  
  _需求:_ `requirements.md` 中 `v1.REQ-004`  
  _验收标准:_ `v1.REQ-004-AC-001`, `v1.REQ-004-AC-002`  
  _测试类型:_ Integration

---

- [x] **TASK-006 · Git Worktree 隔离快照生产打包验证沙箱**

  > 依赖：TASK-005  
  > 官方源码参考：[src/pro/main/ipc/handlers/local_agent/tools/run_build.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/run_build.ts) 与 [src/ipc/services/git_overlay_workspace.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/services/git_overlay_workspace.ts)

  - [x] 编写 Go Git Worktree 管理器，支持安全创建临时隔离分支 `.dyad-build-[hash]`
  - [x] 复制工作区修改并运行 `pnpm run build` 进行生产编译测试
  - [x] 捕获生产构建错误日志并自动清理临时 Worktree 工作区

  **验证方式：**
  ```bash
  go test -v -race ./internal/verification/worktree/...
  ```

  **验收证据：** 在不影响主开发目录的前提下，于独立 Worktree 成功执行编译打包并输出结果。  
  _需求:_ `requirements.md` 中 `v1.REQ-005`  
  _验收标准:_ `v1.REQ-005-AC-001`  
  _测试类型:_ Integration

---

- [ ] **TASK-007 · 本地 Vite 开发服务器监管与实时预览代理**

  > 依赖：TASK-002  
  > 官方源码参考：[src/app_run/definition.ts](https://github.com/dyad-sh/dyad/blob/main/src/app_run/definition.ts) 与 [src/preview_iframe/controller.ts](https://github.com/dyad-sh/dyad/blob/main/src/preview_iframe/controller.ts)

  - [ ] 编写 `AppService.RunApp`，通过 Go `os/exec.CommandContext` 启动目标子应用 `pnpm run dev`
  - [ ] 动态解析输出日志捕获监听端口，返回 `previewUrl`
  - [ ] 实现优雅关停（`StopApp`）与进程树清理，杜绝孤儿进程
  - [ ] 前端 Preview 模块内嵌 Iframe，支持实时 HMR 预览与控制台日志转发

  **验证方式：**
  ```bash
  go test -v -race ./internal/app/runner/...
  ```

  **验收证据：** 能够正常启动子应用 Vite 服务器并在前端 Preview Iframe 中完成页面加载，关停后端口释放。  
  _需求:_ `requirements.md` 中 `v1.REQ-006`  
  _验收标准:_ `v1.REQ-006-AC-001`, `v1.REQ-006-AC-002`  
  _测试类型:_ Integration / E2E

---

- [ ] **TASK-008 · Turn-Level 自动 Git 提交与端到端核心流程贯通及验收**

  > 依赖：TASK-001 ~ TASK-007  
  > 官方源码参考：[src/ipc/services/git_service.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/services/git_service.ts)

  - [ ] 实现会话轮次结束时自动执行 `git add -A` 与 `git commit`，将提交哈希存入 SQLite `versions` 表
  - [ ] 贯通 Wails 前后端交互：主界面左右分栏、对话流渲染、蓝图卡片操作与 Iframe 实时预览
  - [ ] 编写 Playwright 端到端测试脚本，模拟完整应用创建与代码生成全链路，**截图留存验收报告**

  **验证方式：**
  ```bash
  pnpm exec playwright test
  ```

  **验收证据：** Playwright 测试全流程 PASS，生成包含关键步骤截图的测试报告。  
  _需求:_ `requirements.md` 中 `v1.REQ-007`  
  _验收标准:_ `v1.REQ-007-AC-001`  
  _测试类型:_ E2E
