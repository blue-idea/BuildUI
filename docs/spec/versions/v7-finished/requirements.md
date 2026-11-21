# 需求文档（Requirements）

> 文件路径：`docs/spec/versions/v7/requirements.md`  
> 规范版本：v7 · 日期：2026-11-21  
> 状态：已定稿（finalized）  
> 关联版本索引：[docs/spec/README.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/README.md)  
> 核心宪法继承：[docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 介绍

Blot-UI 在 v6 实现了 macOS 三栏式容器美学与中英双语引擎，并在主界面底部集成了初步模型选择交互。然而，当前系统仅支持单一全局服务商凭证存储，无法同时保存多个主流服务商（如 OpenAI、DeepSeek、Ollama 等）的配置，且输入框模型选择列表无法动态切换至不同已配置服务商。

**v7 版本核心目标**：实现多模型服务商增强（Multi-Provider LLM Suite），包括：
1. **多 Provider 配置持久化与独立凭证管理**：支持用户在设置中心同时配置并保存多家服务商（OpenAI、DeepSeek、Ollama、自定义端点）的 Base URL、API Key 与默认模型；
2. **模型选择框全量联动与快捷入口**：底部 `ModelSelector` 动态列出所有已配置服务商及其可用模型，默认 `Auto`，支持一键快捷跳转偏好设置；
3. **模型动态拉取与流式会话定向调度**：支持对 Ollama 等端点动态获取模型列表；并在会话生成时支持根据前端选择动态定向分发至指定 Provider。

---

## 需求列表

---

### 需求 v7.REQ-001 · 多模型服务商独立持久化配置与管理

**用户故事：** 作为开发者，我希望在偏好设置中同时持久化保存多个模型服务商（OpenAI、DeepSeek、Ollama、Custom）的独立配置，以便无需反复切换修改端点与密钥。

#### 验收标准

```yaml
- id: v7.REQ-001-AC-001
  ears: >
    When the user saves configurations for multiple providers,
    the SettingsService shall persist each provider's baseURL, apiKey, and model independently using provider-prefixed keys in SQLite without overwriting other providers.
  test_type: Unit
  expected:
    return_value: "nil"
    throws: null
    side_effects:
      - "SQLite settings 表中按 llm.providers.<provider>.base_url, llm.providers.<provider>.api_key, llm.providers.<provider>.model 隔离存储"
      - "保留 llm.active_provider 记录当前选中的活跃服务商"

- id: v7.REQ-001-AC-002
  ears: >
    When the user opens the Settings modal and selects different provider tabs,
    the SettingsModal shall display and edit the corresponding saved credentials for the selected provider and support independent connection testing.
  test_type: UI
  expected:
    ui_state: "Provider 选项卡切换时表单数据联动展示对应已存配置，测试连接针对当前所选提供商独立校验"
    side_effects: []
```

---

### 需求 v7.REQ-002 · 输入框模型选择器支持多已配置服务商与快捷配置入口

**用户故事：** 作为使用者，我希望在聊天输入框底部的模型选择下拉框中，清晰看到所有已配置好凭证的服务商及其模型，并能一键打开设置弹窗，以便在编写代码时自由选择不同模型。

#### 验收标准

```yaml
- id: v7.REQ-002-AC-001
  ears: >
    When the user opens the ModelSelector dropdown in the chat input toolbar,
    the ModelSelector shall display the default Auto option, all configured providers with valid credentials, and an action button to open Settings.
  test_type: Unit
  expected:
    return_value: "Array of ModelOptions containing auto, configured providers, and open_settings action"
    throws: null
    side_effects: []

- id: v7.REQ-002-AC-002
  ears: >
    While the ModelSelector dropdown is open,
    when the user clicks the 'Manage Providers...' action or selects a specific configured provider,
    the system shall either open the Settings modal or update the selected active provider state.
  test_type: E2E
  expected:
    ui_state: "点击管理服务商时 SettingsModal 弹窗显现；点击具体服务商时模型选择框展示选中的模型名称"
    side_effects: []
```

---

### 需求 v7.REQ-003 · 模型列表动态拉取与会话定向流式分发

**用户故事：** 作为开发者，我希望系统支持获取本地 Ollama 或远端端点的模型列表，并在发送会话时支持按选择的 Provider 发起流式请求，以便精准发挥不同模型的长处。

#### 验收标准

```yaml
- id: v7.REQ-003-AC-001
  ears: >
    When requested to list models for a given provider,
    the ProviderService shall query the provider's models endpoint (such as Ollama /api/tags or OpenAI /v1/models) and return the list of model identifiers, falling back to default presets on failure.
  test_type: API
  expected:
    http_status: 200
    body_schema:
      models: "[]string, non-empty list of model names"
    side_effects: []

- id: v7.REQ-003-AC-002
  ears: >
    When StreamChat receives a request with an explicit provider and model specified,
    the ChatService shall initialize the client using that provider's saved credentials and execute the streaming turn accordingly.
  test_type: Integration
  expected:
    http_status: 200
    body_schema:
      status: "string, completed"
    side_effects:
      - "使用指定 provider 对应的 Base URL 与 API Key 建立流式连接"
      - "若请求为 auto 或未指定，平稳回退至默认 active provider 发起对话"
```
