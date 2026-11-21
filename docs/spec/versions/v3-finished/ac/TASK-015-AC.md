# AC 验收矩阵（Acceptance Criteria Matrix）· TASK-015

> 文件路径：`docs/spec/versions/v3/ac/TASK-015-AC.md`  
> 规范版本：v3  
> 任务编号：TASK-015  
> 任务名称：一键工程 Zip 归档导出服务与操作系统原生资源管理器定位  
> 执行日期：2026-11-21  
> 执行人：Agent (TDD / SDD 自动化执行)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|:---:|:---:|:---:|:---|:---:|:---|:---:|
| TASK-015 | `v3.REQ-003-AC-001` | Unit | `ExportService.ExportAppZip` 递归压缩工作区并严格排除 `.git`, `node_modules`, `dist`，具备 Zip Slip 路径安全校验 | `PASS` | `internal/export/export_test.go` | — |
| TASK-015 | `v3.REQ-003-AC-002` | Unit / Desktop | `ExportService.OpenInFileManager` 跨平台调用原生 Explorer / Finder，参数化传参杜绝命令注入风险 | `PASS` | `internal/export/reveal.go`, `export_test.go` | — |
| TASK-015 | `v3.REQ-003-AC-003` | UI / Unit | `ExportModal.tsx` 提供工程导出面板，支持触发一键 Zip 打包、呈现输出路径与唤起原生资源管理器 | `PASS` | `frontend/src/components/ExportModal.test.tsx`, `App.test.tsx` | — |

---

## 测试命令与真实执行记录

```bash
# 1. 后端 ExportService 单元测试
go test -v -count=1 ./internal/export/...
# 输出:
# === RUN   TestExportService_ExportAppZipAndReveal
# --- PASS: TestExportService_ExportAppZipAndReveal (0.03s)
# PASS
# ok      buildui/internal/export 0.094s

# 2. 前端 ExportModal 组件与主界面导出交互测试
cd frontend && pnpm test --run
# 输出:
# ✓ src/components/ExportModal.test.tsx (4 tests) 149ms
# ✓ src/App.test.tsx (10 tests) 332ms
# Test Files  9 passed (9)
# Tests       34 passed (34)

# 3. E2E 回归测试保障
cd frontend && pnpm exec playwright test
# 输出:
# 2 passed (7.2s)
```
