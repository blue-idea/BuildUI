# 数据契约（Data Contracts）· Blot-UI v7

> 文件路径：`docs/spec/versions/v7/data.md`  
> 规范版本：v7 · 日期：2026-11-21  
> 状态：已定稿（finalized）  
> 选型基准：SQLite settings 表 + TypeScript 强类型接口  

---

## 1. 存储契约（SQLite settings 表规约）

系统采用键值隔离前缀存储多个服务商配置，不改变原有 `settings (key TEXT PRIMARY KEY, value TEXT)` 表结构。

### 1.1 Key 规范列表

| Key 模版 | 说明 | 示例值 |
|---------|------|--------|
| `llm.active_provider` | 当前全局默认活跃服务商标识 | `"openai"` / `"deepseek"` / `"ollama"` / `"custom"` |
| `llm.providers.<provider>.base_url` | 对应服务商的 API 端点地址 | `"https://api.deepseek.com/v1"` |
| `llm.providers.<provider>.api_key` | 对应服务商的鉴权密钥 | `"sk-..."`（本地隔离保存） |
| `llm.providers.<provider>.model` | 对应服务商默认使用的模型名称 | `"deepseek-chat"` |

### 1.2 向后兼容与回退规则（Backward Compatibility）

1. **读取回退**：若查询某 Provider（如 `openai`）的凭证时，未找到 `llm.providers.openai.*` 键值，系统将检测老旧全局键：
   - 若 `settings["llm.provider"] == "openai"`，则自动回退提取全局键 `llm.base_url`、`llm.api_key`、`llm.model`。
2. **保存双轨**：在用户保存当前活跃 Provider 时，系统将同时更新 `llm.providers.<provider>.*` 与旧版 `llm.provider` / `llm.base_url` / `llm.api_key` / `llm.model`，确保旧模块不受破坏。

---

## 2. 前端 TypeScript 类型定义

在 `frontend/src/types/provider.ts` 中提供统一契约：

```typescript
/** 支持的主流服务商标识 */
export type ProviderType = 'openai' | 'deepseek' | 'ollama' | 'custom';

/** 单一服务商凭证与配置 */
export interface ProviderCredentials {
  baseURL: string;
  apiKey: string;
  model: string;
}

/** 多服务商持久化映射 */
export type ProviderSettingsMap = Record<string, string>;

/** 下拉模型选择器中展示的选项项 */
export interface ModelOptionItem {
  id: string;             // 选项唯一值：'auto' 或 'provider:openai' 或 'provider:deepseek'
  provider: string;       // 所属服务商标识（如 'openai', 'deepseek'）
  modelName: string;      // 显示或调用的模型名称
  label: string;          // 展示标题
  isConfigured: boolean;  // 是否具备可用凭证
}
```
