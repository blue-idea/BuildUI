# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v2/ac/TASK-011-AC.md`  
> 任务编号：TASK-011  
> 关联需求：v2.REQ-003  
> 执行日期：2026-11-21  
> 执行人：AI Agent (Antigravity)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-011 | v2.REQ-003-AC-001 | Unit / Integration | `VersionService.ListVersions` 支持从 SQLite `versions` 表按时间倒序读取全部历史快照；实现 `GetVersionDiff` 与 `ParseGitDiff`，结构化输出包含文件状态（added/modified/deleted）、新增行数、删除行数与 Hunks 代码块；前端 `VersionTimelineModal` 清晰渲染版本卡片时间线 | `PASS` | `go test -v ./internal/version -run TestVersionService_ListAndDiffAndRollback`、`pnpm test -- VersionTimelineModal` | — |
| TASK-011 | v2.REQ-003-AC-002 | Unit / Integration | `VersionService.RollbackVersion` 调用 `git checkout <hash> -- .` 将工作区文件还原至指定提交，自动生成回滚提交并写入 `versions` 审计记录，广播 `version:rollback` 事件；前端支持直观对比代码差异并点击“Rollback to this version”一键回退 | `PASS` | `go test -v -race ./internal/version/...`、`pnpm test -- App` | — |

---

## 真实测试执行输出

### 1. Go 后端版本列表、Diff 解析与 Git 回滚测试
```text
=== RUN   TestVersionService_ListAndDiffAndRollback
--- PASS: TestVersionService_ListAndDiffAndRollback (0.31s)
PASS
ok  	buildui/internal/version	6.038s
```

### 2. 前端 VersionTimelineModal 与 DiffViewer 组件测试 (Vitest)
```text
 ✓ src/components/VersionTimelineModal.test.tsx (2 tests) 66ms
 ✓ src/App.test.tsx (6 tests) 117ms

 Test Files  6 passed (6)
      Tests  19 passed (19)
   Duration  828ms
```
