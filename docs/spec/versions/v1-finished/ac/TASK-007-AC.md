# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v1/ac/TASK-007-AC.md`  
> 任务编号：TASK-007  
> 关联需求：v1.REQ-006  
> 执行日期：2026-11-21  
> 执行人：AI Agent (Antigravity)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-007 | v1.REQ-006-AC-001 | Integration / E2E | AppRunner 与 AppService.RunApp 支持动态拉起目标应用 Vite 开发服务器；实现 ANSI 剥除与动态端口 URL 正则解析，精准捕获 `http://localhost:5173` 并返回前端；支持优雅关停（StopApp）与清理进程，杜绝孤儿进程；前端 PreviewPanel 正确在 running 状态内嵌 Iframe 渲染 | `PASS` | `go test -v -cover ./internal/app/runner/...` 与 `pnpm test -- PreviewPanel` | — |
| TASK-007 | v1.REQ-006-AC-002 | Integration | 监听开发服务器与运行时输出，当发生 `Internal server error`、`[vite] error` 或未捕获异常时，通过 Wails 事件通道向前端广播 `preview:console`；前端 PreviewPanel 底部抽屉精准渲染报错日志 | `PASS` | `go test -v -cover ./internal/app/runner/...` 与 `pnpm test -- PreviewPanel` | — |

---

## 真实测试执行输出

### 1. Go 后端单元与集成测试输出 (Race & Coverage)
```text
=== RUN   TestPortParser_ExtractPreviewURL
=== RUN   TestPortParser_ExtractPreviewURL/Standard_Vite_localhost
=== RUN   TestPortParser_ExtractPreviewURL/Standard_Vite_127.0.0.1_with_custom_port
=== RUN   TestPortParser_ExtractPreviewURL/Vite_with_ANSI_colors
--- PASS: TestPortParser_ExtractPreviewURL (0.00s)
=== RUN   TestAppRunner_StartAndStop
--- PASS: TestAppRunner_StartAndStop (0.01s)
=== RUN   TestAppRunner_ConsoleErrorForwarding
--- PASS: TestAppRunner_ConsoleErrorForwarding (0.01s)
PASS
ok  	buildui/internal/app/runner	1.314s
=== RUN   TestAppService_RunAppAndStopApp
--- PASS: TestAppService_RunAppAndStopApp (0.01s)
PASS
ok  	buildui/internal/app	1.608s
```

### 2. 前端组件与交互测试输出 (Vitest)
```text
 ✓ src/components/QuestionnaireCard.test.tsx (1 test) 38ms
 ✓ src/components/BlueprintCard.test.tsx (3 tests) 39ms
 ✓ src/components/PreviewPanel.test.tsx (4 tests) 43ms

 Test Files  3 passed (3)
      Tests  8 passed (8)
```
