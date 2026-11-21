# 架构与系统设计说明书（Design）· Blot-UI v2

> 文件路径：`docs/spec/versions/v2/design.md`  
> 规范版本：v2 · 日期：2026-11-21  
> 状态：就绪（已通过 STEP 4 审查）  
> 选型基准：Wails v2 + React 19 + TypeScript + Go 1.26 + SQLite + Git CLI  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 架构演进全景

```mermaid
graph TD
    subgraph Frontend [React 19 + TypeScript 前端]
        AppUI[App.tsx 主界面]
        SettingsUI[SettingsModal 设置面板]
        DiffUI[DiffViewer & VersionTimeline 版本时光机]
        ChatUI[Chat 流式交互区 & Stop 按钮]
        PreviewUI[PreviewPanel 实时 Iframe]
    end

    subgraph WailsBridge [Wails IPC 桥接层]
        AppBindings[app.go / Wails 导出方法]
        EventBus[runtime.EventsEmit / EventsOn]
    end

    subgraph BackendCore [Go 后端核心微服务]
        SettingsSvc[internal/settings / SettingsService]
        LLMProvider[internal/llm / OpenAICompatibleClient]
        AgentSvc[internal/agent / ChatService & PromptAssembler]
        VersionSvc[internal/version / VersionTimeMachine]
        AppRunner[internal/app/runner / DevServerSupervisor]
        Storage[internal/db / SQLite (versions, settings, chats)]
    end

    AppUI --> SettingsUI
    AppUI --> DiffUI
    AppUI --> ChatUI
    AppUI --> PreviewUI

    SettingsUI --> AppBindings
    DiffUI --> AppBindings
    ChatUI --> AppBindings

    AppBindings --> SettingsSvc
    AppBindings --> AgentSvc
    AppBindings --> VersionSvc

    AgentSvc --> LLMProvider
    AgentSvc --> VersionSvc
    AgentSvc --> EventBus
    VersionSvc --> AppRunner
    VersionSvc --> Storage
    SettingsSvc --> Storage
```

---

## 2. 核心模块详细设计

### 2.1 LLM 抽象层与 OpenAI 兼容流式客户端 (`internal/llm`)

为支持 OpenAI, DeepSeek, Anthropic, Gemini 以及 Ollama，设计统一流式接口：

```go
type StreamChunkHandler func(contentChunk string) error

type ChatMessage struct {
    Role    string `json:"role"`    // system, user, assistant
    Content string `json:"content"`
}

type ChatRequest struct {
    Model       string        `json:"model"`
    Messages    []ChatMessage `json:"messages"`
    Temperature float64       `json:"temperature"`
    MaxTokens   int           `json:"max_tokens,omitempty"`
}

type Provider interface {
    StreamChat(ctx context.Context, req ChatRequest, onChunk StreamChunkHandler) error
    TestConnection(ctx context.Context) error
}
```

- **OpenAI 兼容客户端**：通过 HTTP POST 发送 `stream: true` 请求，解析 `text/event-stream` SSE 响应格式（`data: {"choices":[{"delta":{"content":"..."}}]}`）；
- 当读取到 `data: [DONE]` 时优雅结束；
- 结合传入的 `ctx context.Context`，在收到取消信号时立即关闭底层 HTTP 连接，终止流式传输。

### 2.2 配置中心与持久化存储 (`internal/settings`)

在 SQLite 中增加 `settings` 表：

```sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- **预置配置键**：
  - `llm.provider`: `openai` / `deepseek` / `ollama` / `custom`
  - `llm.base_url`: 例如 `https://api.openai.com/v1` 或 `http://localhost:11434/v1`
  - `llm.api_key`: 用户的密钥令牌
  - `llm.model`: 例如 `gpt-4o`, `deepseek-chat`, `qwen2.5-coder`
- 提供 `GetSettings(ctx)` 与 `UpdateSettings(ctx, key, value)` 接口，前端启动时自动读取，支持一键连通性测试。

### 2.3 版本快照时光机与可视化 Diff (`internal/version`)

基于已有的 SQLite `versions` 表与 Git 底层机制：

1. **版本列表查询 (`ListVersions`)**：
   - 查询指定 `app_id` 下的所有提交记录（Commit Hash、提交信息、创建时间）。
2. **代码 Diff 提取 (`GetCommitDiff`)**：
   - 执行 `git diff <commitHash>~1 <commitHash>` 或 `git show <commitHash> --patch`；
   - 解析统一 Diff 格式，输出文件改动列表（新增、修改、删除及差异行代码段）。
3. **安全回滚 (`Rollback`)**：
   - 执行 `git checkout <commitHash> -- .` 并生成新的回滚提交，或执行 `git reset --hard <commitHash>`；
   - 触发 Vite 开发服务器文件重载，并在前端 PreviewPanel 同步呈现。

### 2.4 多轮会话上下文组装与动态裁剪

在 `internal/agent/prompt_assembler.go` 中升级：
- `AssembleContextPrompt` 接收完整的历史会话列表（按时间正序排序）；
- 自动遍历子应用的工作区目录结构（过滤 `node_modules`、`.git`、`dist`），生成紧凑的文件树结构文本；
- 引导 Agent 进行精准增量改动（仅输出需要更新或新增的文件），保持生成的高效性。

---

## 3. Wails IPC 接口与前端契约

| 方法名 | 入参 | 返回值 | 说明 |
| :--- | :--- | :--- | :--- |
| `GetSettings` | 无 | `map[string]string` | 获取所有配置项 |
| `SaveSettings` | `settings map[string]string` | `error` | 保存用户配置项 |
| `TestLLMConnection` | `config SettingsConfig` | `error` | 测试配置的 LLM 端点连通性 |
| `GetVersions` | `appID int64` | `[]VersionDTO` | 获取应用的全部历史版本 |
| `GetVersionDiff` | `appID int64, commitHash string` | `DiffResultDTO` | 获取某版本的代码差异对比 |
| `RollbackVersion` | `appID int64, commitHash string` | `error` | 将应用回滚到指定版本 |
| `CancelCurrentChat` | `chatID int64` | `error` | 中止正在进行的流式生成 |

---

## 4. 安全、健壮性与可测试性考量

1. **配置安全性**：敏感的 API Key 仅保留在本地用户的 SQLite 数据库中，不向任何第三方上报；
2. **连接健壮性**：LLM HTTP 客户端配置严苛的超时机制（连接 10s，读取 60s），并在网络断开时向前端抛出结构化 `BlotError`；
3. **回滚安全性**：在回滚前自动对当前工作区脏代码执行快照暂存，防止误丢失未提交的开发代码；
4. **TDD 流程保障**：
   - Go 后端编写 Mock HTTP Server 模拟 SSE 响应、断网与超时状态，100% 覆盖流式解析器；
   - 前端编写 Vitest 单元测试覆盖 SettingsModal 与 DiffViewer；
   - Playwright E2E 测试运行真实多轮对话、中止操作与版本回滚，留存截图证据。
