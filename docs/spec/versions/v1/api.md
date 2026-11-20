# Wails 接口与通信契约说明书（API）· Blot-UI (Wails + React)

> 文件路径：`docs/spec/versions/v1/api.md`  
> 规范版本：v1 · 日期：2026-11-20  
> 关联设计：[design.md](design.md)  
> 核心架构：Wails v2 (Go 1.26+) + React 19 + TypeScript  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. Wails 通信架构概述

在 Wails 架构中，前后端通信分为两大核心路径：
1. **强类型 RPC 方法绑定（Go Bindings）**：
   Go 后端定义公开结构体（如 `AppService`、`BlueprintService`）并注册到 `wails.Run(&options.App{ Bind: ... })`。Wails 自动编译生成前端 TypeScript 客户端代码（位于 `frontend/wailsjs/go/<package>/<Service>`），前端直接以异步函数方式调用。
2. **双向运行时事件总线（Runtime Events）**：
   用于大模型流式 Token 推送、后台编译状态广播以及长任务进度通知。Go 后端调用 `runtime.EventsEmit(ctx, eventName, data)`，前端通过 `runtime.EventsOn(eventName, callback)` 监听。

---

## 2. Wails 服务方法契约（Go Service Bindings）

### 2.1 应用管理服务（`AppService`）

#### 1. 创建新应用 (`CreateApp`)
- **Go 方法签名**：
  ```go
  func (s *AppService) CreateApp(ctx context.Context, req CreateAppRequest) (*CreateAppResponse, error)
  ```
- **请求参数 (`CreateAppRequest`)**：
  ```go
  type CreateAppRequest struct {
      Name       string `json:"name"`       // 应用名称 (非空)
      TemplateID string `json:"templateId"` // 模板标识，默认 "react"
      CustomPath string `json:"customPath"` // 用户自定义路径 (可选)
  }
  ```
- **响应参数 (`CreateAppResponse`)**：
  ```go
  type CreateAppResponse struct {
      AppID             int64  `json:"appId"`
      Name              string `json:"name"`
      Path              string `json:"path"`
      InitialCommitHash string `json:"initialCommitHash"`
  }
  ```
- **错误类型**：若目标路径已被占用或脚手架复制失败，返回 `BlotError(KindPrecondition)`。

#### 2. 列出所有本地应用 (`ListApps`)
- **Go 方法签名**：
  ```go
  func (s *AppService) ListApps(ctx context.Context) ([]AppDTO, error)
  ```
- **响应参数 (`[]AppDTO`)**：
  ```go
  type AppDTO struct {
      ID                int64  `json:"id"`
      Name              string `json:"name"`
      Path              string `json:"path"`
      NeedsAppBlueprint bool   `json:"needsAppBlueprint"`
      TestingEnabled    bool   `json:"testingEnabled"`
      CreatedAt         int64  `json:"createdAt"`
  }
  ```

#### 3. 启动应用开发服务器 (`RunApp`)
- **Go 方法签名**：
  ```go
  func (s *AppService) RunApp(ctx context.Context, req RunAppRequest) (*RunAppResponse, error)
  ```
- **请求参数 (`RunAppRequest`)**：
  ```go
  type RunAppRequest struct {
      AppID int64 `json:"appId"`
  }
  ```
- **响应参数 (`RunAppResponse`)**：
  ```go
  type RunAppResponse struct {
      PreviewURL string `json:"previewUrl"` // 如 http://127.0.0.1:5173
      ProcessID  int    `json:"processId"`
      Status     string `json:"status"`     // "running" | "error"
  }
  ```

#### 4. 停止应用开发服务器 (`StopApp`)
- **Go 方法签名**：
  ```go
  func (s *AppService) StopApp(ctx context.Context, req StopAppRequest) error
  ```

---

### 2.2 蓝图前置审批服务（`BlueprintService`）

#### 1. 获取会话蓝图 (`GetBlueprint`)
- **Go 方法签名**：
  ```go
  func (s *BlueprintService) GetBlueprint(ctx context.Context, chatID int64) (*BlueprintDTO, error)
  ```
