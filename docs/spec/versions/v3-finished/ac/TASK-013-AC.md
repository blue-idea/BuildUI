# AC 验收矩阵（Acceptance Criteria Matrix）· TASK-013

> 文件路径：`docs/spec/versions/v3/ac/TASK-013-AC.md`  
> 规范版本：v3  
> 任务编号：TASK-013  
> 任务名称：多应用工作区管理服务、活跃应用切换与 SQLite 级联安全删除  
> 执行日期：2026-11-21  
> 执行人：Agent (TDD / SDD 自动化执行)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|:---:|:---:|:---:|:---|:---:|:---|:---:|
| TASK-013 | `v3.REQ-001-AC-001` | Unit / Integ | `AppService.SwitchApp` 成功切换活跃应用 ID，停止旧开发服务并重新装配目标工程路径与 Commit Hash | `PASS` | `internal/app/switch_test.go` | — |
| TASK-013 | `v3.REQ-001-AC-002` | UI / Unit | `AppDrawer.tsx` 提供抽屉交互面板，显示应用列表、当前活跃徽标与新建应用按钮，支持点击切换工程 | `PASS` | `frontend/src/components/AppDrawer.test.tsx`, `App.test.tsx` | — |
| TASK-013 | `v3.REQ-001-AC-003` | Unit | `AppRepository.Delete` 级联删除非活跃应用及其关联数据，当试图删除活跃应用时严格抛出 `KindPrecondition` 错误拦截 | `PASS` | `internal/db/app_active_test.go`, `internal/app/switch_test.go` | — |

---

## 测试命令与真实执行记录

```bash
# 1. 后端应用切换与级联删除单元测试
go test -v -count=1 ./internal/app/... ./internal/db/...
# 输出:
# === RUN   TestAppService_SwitchAppAndDeleteApp
# --- PASS: TestAppService_SwitchAppAndDeleteApp (1.58s)
# === RUN   TestAppRepository_ActiveAppAndCascadeDelete
# --- PASS: TestAppRepository_ActiveAppAndCascadeDelete (0.00s)
# PASS
# ok      buildui/internal/app    7.000s
# ok      buildui/internal/db     4.521s

# 2. 前端 AppDrawer 组件与主应用抽屉联动测试
cd frontend && pnpm test --run
# 输出:
# ✓ src/components/AppDrawer.test.tsx (4 tests) 86ms
# ✓ src/App.test.tsx (8 tests) 274ms
# Test Files  7 passed (7)
# Tests       25 passed (25)

# 3. E2E 回归测试保障
cd frontend && pnpm exec playwright test
# 输出:
# 2 passed (7.3s)
```
