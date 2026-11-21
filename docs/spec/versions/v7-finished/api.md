# 接口契约（API Contract）· Blot-UI v7

> 文件路径：`docs/spec/versions/v7/api.md`  
> 规范版本：v7 · 日期：2026-11-21  
> 状态：已定稿（finalized）  
> 选型基准：Wails IPC (Go / TypeScript) + React Component Props  

---

## 1. Wails IPC 后端接口契约 (Go)

### 1.1 `ListProviderModels` 动态模型列表拉取

- **所在结构**：`App` / `SettingsService`
- **签名**：`ListProviderModels(provider string, baseURL string, apiKey string) ([]string, error)`
- **逻辑行为**：
  - 若 `provider == "ollama"`：向 `${baseURL}/api/tags`（或兼容路径）发起 HTTP GET 请求，提取模型 `name` 列表；
  - 若 `provider == "openai" | "deepseek" | "custom"`：向 `${baseURL}/models` 发起带有 `Authorization: Bearer <apiKey>` 头的 GET 请求，提取 `data[].id` 列表；
  - 若网络不可达、鉴权失败或返回异常：返回预设模型列表（如 OpenAI 返回 `["gpt-4o", "gpt-4o-mini"]`；DeepSeek 返回 `["deepseek-chat", "deepseek-coder"]`；Ollama 返回 `["qwen2.5-coder", "llama3"]`），不直接中断流程。

### 1.2 `StreamChat` 定向流式调度扩展

- **请求体类型扩展** (`internal/agent/service.go`):
  ```go
  type StreamChatRequest struct {
      ChatID      int64    `json:"chatId"`
      Prompt      string   `json:"prompt"`
      Attachments []string `json:"attachments"`
      Mode        string   `json:"mode"`
      Provider    string   `json:"provider,omitempty"` // 显式指定服务商，或 "auto"
      Model       string   `json:"model,omitempty"`    // 显式指定调用的模型名称
  }
  ```
- **分发规则**：
  - 当 `req.Provider` 存在且非 `"auto"` 时，优先从 Settings 中读取 `llm.providers.<provider>.*` 凭据发起请求；
  - 当未指定或为 `"auto"` 时，平稳回退至 `llm.active_provider` 及其对应配置。

---

## 2. 前端组件契约 (React & TypeScript)

### 2.1 `SettingsModal` 契约增强

```typescript
export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings?: Record<string, string>;
  onSave?: (settings: Record<string, string>) => Promise<void> | void;
  onTestConnection?: (baseURL: string, apiKey: string, model string) => Promise<string | boolean>;
  onFetchModels?: (provider: string, baseURL: string, apiKey: string) => Promise<string[]>;
}
```

### 2.2 `ModelSelector` 契约

```typescript
export interface ModelSelectorProps {
  /** 当前选中的标识：'auto' 或 'openai:gpt-4o' 等 */
  value: string;
  /** 选择变更回调 */
  onChange: (value: string) => void;
  /** 全部系统设置字典，用于解析所有 provider 状态 */
  settings?: Record<string, string>;
  /** 点击管理服务商回调 */
  onOpenSettings?: () => void;
  /** 额外的样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}
```
