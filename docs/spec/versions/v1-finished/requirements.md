# 需求规格说明书（Requirements）· Blot-UI (Wails + React)

> 文件路径：`docs/spec/versions/v1/requirements.md`  
> 规范版本：v1 · 日期：2026-11-20  
> 状态：已定稿（Approved）  
> 核心选型：Wails v2 (Go 1.26+) + React 19 + TypeScript  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 业务全景与核心用例

Blot-UI 是一个基于 Wails + React 构建的专为本地开发者打造的 AI 应用构建平台。本需求规格书定义 v1 版本必须交付的核心能力，确保系统能够实现高完成度、零断链、具备自检自愈能力的 Web 应用自动化构建。

---

## 2. 需求列表

### 需求 v1.REQ-001 · 标准化应用脚手架初始化与模板展开

**用户故事**：作为用户，我希望新建应用时能立即获得包含全套 UI 组件和标准路由的现代化工程底座，以便 AI 能基于成熟组件直接开发。  
**上游参考**：[scaffold/](https://github.com/dyad-sh/dyad/tree/main/scaffold) 与 [src/ipc/handlers/createFromTemplate.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/createFromTemplate.ts)

#### 验收标准 (AC)

```yaml
- id: v1.REQ-001-AC-001
  ears: >
    When the user requests to create a new application,
    the App Service shall copy the complete scaffold directory to the designated app folder and initialize an empty Git repository with an initial commit.
  test_type: Unit
  expected:
    target_files_exist:
      - "package.json"
      - "vite.config.ts"
      - "src/App.tsx"
      - "src/pages/Index.tsx"
      - "src/components/ui/button.tsx"
      - "AI_RULES.md"
    git_status: "clean"

- id: v1.REQ-001-AC-002
  ears: >
    When scaffold copying completes,
    the App Service shall insert an app record into the local SQLite database containing id, name, slug, and full filesystem path.
  test_type: Integration
  expected:
    database_query: "SELECT id, name, path FROM apps WHERE id = :appId"
    record_status: "exists"
```

---

### 需求 v1.REQ-002 · 需求澄清问卷与应用蓝图前置审批门禁

**用户故事**：作为用户，我希望 AI 在动手编写复杂代码前先向我确认关键产品细节并生成蓝图，以防因理解偏差导致架构做废。  
**上游参考**：[src/ipc/handlers/app_blueprint_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/app_blueprint_handlers.ts) 与 [src/pro/main/ipc/handlers/local_agent/tools/write_app_blueprint.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/write_app_blueprint.ts)

#### 验收标准 (AC)

```yaml
- id: v1.REQ-002-AC-001
  ears: >
    While an unapproved blueprint does not exist for a newly initiated chat,
    when the agent receives the initial prompt,
    the agent shall invoke planning_questionnaire with 1 to 5 focused questions before calling any file-writing tools.
  test_type: Unit
  expected:
    tool_call: "planning_questionnaire"
    arguments_schema:
      questions: "array of objects with question, type, and options"

- id: v1.REQ-002-AC-002
  ears: >
    When questionnaire answers are submitted,
    the agent shall call write_app_blueprint to generate appName, designDirection, primaryColor, and visuals list, and immediately suspend execution awaiting user approval.
  test_type: Integration
  expected:
    event_emitted: "app-blueprint:update"
    turn_state: "paused_waiting_approval"
    state_mutating_tools_blocked: true

- id: v1.REQ-002-AC-003
  ears: >
    When the user clicks approve on the blueprint UI card,
    the main process shall mark the blueprint as approved and dispatch an approved notification into the chat stream to resume code implementation.
  test_type: E2E
  expected:
    blueprint_approved: true
    subsequent_tool_unlocked: "write_file"
```

---

### 需求 v1.REQ-003 · 多 Agent 协同流式代码生成与零占位符保障

**用户故事**：作为用户，我希望生成的代码必须全功能可用，严禁 `// TODO` 或未完成逻辑，并且具备自动补全依赖的能力。  
**上游参考**：[src/prompts/local_agent_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/local_agent_prompt.ts) 与 [src/pro/main/ipc/handlers/local_agent/tools/subagent_tools.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/subagent_tools.ts)

#### 验收标准 (AC)

```yaml
- id: v1.REQ-003-AC-001
  ears: >
    When the agent generates or updates code files,
    the agent shall emit structured XML tags <dyad-write path="..."> containing complete, fully functional source code without placeholder comments.
  test_type: Unit
  expected:
    content_pattern: "no '// TODO' or '/* implement */'"
    file_written: true

- id: v1.REQ-003-AC-002
  ears: >
    When newly written code imports a third-party npm package that is absent in package.json,
    the agent shall invoke add_dependency to automatically install the target package.
  test_type: Integration
  expected:
    package_json_updated: true
    dependency_installed: true
```

---

### 需求 v1.REQ-004 · TypeScript 静态类型闭环自愈验证

**用户故事**：作为开发者，我希望系统在代码写完后自动执行类型检查，一旦发现错误能够让 AI 立即自动修复，保证交付无语法错误。  
**上游参考**：[src/pro/main/ipc/handlers/local_agent/tools/run_type_checks.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/run_type_checks.ts) 与 [src/ipc/handlers/problems_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/problems_handlers.ts)

#### 验收标准 (AC)

```yaml
- id: v1.REQ-004-AC-001
  ears: >
    When code edits in a writable turn are finished,
    the agent shall execute run_type_checks against the workspace.
  test_type: Integration
  expected:
    tsc_process_executed: true
    diagnostics_parsed: "file, line, column, message"

- id: v1.REQ-004-AC-002
  ears: >
    While run_type_checks reports compilation errors,
    the system shall feed the formatted error list back to the agent for remediation until zero errors remain or the turn limit is reached.
  test_type: Integration
  expected:
    error_feedback_delivered: true
    remediation_attempted: true
```

---

### 需求 v1.REQ-005 · Git Worktree 隔离快照生产打包验证

**用户故事**：作为用户，我希望在部署或完成重大变更时，系统能在独立沙箱中测试真正的生产环境构建，确保上线不会暴雷。  
**上游参考**：[src/pro/main/ipc/handlers/local_agent/tools/run_build.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/run_build.ts) 与 [src/ipc/services/git_overlay_workspace.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/services/git_overlay_workspace.ts)

#### 验收标准 (AC)

```yaml
- id: v1.REQ-005-AC-001
  ears: >
    When run_build is triggered,
    the Build Service shall create a temporary detached Git worktree with overlay from current workspace, excluding live node_modules, and execute npm run build inside it.
  test_type: Integration
  expected:
    worktree_path_pattern: "^.dyad-build-[A-Za-z0-9]{6}$"
    main_workspace_untouched: true
    build_exit_code_captured: true
```

---

### 需求 v1.REQ-006 · 本地开发服务器监管与动态实时预览

**用户故事**：作为用户，我希望在窗口右侧实时看到应用的动态渲染效果，并支持修改热重载与界面元素反查。  
**上游参考**：[src/app_run/definition.ts](https://github.com/dyad-sh/dyad/blob/main/src/app_run/definition.ts) 与 [src/preview_iframe/controller.ts](https://github.com/dyad-sh/dyad/blob/main/src/preview_iframe/controller.ts)

#### 验收标准 (AC)

```yaml
- id: v1.REQ-006-AC-001
  ears: >
    When an app is selected in the UI,
    the App Run Actor shall spawn the local Vite development server on a free port and proxy it to the preview iframe.
  test_type: E2E
  expected:
    server_process_active: true
    iframe_src_loaded: true

- id: v1.REQ-006-AC-002
  ears: >
    While the preview iframe is running,
    any uncaught runtime exceptions or console errors shall be streamed to preview_console for inspection.
  test_type: Integration
  expected:
    console_event_forwarded: true
```

---

### 需求 v1.REQ-007 · 版本控制与 Turn-Level 自动 Git 提交

**用户故事**：作为用户，我希望 AI 的每一次写操作都能生成独立的 Git 提交，以便我随时对比代码 Diff 或回退到历史版本。  
**上游参考**：[src/ipc/services/git_service.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/services/git_service.ts) 与 [src/ipc/handlers/chat_stream_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/chat_stream_handlers.ts)

#### 验收标准 (AC)

```yaml
- id: v1.REQ-007-AC-001
  ears: >
    When a writable agent turn concludes successfully,
    the Git Service shall automatically stage all workspace file modifications and create a new Git commit.
  test_type: Integration
  expected:
    git_commit_created: true
    commit_hash_persisted: true
```
