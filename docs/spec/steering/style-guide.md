# 项目级恒定规则 · 编码与风格指南 (style-guide)

> 文件路径：`docs/spec/steering/style-guide.md`  
> 适用范围：Go 后端与 React 前端命名、错误分类、Wails 绑定与事件协议、流式 XML 标记规范。  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 命名与目录规范

1. **Go 后端命名**：
   - 文件名：统一使用小写下划线 `snake_case.go`（测试文件为 `snake_case_test.go`）。
   - 包名：单数、小写、无下划线（如 `package app`、`package agent`、`package db`、`package service`）。
   - 结构体与导出方法：PascalCase（如 `AppService`、`CreateApp`、`StreamChat`）；未导出方法与私有字段采用 camelCase。
2. **React 前端命名**：
   - 组件与页面：PascalCase（如 `ChatInput.tsx`、`PreviewPanel.tsx`、`BlueprintCard.tsx`）。
   - 工具函数与 Hook：camelCase（如 `useAppList.ts`、`formatDuration.ts`）。
   - 测试文件：`*.test.tsx`、`*.test.ts`。
3. **Wails 通信规范**：
   - 绑定服务方法：前端通过自动生成的 `wailsjs/go/<package>/<Service>` 直接调用强类型方法（如 `AppService.CreateApp(request)`）。
   - 运行时事件命名：`<domain>:<action>`（如 `chat:chunk`、`chat:tool-start`、`chat:end`、`chat:error`）。

---

## 2. 错误处理与分类（BlotError 规范）

所有 Go 业务逻辑与 Wails 暴露方法中抛出的错误，**严禁返回裸字符串**，统一包装为结构化错误：

```go
type ErrorKind string

const (
    KindValidation   ErrorKind = "Validation"
    KindNotFound     ErrorKind = "NotFound"
    KindPrecondition ErrorKind = "Precondition"
    KindExternal     ErrorKind = "External"
    KindInternal     ErrorKind = "Internal"
)

type BlotError struct {
    Kind    ErrorKind `json:"kind"`
    Message string    `json:"message"`
    Cause   error     `json:"-"`
}

func (e *BlotError) Error() string {
    return fmt.Sprintf("[%s] %s", e.Kind, e.Message)
}
```

### 错误类型分类矩阵

| ErrorKind | 触发场景 | 处理策略 |
| :--- | :--- | :--- |
| `Validation` | 入参校验失败、路径不合法、配置项缺失 | 拦截并回传给前端显示表单或交互提示 |
| `NotFound` | 应用记录、会话 ID、指定代码文件不存在 | 返回 404 语义并引导用户重新选择 |
| `Precondition` | 缺少 Node/pnpm 环境、端口占用、Git 工作区脏 | 返回明确的修复提示（如提示运行环境配置） |
| `External` | 大模型 API 超额/拒绝、网络超时、第三方服务异常 | 隔离外部影响，提示用户重试或检查配置 |
| `Internal` | 状态机崩溃、数据库不可逆故障、未捕获 panic | 记录结构化日志至日志文件并返回通用降级提示 |

---

## 3. 日志规范（Go log/slog）

后端模块统一使用 Go `log/slog` 结构化日志，通过 `With("module", "...")` 区分模块域：

```go
logger := slog.Default().With("module", "app_service")
logger.Info("initializing app from scaffold", "app_id", req.AppID, "path", targetPath)
logger.Error("failed to compile worktree build", "error", err)
```

---

## 4. Agent XML 流式标记规范

大模型与 Go 后端之间通过结构化 XML Tag 传递代码操作动作：

| 标记 | 属性/参数 | 作用说明 |
| :--- | :--- | :--- |
| `<dyad-write path="...">` | `path`, `description` | 写入或全量更新指定文件 |
| `<dyad-rename from="..." to="...">` | `from`, `to` | 重命名文件或目录 |
| `<dyad-delete path="...">` | `path` | 删除指定文件 |
| `<dyad-add-dependency packages="...">` | `packages` (空格隔开) | 在目标应用执行 `pnpm add` 安装依赖 |
| `<dyad-command type="...">` | `type="rebuild\|restart\|refresh"` | 建议触发客户端热重载或重启 |
| `<dyad-status title="..." state="...">` | `title`, `state="finished\|warning"` | 呈现构建或检查步骤状态指示条 |
| `<dyad-chat-summary>` | 文本内容 | 设置单行精炼的对话会话标题 |
| `<dyad-suggested-prompts>` | 多行文本 | 会话完成后的快捷下一步推荐 Prompt |
