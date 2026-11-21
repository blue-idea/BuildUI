# AC 验收矩阵（Acceptance Criteria Matrix）· TASK-014

> 文件路径：`docs/spec/versions/v3/ac/TASK-014-AC.md`  
> 规范版本：v3  
> 任务编号：TASK-014  
> 任务名称：可视化组件定位审查器（Component Inspector）与定向 Prompt 联动  
> 执行日期：2026-11-21  
> 执行人：Agent (TDD / SDD 自动化执行)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|:---:|:---:|:---:|:---|:---:|:---|:---:|
| TASK-014 | `v3.REQ-002-AC-001` | Unit | `InspectorService.ResolveComponent` 准确识别标签、类名与显式路径，解析为 `src/components/...` 并输出 `@...: ` 提示词模板 | `PASS` | `internal/inspector/resolver_test.go` | — |
| TASK-014 | `v3.REQ-002-AC-002` | UI / Unit | `PreviewPanel` 增加 Inspect 切换开关，进入审查模式展示顶部活动提示条与遮罩标识 | `PASS` | `ComponentInspector.test.tsx`, `PreviewPanel.tsx` | — |
| TASK-014 | `v3.REQ-002-AC-003` | UI / Integration | 点击检查目标元素后退出审查模式，并在聊天输入框自动预填 `@src/components/Navbar.tsx: ` 并激活输入焦点 | `PASS` | `App.test.tsx` (Test: toggles component inspector and injects prompt on element click) | — |

---

## 测试命令与真实执行记录

```bash
# 1. 后端 InspectorService 单元测试
go test -v -count=1 ./internal/inspector/...
# 输出:
# === RUN   TestInspectorService_ResolveComponent
# --- PASS: TestInspectorService_ResolveComponent (0.00s)
# PASS
# ok      buildui/internal/inspector      1.199s

# 2. 前端组件审查与主应用输入框联动测试
cd frontend && pnpm test --run
# 输出:
# ✓ src/components/ComponentInspector.test.tsx (3 tests) 95ms
# ✓ src/App.test.tsx (9 tests) 285ms
# Test Files  8 passed (8)
# Tests       29 passed (29)

# 3. Playwright E2E 回归保障
cd frontend && pnpm exec playwright test
# 输出:
# 2 passed (7.0s)
```
