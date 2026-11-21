# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v1/ac/TASK-004-AC.md`  
> 任务编号：TASK-004  
> 关联需求：v1.REQ-003  
> 执行日期：2026-11-21  
> 执行人：AI Agent (Antigravity)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-004 | v1.REQ-003-AC-001 | Unit / Integration | 提示词装配模块输出角色、零占位符铁律（Zero Placeholder Policy）、<dyad-write> 与 <dyad-add-dependency> 工具规范；增量流式 XML 状态机逐 Token 解析标签，拦截 // TODO 与 /* implement */ 占位符，安全落盘至工作区，防护路径穿越 | `PASS` | `go test -v -cover ./internal/agent/...` | — |
| TASK-004 | v1.REQ-003-AC-002 | Unit / Integration | XML 状态机增量识别 `<dyad-add-dependency packages="...">`；DependencyManager 检查 package.json 现有依赖，过滤已装包，自动调用 pnpm add 安装缺失的三方依赖 | `PASS` | `go test -v -cover ./internal/agent/...` | — |

---

## 真实测试执行输出

### 1. Go 后端单元与集成测试输出 (Race & Coverage)
```text
=== RUN   TestDependencyManager_EnsureDependencies
--- PASS: TestDependencyManager_EnsureDependencies (0.00s)
=== RUN   TestXMLStreamParser_StreamingWriteFile
--- PASS: TestXMLStreamParser_StreamingWriteFile (0.00s)
=== RUN   TestXMLStreamParser_StreamingAddDependency
--- PASS: TestXMLStreamParser_StreamingAddDependency (0.00s)
=== RUN   TestPromptAssembler_AssembleSystemPrompt
--- PASS: TestPromptAssembler_AssembleSystemPrompt (0.00s)
=== RUN   TestPromptAssembler_AssembleContextPrompt
--- PASS: TestPromptAssembler_AssembleContextPrompt (0.00s)
=== RUN   TestChatService_BlueprintGateAndEventStream
--- PASS: TestChatService_BlueprintGateAndEventStream (0.01s)
=== RUN   TestFileWriter_ValidatePlaceholders
--- PASS: TestFileWriter_ValidatePlaceholders (0.00s)
=== RUN   TestFileWriter_WriteFile_SecurityAndSuccess
--- PASS: TestFileWriter_WriteFile_SecurityAndSuccess (0.00s)
PASS
coverage: 77.1% of statements
ok  	buildui/internal/agent	0.445s	coverage: 77.1% of statements
```

### 2. 全量回归测试输出 (全套 Go 测试 + React 组件测试)
```text
?   	buildui	[no test files]
ok  	buildui/internal/agent	1.354s
ok  	buildui/internal/app	2.034s
ok  	buildui/internal/blueprint	2.124s
ok  	buildui/internal/db	1.610s
ok  	buildui/internal/errs	2.314s
ok  	buildui/internal/scaffold	2.542s

 Test Files  2 passed (2)
      Tests  4 passed (4)
```
