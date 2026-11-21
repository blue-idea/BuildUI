# 实施计划（Tasks）· Blot-UI v7

> 文件路径：`docs/spec/versions/v7/tasks.md`  
> 规范版本：v7 · 日期：2026-11-21  

执行时须严格遵循 [docs/spec/versions/v7/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v7/requirements.md) 中对应需求的验收标准。
每项任务通过 `_需求:` 引用相关需求与 AC 编号，通过 `_测试类型:` 关联 QA 执行策略。

---

## 任务清单

---

- [x] **TASK-029 · 后端多服务商凭证隔离持久化与模型拉取服务**

  > 依赖：无

  - [x] 在 `internal/settings/service.go` 中实现针对 `llm.providers.<provider>.*` 的按 Provider 读取、更新与向后兼容回退逻辑
  - [x] 在 `internal/settings/service.go` 中实现 `ListProviderModels` 方法，支持查询指定 Provider 端点模型（针对 Ollama 访问 `/api/tags`，针对 OpenAI/兼容服务商访问 `/models`，支持优雅降级回退预设）
  - [x] 在 `app.go` 中暴露 `ListProviderModels(provider, baseURL, apiKey string) ([]string, error)` 供 Wails IPC 调用
  - [x] 编写并执行单元测试 `internal/settings/service_test.go` 与 `app_test.go`

  **验证方式：**
  ```bash
  go test -v ./internal/settings/... -run TestSettingsService
  ```

  **验收证据：** 单元测试通过，日志显示多 Provider 配置隔离写入 SQLite 且 Ollama/OpenAI 模型拉取或降级正确。

  _需求: `requirements.md` 中 `v7.REQ-001`, `v7.REQ-003`  
  验收标准：`v7.REQ-001-AC-001`, `v7.REQ-003-AC-001`  
  _测试类型: Unit, API

---

- [x] **TASK-030 · 后端 StreamChat 支持按请求指定 Provider 与 Model 流式定向调用**

  > 依赖：TASK-029

  - [x] 在 `internal/agent/service.go` 中为 `StreamChatRequest` 扩展 `Provider` 与 `Model` 字段
  - [x] 在 `internal/agent/model_chat.go` 中解析指定 Provider 与 Model，若未指定或为 `"auto"`，回退至 `llm.active_provider`
  - [x] 根据提取的端点、密钥与模型实例化客户端并发起流式交互
  - [x] 编写并执行测试 `internal/agent/service_test.go`，覆盖显式 Provider 与 Auto 回退逻辑

  **验证方式：**
  ```bash
  go test -v -run TestStreamChat ./internal/agent/...
  ```

  **验收证据：** 能够按请求中指定的 Provider/Model 成功发起会话，并在未配置或 auto 时平稳降级至活跃服务商。

  _需求: `requirements.md` 中 `v7.REQ-003`  
  验收标准：`v7.REQ-003-AC-002`  
  _测试类型: Integration

---

- [x] **TASK-031 · 前端 SettingsModal 支持多服务商 Tabs 独立配置、连接测试与统一持久化**

  > 依赖：TASK-029

  - [x] 重构 `frontend/src/components/SettingsModal.tsx`，顶部添加 Provider Tabs（OpenAI、DeepSeek、Ollama、Custom）
  - [x] 选项卡切换时表单数据联动展示对应已存凭证，测试连接针对当前所选提供商独立校验
  - [x] 保存时将所有已配置 Provider 的键值按 `llm.providers.<provider>.*` 规范持久化，并标记 `llm.active_provider`
  - [x] 编写并执行测试 `frontend/src/components/SettingsModal.test.tsx`

  **验证方式：**
  ```bash
  pnpm --dir frontend test src/components/SettingsModal.test.tsx
  ```

  **验收证据：** 单元与交互测试全部通过，支持在不同 Provider 选项卡间平滑切换并独立保存。

  _需求: `requirements.md` 中 `v7.REQ-001`  
  验收标准：`v7.REQ-001-AC-002`  
  _测试类型: UI, Unit

---

- [x] **TASK-032 · 前端 ModelSelector 联动已配置 Provider、支持定向选择与管理入口**

  > 依赖：TASK-030, TASK-031

  - [x] 在 `frontend/src/components/ModelSelector.tsx` 中解析已配置服务商列表，展示 Auto、所有具备凭据的 Provider 选项及 Manage Providers 快捷按钮
  - [x] 在 `frontend/src/App.tsx` 中管理选中的 Provider/Model 状态并传递给 `StreamChat`
  - [x] 点击 Manage Providers 唤起 SettingsModal
  - [x] 编写组件测试 `frontend/src/components/ModelSelector.test.tsx` 并执行端到端测试与截图验收

  **验证方式：**
  ```bash
  pnpm --dir frontend test src/components/ModelSelector.test.tsx && pnpm --dir frontend test:e2e
  ```

  **验收证据：** 测试通过，Playwright 截图展示模型选择框包含 Auto、已配置服务商项与管理入口。

  _需求: `requirements.md` 中 `v7.REQ-002`  
  验收标准：`v7.REQ-002-AC-001`, `v7.REQ-002-AC-002`  
  _测试类型: Unit, E2E

---

## 进度汇总

| TASK ID | 名称 | 测试类型 | 状态 | 关联需求 |
|---------|------|:-------:|:----:|---------|
| TASK-029 | 后端多服务商凭证隔离持久化与模型拉取服务 | Unit, API | 🟩 完成 | v7.REQ-001, v7.REQ-003 |
| TASK-030 | 后端 StreamChat 支持按请求指定 Provider 与 Model 定向调用 | Integration | 🟩 完成 | v7.REQ-003 |
| TASK-031 | 前端 SettingsModal 支持多服务商 Tabs 独立配置、连接测试与统一持久化 | UI, Unit | 🟩 完成 | v7.REQ-001 |
| TASK-032 | 前端 ModelSelector 联动已配置 Provider、支持定向选择与管理入口 | Unit, E2E | 🟩 完成 | v7.REQ-002 |
