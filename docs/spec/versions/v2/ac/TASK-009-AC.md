# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v2/ac/TASK-009-AC.md`  
> 任务编号：TASK-009  
> 关联需求：v2.REQ-001  
> 执行日期：2026-11-21  
> 执行人：AI Agent (Antigravity)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-009 | v2.REQ-001-AC-001 | Integration / Unit | SQLite 中创建 `settings` 表与 `SettingsRepository`；前端 `SettingsModal` 支持切换 OpenAI、DeepSeek、Ollama 等预设并持久化存储 Base URL、API Key 与 Model Name，重启及并发读写正常 | `PASS` | `go test -v ./internal/db -run TestSettingsRepository`、`go test -v ./internal/settings`、`pnpm test -- SettingsModal` | — |
| TASK-009 | v2.REQ-001-AC-002 | Unit / Integration | 实现通用 `llm.Provider` 与兼容 OpenAI SSE 协议的流式客户端，支持 `/chat/completions` 分块解析与 `[DONE]` 结束；正确将 HTTP 401 映射为 `KindPrecondition`，429/5xx 映射为 `KindExternal`；支持 `TestConnection` 连通性测试 | `PASS` | `go test -v -race ./internal/llm/...` | — |

---

## 真实测试执行输出

### 1. Go 后端数据库设置表与 SettingsService 单元测试
```text
=== RUN   TestSettingsRepository_CRUD
--- PASS: TestSettingsRepository_CRUD (0.02s)
PASS
ok  	buildui/internal/db	2.800s

=== RUN   TestSettingsService_SaveAndGet
--- PASS: TestSettingsService_SaveAndGet (0.03s)
=== RUN   TestSettingsService_TestConnection
--- PASS: TestSettingsService_TestConnection (0.02s)
PASS
ok  	buildui/internal/settings	3.601s
```

### 2. Go 后端 OpenAI 兼容流式客户端与异常映射测试
```text
=== RUN   TestOpenAIClient_StreamChat_Success
--- PASS: TestOpenAIClient_StreamChat_Success (0.04s)
=== RUN   TestOpenAIClient_StreamChat_Errors
=== RUN   TestOpenAIClient_StreamChat_Errors/401_Unauthorized_maps_to_Precondition
=== RUN   TestOpenAIClient_StreamChat_Errors/429_RateLimit_maps_to_External
--- PASS: TestOpenAIClient_StreamChat_Errors (0.00s)
=== RUN   TestOpenAIClient_StreamChat_CancelContext
--- PASS: TestOpenAIClient_StreamChat_CancelContext (0.52s)
=== RUN   TestOpenAIClient_TestConnection
--- PASS: TestOpenAIClient_TestConnection (0.00s)
PASS
ok  	buildui/internal/llm	3.809s
```

### 3. 前端 SettingsModal 组件测试与主界面集成测试 (Vitest)
```text
 ✓ src/components/SettingsModal.test.tsx (3 tests) 61ms
 ✓ src/App.test.tsx (4 tests) 79ms

 Test Files  5 passed (5)
      Tests  15 passed (15)
   Duration  509ms
```
