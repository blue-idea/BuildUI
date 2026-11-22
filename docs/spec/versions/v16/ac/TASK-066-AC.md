# AC 验收单 · TASK-066

> 任务 ID: TASK-066  
> 任务名称: `AppService.GetWorkspaceRoot` 动态读取 settings 配置并联动 `CreateApp`（Go TDD）  
> 需求关联: `requirements.md` 中的 `v16.REQ-001` (AC-001, AC-002, AC-003, AC-004)  
> 执行日期: 2026-11-23  

---

## 1. 验收项与测试命令

```bash
go test -v -run TestWorkspaceRoot ./internal/app/...
```

## 2. 真实执行结果

```
=== RUN   TestWorkspaceRoot_Resolution
=== RUN   TestWorkspaceRoot_Resolution/custom_settings_workspace.dir_takes_precedence
=== RUN   TestWorkspaceRoot_Resolution/falls_back_to_in-memory_root_when_settings_empty
=== RUN   TestWorkspaceRoot_Resolution/falls_back_to_default_workspace_when_both_empty
--- PASS: TestWorkspaceRoot_Resolution (0.01s)
    --- PASS: TestWorkspaceRoot_Resolution/custom_settings_workspace.dir_takes_precedence (0.00s)
    --- PASS: TestWorkspaceRoot_Resolution/falls_back_to_in-memory_root_when_settings_empty (0.00s)
    --- PASS: TestWorkspaceRoot_Resolution/falls_back_to_default_workspace_when_both_empty (0.00s)
=== RUN   TestWorkspaceRoot_CreateAppWithCustomRoot
--- PASS: TestWorkspaceRoot_CreateAppWithCustomRoot (0.02s)
=== RUN   TestWorkspaceRoot_DynamicUpdateTakesEffectImmediately
--- PASS: TestWorkspaceRoot_DynamicUpdateTakesEffectImmediately (0.02s)
PASS
ok  	buildui/internal/app	2.436s
```

## 3. 验收矩阵

| 验收标准 | 预期表现 | 实际结果 | 状态 |
|---|---|---|:---:|
| `v16.REQ-001-AC-001` | 设置中配置 `workspace.dir` 时，`GetWorkspaceRoot(ctx)` 返回该自定义存储路径 | 优先读取数据库 settings 表中的 `workspace.dir` | PASS |
| `v16.REQ-001-AC-002` | 创建空白项目（`CreateApp`）未指定绝对路径时，项目根目录位于当前设置的 `workspace.dir` 下 | 项目路径格式为 `<workspace.dir>/<project-name>`，物理目录创建成功 | PASS |
| `v16.REQ-001-AC-003` | 设置中保存新的 `workspace.dir` 时，后续新项目立即使用新路径，无需重启应用 | 更新设置后立即在第二次设置的路径下创建项目 | PASS |
| `v16.REQ-001-AC-004` | 从模版创建项目（`CreateAppFromTemplate`）在未指定 `DestPath` 时，项目根目录位于当前 `workspace.dir` 下 | `app.go` 中解析 `GetWorkspaceRoot` 并作为默认 `DestPath` 前缀 | PASS |
