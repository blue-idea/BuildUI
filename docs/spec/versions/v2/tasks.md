# 实施任务清单（Tasks）· Blot-UI v2

> 文件路径：`docs/spec/versions/v2/tasks.md`  
> 规范版本：v2 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项高内聚交付任务）  
> 架构基准：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 任务拆解一览

| 任务编号 | 任务名称 | 依赖关系 | 对应需求 | 预计产出 / 交付模块 |
| :--- | :--- | :---: | :---: | :--- |
| **TASK-009** | LLM Provider 抽象层、OpenAI 兼容流式客户端与配置中心（Settings） | 无 | `v2.REQ-001` | `internal/llm`, `internal/settings`, `SettingsModal.tsx` |
| **TASK-010** | 多轮会话上下文组装、增量 Prompt 裁剪与流式生成中断控制 | TASK-009 | `v2.REQ-002` | `internal/agent`, `App.tsx` 多轮会话与 Stop 按钮 |
| **TASK-011** | Git 版本快照时光机、代码 Diff 提取与一键工作区安全回滚 | TASK-010 | `v2.REQ-003` | `internal/version`, `VersionTimelineModal.tsx`, `DiffViewer.tsx` |
| **TASK-012** | Wails 原生桌面增强与 v2 全流程 Playwright E2E 验证 | TASK-009 ~ TASK-011 | `v2.REQ-004` | `app.go`, `e2e/v2-workflow.spec.ts`, 验收报告 |

---

## 详细任务定义

### TASK-009 · LLM Provider 抽象层、OpenAI 兼容流式客户端与配置中心（Settings）

> 依赖：无  
> 官方源码参考：[src/ipc/handlers/settings_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/settings_handlers.ts) 与 [src/pro/main/ipc/handlers/local_agent/tools/chat.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/chat.ts)

- [x] 在 `internal/db` 中创建 `settings` 表与 `SettingsRepository`，支持键值对存储与更新
- [x] 在 `internal/llm` 中定义 `Provider` 抽象接口，实现统一的 OpenAI-compatible SSE 流式 HTTP 客户端
- [x] 实现连通性测试接口（`TestConnection`），对网络异常、认证失败（401/403）和限流（429）输出结构化 `BlotError`
- [x] 在前端实现 `SettingsModal.tsx`，支持配置 Base URL、API Key、Model Name 并提供连通性测试与保存反馈

**验证方式：**
```bash
go test -v -race ./internal/llm/... ./internal/settings/...
cd frontend && pnpm test -- SettingsModal
```

**验收证据：** 单元测试通过，在前端配置并保存后持久化至 SQLite，能够成功通过连通性测试（详见 `docs/spec/versions/v2/ac/TASK-009-AC.md`）。  
_需求:_ `requirements.md` 中 `v2.REQ-001`  
_验收标准:_ `v2.REQ-001-AC-001`, `v2.REQ-001-AC-002`  
_测试类型:_ Unit / Integration

---

### TASK-010 · 多轮会话上下文组装、增量 Prompt 裁剪与流式生成中断控制

> 依赖：TASK-009  
> 官方源码参考：[src/prompts/local_agent_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/local_agent_prompt.ts)

- [x] 扩展 `PromptAssembler`：读取完整的历史聊天记录，自动扫描应用目录结构并组装应用紧凑文件树
- [x] 升级 `ChatService.SendMessage`：接入真实/模拟 `LLMProvider` 流式输出，绑定可取消的 `context.Context`
- [x] 增加 `ChatService.CancelChat`：在流式生成中随时触发 Context Cancel 信号，终止网络读取并保持工作区整洁
- [x] 前端对话框增加多轮消息连续渲染，并在生成过程中展示动态“Stop Generation”按钮

**验证方式：**
```bash
go test -v -race ./internal/agent/...
cd frontend && pnpm test -- Chat
```

**验收证据：** 能够执行多轮对话且 Agent 感知已有文件树；点击 Stop 能够迅速取消生成并恢复就绪状态（详见 `docs/spec/versions/v2/ac/TASK-010-AC.md`）。  
_需求:_ `requirements.md` 中 `v2.REQ-002`  
_验收标准:_ `v2.REQ-002-AC-001`, `v2.REQ-002-AC-002`  
_测试类型:_ Integration / Unit

---

### TASK-011 · Git 版本快照时光机、代码 Diff 提取与一键工作区安全回滚

> 依赖：TASK-010  
> 官方源码参考：[src/ipc/services/git_service.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/services/git_service.ts)

- [x] 实现 `VersionService.ListVersions`：从 SQLite `versions` 表读取版本时间线与 Commit Hash 列表
- [x] 实现 `VersionService.GetDiff`：调用 `git diff` 解析改动文件与增删代码行，输出高亮 Diff 数据结构
- [x] 实现 `VersionService.Rollback`：安全回滚至指定 Commit，并在回滚后通知 Vite 开发服务器重载
- [x] 在前端构建 `VersionTimelineModal.tsx` 与 `DiffViewer.tsx`：直观展示版本列表、文件树改动与 Diff 对比，提供“Rollback”按钮

**验证方式：**
```bash
go test -v -race ./internal/version/...
cd frontend && pnpm test -- DiffViewer
```

**验收证据：** 能够正确解析 Git 提交差异行，点击回滚后工作区代码与前端预览无缝同步回退（详见 `docs/spec/versions/v2/ac/TASK-011-AC.md`）。  
_需求:_ `requirements.md` 中 `v2.REQ-003`  
_验收标准:_ `v2.REQ-003-AC-001`, `v2.REQ-003-AC-002`  
_测试类型:_ Integration / Unit

---

### TASK-012 · Wails 原生桌面增强与 v2 全流程 Playwright E2E 验证

> 依赖：TASK-009 ~ TASK-011  
> 官方源码参考：[src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts)

- [ ] 集成 Wails 原生系统目录选择器与桌面应用事件绑定
- [ ] 编写 Playwright E2E 自动化测试用例 `e2e/v2-workflow.spec.ts`，覆盖：
  1. 打开设置面板并配置 LLM Provider；
  2. 连续两轮应用生成会话，验证多轮增量修改；
  3. 打开版本历史面板查看代码 Diff，并执行一键回滚；
  4. 截取并留存关键步骤高保真视觉验收截图。
- [ ] 编写 `docs/spec/versions/v2/ac/TASK-012-AC.md` 与 `v2-final-report.md`，执行全量回归。

**验证方式：**
```bash
pnpm exec playwright test
go test -v -race -count=1 ./...
```

**验收证据：** Playwright E2E 测试全绿通过，产出全流程截图证据。  
_需求:_ `requirements.md` 中 `v2.REQ-004`  
_验收标准:_ `v2.REQ-004-AC-001`, `v2.REQ-004-AC-002`  
_测试类型:_ E2E / Visual Regression
