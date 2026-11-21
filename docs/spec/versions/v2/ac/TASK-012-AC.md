# AC 验收矩阵（Acceptance Criteria Matrix）· TASK-012

> 文件路径：`docs/spec/versions/v2/ac/TASK-012-AC.md`  
> 规范版本：v2  
> 任务编号：TASK-012  
> 任务名称：Wails 原生桌面增强与 v2 全流程 Playwright E2E 验证  
> 执行日期：2026-11-21  
> 执行人：Agent (TDD / SDD 自动化执行)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|:---:|:---:|:---:|:---|:---:|:---|:---:|
| TASK-012 | `v2.REQ-004-AC-001` | Unit / Desktop | `App.SelectDirectory` 集成 Wails `runtime.OpenDirectoryDialog`，前端导航区提供工作区目录选择按钮并成功交互 | `PASS` | `app_test.go`, `App.test.tsx` | — |
| TASK-012 | `v2.REQ-004-AC-002` | E2E / Build | 前端 `tsc && vite build` 生产构建成功（647ms），后端 `go build` 二进制打包成功，Playwright 全流程回归用例全绿通过 | `PASS` | `frontend/e2e/v2-workflow.spec.ts`, `dist/` | — |
| TASK-012 | `v2.REQ-001-AC-001` | UI / E2E | 打开设置面板配置 OpenAI 端点与模型，连通性测试通过并成功保存配置 | `PASS` | `reports/screenshots/01-v2-main-settings.png` | — |
| TASK-012 | `v2.REQ-001-AC-002` | UI / E2E | 提交首轮应用构建提示词，蓝图审批卡片展示并通过，代码生成与沙箱验证完成 | `PASS` | `reports/screenshots/02-v2-round1-blueprint-approved.png` | — |
| TASK-012 | `v2.REQ-002-AC-001` | UI / E2E | 发送第 2 轮增量提示词，Agent 基于多轮会话感知执行增量构建并完成预览重载 | `PASS` | `reports/screenshots/03-v2-round2-multiturn-chat.png` | — |
| TASK-012 | `v2.REQ-003-AC-001` | UI / E2E | 打开版本时光机，展示历史提交快照列表，点击快照展示代码 Diff 差异视图 | `PASS` | `reports/screenshots/04-v2-version-timeline-diff.png` | — |
| TASK-012 | `v2.REQ-003-AC-002` | UI / E2E | 点击回滚按钮，系统执行一键回滚并在聊天流呈现回滚反馈，预览恢复到历史快照 | `PASS` | `reports/screenshots/05-v2-rollback-preview.png` | — |

---

## 测试命令与真实执行记录

```bash
# 1. 桌面端 SelectDirectory 单元测试
go test -v -count=1 .
# 输出:
# === RUN   TestApp_SelectDirectory
# --- PASS: TestApp_SelectDirectory (0.00s)
# PASS
# ok      buildui 0.119s

# 2. 前端单元与组件测试
cd frontend && pnpm test --run
# 输出:
# Test Files  6 passed (6)
# Tests       20 passed (20)
# Duration    1.36s

# 3. Playwright E2E 全流程回归
cd frontend && pnpm exec playwright test
# 输出:
# 2 passed (7.0s)
# - e2e/v2-workflow.spec.ts: Complete v2 workflow: Workspace Picker -> Settings -> Multi-Turn Gen -> Time Machine Diff & Rollback (3.5s)
# - e2e/workflow.spec.ts: Complete workflow: Main layout -> Submit prompt -> Blueprint Approval -> Code Gen & Live Preview (1.5s)

# 4. 生产构建验证
cd frontend && pnpm build && cd .. && go build -v .
# 输出:
# vite v6.4.6 building for production...
# ✓ 35 modules transformed.
# dist/assets/index-Yciq7EPV.js   248.83 kB │ gzip: 75.88 kB
# ✓ built in 647ms
# buildui
```
