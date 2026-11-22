# AC 验收单 · TASK-062

> 任务 ID: TASK-062  
> 任务名称: `AppService.DeleteApp` 联动物理目录清理与运行态停止（TDD）  
> 需求关联: `requirements.md` 中的 `v14.REQ-001` (AC-001, AC-002, AC-003), `v14.REQ-002` (AC-002)  
> 执行日期: 2026-11-23  

---

## 1. 验收项与测试命令

```bash
go test -v -run "TestAppService_DeleteApp.*" ./internal/app/...
```

## 2. 真实执行结果

```
=== RUN   TestAppService_DeleteApp_DirectoryCleanAndSafety
--- PASS: TestAppService_DeleteApp_DirectoryCleanAndSafety (0.36s)
=== RUN   TestAppService_DeleteApp_StopsRunner
--- PASS: TestAppService_DeleteApp_StopsRunner (0.22s)
PASS
ok  	buildui/internal/app	1.105s
```

## 3. 验收矩阵

| 验收标准 | 预期表现 | 实际结果 | 状态 |
|---|---|---|:---:|
| `v14.REQ-001-AC-001` | 删除非活跃项目时，数据库记录被清除，本地磁盘工程目录被物理删除 | DB 无记录，`os.Stat` 证实目录已彻底移除 | PASS |
| `v14.REQ-001-AC-002` | 尝试删除当前活跃工程被拒绝，物理目录保持完整 | 返回 PreconditionError，物理目录完好存在 | PASS |
| `v14.REQ-001-AC-003` | 删除工程前若存在运行态 runner，先终止 runner | 验证 runner 停止，目录与 DB 随后清理 | PASS |
| `v14.REQ-002-AC-002` | 若工程目录先前已被手动删除，DeleteApp 依然平稳清理数据库 | 无文件缺失报错，DB 正常完成删除 | PASS |
