# AC 验收矩阵（Acceptance Criteria Matrix）· TASK-020

> 文件路径：`docs/spec/versions/v4/ac/TASK-020-AC.md`  
> 规范版本：v4  
> 任务编号：TASK-020  
> 任务名称：Blot-UI v4 全流程整合与 Playwright E2E 自动化验收  
> 执行日期：2026-11-21  
> 执行人：Agent (TDD / SDD 自动化执行)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|:---:|:---:|:---:|:---|:---:|:---|:---:|
| TASK-020 | `v4.REQ-001-AC-001` ~ `003` | E2E / Visual | Playwright E2E 验证触发包含 `recharts` / `lucide-react` 依赖需求，UI 实时展示依赖安装动效与完成徽标 | `PASS` | `frontend/e2e/v4-workflow.spec.ts`, `04-v4-dependency-installation-stream.png` | — |
| TASK-020 | `v4.REQ-002-AC-001` ~ `003` | E2E / Visual | Playwright E2E 验证顶部 ThemeSelector 下拉展示 5 套预设，流畅切换 Cyberpunk Neon 与 Forest Emerald 主题并持久化 | `PASS` | `frontend/e2e/v4-workflow.spec.ts`, `01-v4-theme-selector-dropdown.png`, `02-v4-theme-cyberpunk-active.png`, `03-v4-theme-forest-active.png` | — |
| TASK-020 | 全量回归基线 | Integration / Build | Go 16 模块单元测试全过、Vitest 10 套件全过、Playwright 4 套件全过、前端生产构建与 Go 编译均通过 | `PASS` | `go test ./...`, `pnpm test`, `playwright test`, `pnpm build`, `go build` | — |

---

## 验收截图证据清单

截图保存于 `docs/spec/versions/v4/reports/screenshots/`：

1. `01-v4-theme-selector-dropdown.png` (26.4 KB): 顶部导航展开主题预设菜单，展示色轮与预设名称。
2. `02-v4-theme-cyberpunk-active.png` (22.0 KB): Cyberpunk Neon 激活，高对比度赛博朋克色系生效。
3. `03-v4-theme-forest-active.png` (21.8 KB): Forest Emerald 激活，自然深绿护眼主题生效。
4. `04-v4-dependency-installation-stream.png` (40.2 KB): 需求触发沙箱 npm 依赖自动检测与安装完成徽标。

---

## 真实测试执行记录

```bash
# 1. Playwright v4 端到端验收测试
cd frontend; pnpm exec playwright test e2e/v4-workflow.spec.ts
# 输出:
# Running 1 test using 1 worker
# ok 1 [Google Chrome] › e2e\v4-workflow.spec.ts:15:3 › Complete v4 workflow (1.6s)
# 1 passed (3.7s)

# 2. 全量前端单元测试与 E2E 综合测试
cd frontend; pnpm test --run; pnpm exec playwright test
# 输出:
# Test Files  10 passed (10)
# Tests       38 passed (38)
# Running 4 tests using 1 worker
# ok 1 e2e\v2-workflow.spec.ts (3.5s)
# ok 2 e2e\v3-workflow.spec.ts (743ms)
# ok 3 e2e\v4-workflow.spec.ts (780ms)
# ok 4 e2e\workflow.spec.ts (1.5s)
# 4 passed (9.2s)

# 3. 后端 Go 16 包全量单元测试
go test -v -count=1 ./...
# 输出:
# 16 packages: ALL PASS

# 4. 构建验证
cd frontend && pnpm build && cd .. && go build -v .
# 输出:
# vite v6.4.6 built in 700ms
# buildui binary compiled successfully
```
