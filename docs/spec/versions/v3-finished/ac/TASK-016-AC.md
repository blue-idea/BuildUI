# AC 验收矩阵（Acceptance Criteria Matrix）· TASK-016

> 文件路径：`docs/spec/versions/v3/ac/TASK-016-AC.md`  
> 规范版本：v3  
> 任务编号：TASK-016  
> 任务名称：Blot-UI v3 全流程整合与 Playwright E2E 自动化验收  
> 执行日期：2026-11-21  
> 执行人：Agent (TDD / SDD 自动化执行)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|:---:|:---:|:---:|:---|:---:|:---|:---:|
| TASK-016 | `v3.REQ-001-AC-001` ~ `003` | E2E / Visual | Playwright E2E 验证多应用抽屉打开、项目列表渲染、切换与新建应用全流程，捕获高保真截图证据 | `PASS` | `frontend/e2e/v3-workflow.spec.ts`, `01-v3-app-drawer.png` | — |
| TASK-016 | `v3.REQ-002-AC-001` ~ `003` | E2E / Visual | Playwright E2E 验证实时预览区审查模式开启、组件悬浮高亮、点击 Mock Navbar 退出审查并自动在 Chat 输入框注入 `@src/components/Navbar.tsx: ` | `PASS` | `frontend/e2e/v3-workflow.spec.ts`, `02-v3-component-inspector.png`, `03-v3-targeted-prompt.png` | — |
| TASK-016 | `v3.REQ-003-AC-001` ~ `003` | E2E / Visual | Playwright E2E 验证工程导出模态框打开、一键 Zip 压缩归档完成反馈、在原生资源管理器中定位入口 | `PASS` | `frontend/e2e/v3-workflow.spec.ts`, `04-v3-project-export.png` | — |
| TASK-016 | 全量回归基线 | Integration / Build | Go 15 模块单元测试全过、Vitest 9 套件全过、Playwright 3 套件全过、前端生产构建与 Go 编译均通过 | `PASS` | `go test ./...`, `pnpm test`, `playwright test`, `pnpm build`, `go build` | — |

---

## 验收截图证据清单

截图保存于 `docs/spec/versions/v3/reports/screenshots/`：

1. `01-v3-app-drawer.png` (27.5 KB): 多应用抽屉展开，展示现有应用卡片与 `+ New Application` 操作。
2. `02-v3-component-inspector.png` (25.8 KB): 预览区组件审查模式激活，顶部浮层提示 "Inspector Mode Active"。
3. `03-v3-targeted-prompt.png` (21.6 KB): 点击组件元素自动回填精准定位 Prompt (`@src/components/Navbar.tsx: ...`)。
4. `04-v3-project-export.png` (38.5 KB): 工程导出面板完成 Zip 打包，展示生成路径并提供 `Reveal in Explorer`。

---

## 真实测试执行记录

```bash
# 1. Playwright v3 端到端验收测试
cd frontend; pnpm exec playwright test e2e/v3-workflow.spec.ts
# 输出:
# Running 1 test using 1 worker
# ok 1 [Google Chrome] › e2e\v3-workflow.spec.ts:15:3 › Blot-UI v3 Full Lifecycle E2E Workflow (1.4s)
# 1 passed (3.4s)

# 2. 全量前端单元测试与 E2E 综合测试
cd frontend; pnpm test --run; pnpm exec playwright test
# 输出:
# Test Files  9 passed (9)
# Tests       34 passed (34)
# Running 3 tests using 1 worker
# ok 1 e2e\v2-workflow.spec.ts (3.4s)
# ok 2 e2e\v3-workflow.spec.ts (778ms)
# ok 3 e2e\workflow.spec.ts (1.5s)
# 3 passed (7.8s)

# 3. 后端 Go 15 包全量单元测试
go test -v -count=1 ./...
# 输出:
# 15 packages: ALL PASS

# 4. 构建验证
cd frontend && pnpm build && cd .. && go build -v .
# 输出:
# vite v6.4.6 built in 687ms
# buildui binary compiled successfully
```
