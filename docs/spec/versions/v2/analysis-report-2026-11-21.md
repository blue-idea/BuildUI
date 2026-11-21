# 规格一致性审查报告（Analysis Report）· Blot-UI v2

> 报告路径：`docs/spec/versions/v2/analysis-report-2026-11-21.md`  
> 审查日期：2026-11-21  
> 审查对象：`requirements.md` 与 `design.md`  
> 审查工具：Sequential Thinking & SDD Consistency Checker  
> 审查结论：**通过（PASS）**，各需求在设计中均有明确架构落点与测试策略。

---

## 1. 需求与设计对应性审查

| 需求编号 | 需求名称 | 设计模块映射 | 数据层支持 | IPC 接口契约 | 审查结论 |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `v2.REQ-001` | 多模型真实 LLM 流式接入与配置中心 | `internal/llm/client.go`<br>`internal/settings/service.go` | SQLite `settings` 表 | `GetSettings`, `SaveSettings`, `TestLLMConnection` | **PASS** |
| `v2.REQ-002` | 多轮会话上下文装配与流式中断取消 | `internal/agent/prompt_assembler.go`<br>`internal/agent/service.go` | SQLite `chats`, `messages` | `CancelCurrentChat`, 事件 `chat:chunk` | **PASS** |
| `v2.REQ-003` | Git 版本快照时光机与可视化代码 Diff 审查 | `internal/version/service.go`<br>`internal/version/diff.go` | SQLite `versions` 表 | `GetVersions`, `GetVersionDiff`, `RollbackVersion` | **PASS** |
| `v2.REQ-004` | 桌面原生文件系统选择器与工程化打包 | `app.go`<br>`wails/runtime` 桥接 | 本地文件系统 | `OpenDirectoryDialog`, `pnpm build` | **PASS** |

---

## 2. 潜在风险与缓解方案

1. **外部大模型 SSE 长连接断连与超时**：
   - *风险*：公网网络抖动或长推理导致连接假死。
   - *缓解措施*：在 HTTP 客户端层设置保活 KeepAlive 与 ReadTimeout，配合 Go `context.WithTimeout`；当检测到断开时向上抛出分类明确的 `BlotError(ErrorKindExternal)`。
2. **Git 版本回滚覆盖未保存代码**：
   - *风险*：用户在未提交时点击历史回滚，导致当前临时修改丢失。
   - *缓解措施*：在执行 `git checkout / reset` 前，检查 `git status --porcelain`，若有未提交修改自动执行 stash 或生成临时 savepoint commit。
3. **前端大型 Diff 视图性能**：
   - *风险*：单次生成修改成百上千行时，DOM 节点爆炸。
   - *缓解措施*：文件列表分页或按文件折叠展示，仅在用户展开特定文件时渲染代码高亮行。

---

## 3. 审查通过与准入签名

- 架构对齐：深度契合 Dyad 官方架构方案与 Go 微服务模块化标准。
- 测试准入：全部需求均配备 Red-Green-Refactor 单元测试与端到端 Playwright 验收用例。
- 准予进入 **STEP 5（任务拆分与可追溯性构建）**。