- **响应参数 (`BlueprintDTO`)**：
  ```go
  type VisualItem struct {
      ID          string `json:"id"`
      Type        string `json:"type"` // "logo" | "photo" | "illustration" | "icon" | "background"
      Description string `json:"description"`
      Prompt      string `json:"prompt"`
  }

  type BlueprintDTO struct {
      ChatID          int64        `json:"chatId"`
      AppName         string       `json:"appName"`
      DesignDirection string       `json:"designDirection"`
      PrimaryColor    string       `json:"primaryColor"`
      ThemeID         string       `json:"themeId"`
      Visuals         []VisualItem `json:"visuals"`
      Approved        bool         `json:"approved"`
  }
  ```

#### 2. 审批并锁定蓝图 (`ApproveBlueprint`)
- **Go 方法签名**：
  ```go
  func (s *BlueprintService) ApproveBlueprint(ctx context.Context, chatID int64) error
  ```
- **副作用**：将数据库 `apps.needs_app_blueprint` 置为 false，并在会话中解锁大模型代码写盘工具。

---

### 2.3 智能会话服务（`ChatService`）

#### 1. 发起会话流 (`StreamChat`)
- **Go 方法签名**：
  ```go
  func (s *ChatService) StreamChat(ctx context.Context, req StreamChatRequest) error
  ```
- **请求参数 (`StreamChatRequest`)**：
  ```go
  type StreamChatRequest struct {
      ChatID      int64    `json:"chatId"`
      Prompt      string   `json:"prompt"`
      Attachments []string `json:"attachments"`
  }
  ```
- **控制逻辑**：后端启动独立的 Goroutine 进行流式 LLM 调用与工具解析，通过 Wails 事件通道向前端实时推送流式数据。

#### 2. 中断会话流 (`AbortChat`)
- **Go 方法签名**：
  ```go
  func (s *ChatService) AbortChat(ctx context.Context, chatID int64) error
  ```

---

### 2.4 问题诊断与验证服务（`ProblemsService`）

#### 1. 触发 TypeScript 编译检查 (`CheckTypeScript`)
- **Go 方法签名**：
  ```go
  func (s *ProblemsService) CheckTypeScript(ctx context.Context, req CheckTypeScriptRequest) (*ProblemsResponse, error)
  ```
- **请求参数**：
  ```go
  type CheckTypeScriptRequest struct {
      AppID int64    `json:"appId"`
      Paths []string `json:"paths"` // 可选限定检查文件
  }
  ```
- **响应参数 (`ProblemsResponse`)**：
  ```go
  type DiagnosticItem struct {
      File     string `json:"file"`
      Line     int    `json:"line"`
      Column   int    `json:"column"`
      Message  string `json:"message"`
      Severity string `json:"severity"` // "error" | "warning"
  }

  type ProblemsResponse struct {
      HasErrors bool             `json:"hasErrors"`
      Problems  []DiagnosticItem `json:"problems"`
  }
  ```

---

## 3. Wails 运行时事件总线契约（Runtime Events）

前端通过 `runtime.EventsOn(eventName, callback)` 监听以下核心事件：

| 事件名称 | Payload 数据格式 | 说明 |
| :--- | :--- | :--- |
| `chat:chunk` | `{"chatId": 12, "chunk": "..."}` | 实时推送流式 Markdown 文本或 XML Token 片段 |
| `chat:questionnaire` | `{"chatId": 12, "questions": [...]}` | 推送产品需求澄清问卷（多选/单选/问答） |
| `app-blueprint:update` | `BlueprintDTO` | 推送生成的应用蓝图卡片数据 |
| `app-blueprint:approved` | `{"chatId": 12}` | 广播蓝图已获审批通过 |
| `chat:tool-start` | `{"chatId": 12, "tool": "write_file", "path": "src/App.tsx"}` | 声明 Agent 开始调用某项工具 |
| `chat:tool-end` | `{"chatId": 12, "tool": "write_file", "success": true}` | 声明工具执行完毕 |
| `chat:end` | `{"chatId": 12, "commitHash": "a1b2c3d"}` | 轮次正常结束，返回自动生成的 Git 提交哈希 |
| `chat:error` | `{"chatId": 12, "kind": "External", "message": "..."}` | 会话发生不可自愈异常时的错误回传 |
| `preview:console` | `{"appId": 1, "level": "error", "message": "..."}` | 转发 Preview Iframe 中的控制台输出 |
