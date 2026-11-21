# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v2/ac/TASK-010-AC.md`  
> 任务编号：TASK-010  
> 关联需求：v2.REQ-002  
> 执行日期：2026-11-21  
> 执行人：AI Agent (Antigravity)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-010 | v2.REQ-002-AC-001 | Unit / Integration | 升级 `PromptAssembler` 与 `ScanWorkspaceTree`，自动过滤 `node_modules`、`.git`、`dist` 等无关目录，将精简工作区文件树（`<workspace_tree>`）与多轮会话历史记录（`<conversation_history>`）装配注入上下文 Prompt；前端支持多轮连续交互 | `PASS` | `go test -v ./internal/agent -run TestPromptAssembler_WorkspaceTreeAndHistory`、`pnpm test -- App` | — |
| TASK-010 | v2.REQ-002-AC-002 | Unit / Integration | `ChatService` 维护并发安全的 `activeSessions` 并暴露 `CancelChat(chatID)`；当取消触发时立即打断底层读取并广播 `chat:cancelled` 事件，50ms 内安全退出，杜绝脏文件残留；前端支持生成状态与红色的“Stop”按钮交互 | `PASS` | `go test -v -race ./internal/agent -run TestChatService_CancelChat`、`pnpm test -- App` | — |

---

## 真实测试执行输出

### 1. Go 后端文件树扫描、多轮上下文组装与并发取消测试
```text
=== RUN   TestPromptAssembler_WorkspaceTreeAndHistory
--- PASS: TestPromptAssembler_WorkspaceTreeAndHistory (0.00s)
=== RUN   TestChatService_CancelChat
--- PASS: TestChatService_CancelChat (0.04s)
PASS
ok  	buildui/internal/agent	1.700s
```

### 2. 前端多轮会话连续发送与 Stop 按钮点击测试 (Vitest)
```text
 ✓ src/components/BlueprintCard.test.tsx (3 tests) 40ms
 ✓ src/components/PreviewPanel.test.tsx (4 tests) 50ms
 ✓ src/components/QuestionnaireCard.test.tsx (1 test) 44ms
 ✓ src/components/SettingsModal.test.tsx (3 tests) 51ms
 ✓ src/App.test.tsx (5 tests) 88ms

 Test Files  5 passed (5)
      Tests  16 passed (16)
   Duration  441ms
```
