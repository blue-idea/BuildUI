# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v1/ac/TASK-006-AC.md`  
> 任务编号：TASK-006  
> 关联需求：v1.REQ-005  
> 执行日期：2026-11-21  
> 执行人：AI Agent (Antigravity)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-006 | v1.REQ-005-AC-001 | Integration | 成功创建符合 `^.dyad-build-[A-Za-z0-9]{6}$` 规范的 detached Git worktree；完整复制未提交与未跟踪修改（Overlay），严格排除主目录 `node_modules`、`.git`、`dist`；在隔离沙箱中执行生产构建测试并捕获 exitCode 与终端日志；构建完成后（无论成功或失败）均自动执行 worktree remove 与 prune 清理，主工作区完好无损 | `PASS` | `go test -v -cover ./internal/verification/worktree/...` | — |

---

## 真实测试执行输出

### 1. Go 后端单元与真实 Git 集成测试输出 (Race & Coverage)
```text
=== RUN   TestWorktreeNaming_Pattern
--- PASS: TestWorktreeNaming_Pattern (0.00s)
=== RUN   TestOverlay_CopyAndExclusions
--- PASS: TestOverlay_CopyAndExclusions (0.00s)
=== RUN   TestWorktreeManager_ExecuteIsolatedBuild_Success
--- PASS: TestWorktreeManager_ExecuteIsolatedBuild_Success (0.00s)
=== RUN   TestWorktreeManager_ExecuteIsolatedBuild_FailureCleanup
--- PASS: TestWorktreeManager_ExecuteIsolatedBuild_FailureCleanup (0.00s)
=== RUN   TestWorktreeManager_RealGitIntegration
--- PASS: TestWorktreeManager_RealGitIntegration (0.11s)
PASS
coverage: 71.6% of statements
ok  	buildui/internal/verification/worktree	5.698s	coverage: 71.6% of statements
```

### 2. 全量系统回归测试
```text
ok  	buildui/internal/agent	1.567s
ok  	buildui/internal/app	2.362s
ok  	buildui/internal/blueprint	2.834s
ok  	buildui/internal/db	3.779s
ok  	buildui/internal/errs	4.795s
ok  	buildui/internal/scaffold	4.305s
ok  	buildui/internal/verification/tsc	5.359s
ok  	buildui/internal/verification/worktree	5.698s

Test Files  2 passed (2)
     Tests  4 passed (4)
```
