# AC 验收矩阵（Acceptance Criteria Matrix）

> 文件路径：`docs/spec/versions/v1/ac/TASK-008-AC.md`  
> 任务编号：TASK-008  
> 关联需求：v1.REQ-007  
> 执行日期：2026-11-21  
> 执行人：AI Agent (Antigravity)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|---------|-------|:-------:|------------|:----:|------|---------|
| TASK-008 | v1.REQ-007-AC-001 | E2E / Integration | 1. 会话轮次写入代码后自动执行 `git add -A` 与 `git commit`，将提取的提交 Hash 持久化存入 SQLite `versions` 表，并在 `chat:end` 事件中推送；<br>2. 贯通 Wails 前后端交互：主界面左右分栏、对话流渲染、蓝图审批卡片门禁与 Iframe 实时预览；<br>3. Playwright E2E 自动化测试全流程验证通过，生成完整的视觉截图留证 | `PASS` | `go test -v ./internal/agent -run TestChatService_TurnLevelGitCommit`、`pnpm test`、`pnpm test:e2e` 以及 3 张 E2E 流程截图 | — |

---

## 视觉与端到端验收截图留证

Playwright E2E 运行产出以下 3 张高保真全屏验收截图：

1. **左右分栏主界面（欢迎区与实时预览面板）**
   - 路径：`docs/spec/versions/v1/reports/screenshots/01-main-layout.png`
   - 说明：展示 Blot-UI 桌面应用主界面，左侧会话区（欢迎提示卡与输入框），右侧预览面板准备就绪。

2. **蓝图审批门禁卡片（架构审批门禁）**
   - 路径：`docs/spec/versions/v1/reports/screenshots/02-blueprint-approval.png`
   - 说明：用户输入应用生成需求后，触发需求澄清问卷与蓝图生成，展示设计方向、配色方案与视觉元素卡片，严格遵循蓝图未审批前不写入代码的门禁机制。

3. **实时预览与沙箱验证完成状态**
   - 路径：`docs/spec/versions/v1/reports/screenshots/03-preview-running.png`
   - 说明：用户审批蓝图后，触发代理流式代码写盘、TypeScript 自愈验证与 Vite 服务启动，右侧 PreviewPanel 显示 running 状态并内嵌渲染 Iframe，左侧显示代码生成就绪与 Turn-level Git 提交状态。

---

## 真实测试执行输出

### 1. Go 后端 Turn-level Git 提交与 SQLite versions 持久化验证
```text
=== RUN   TestChatService_TurnLevelGitCommit
--- PASS: TestChatService_TurnLevelGitCommit (0.15s)
PASS
ok  	buildui/internal/agent	1.838s
```

### 2. 前端单元与组件交互测试 (Vitest)
```text
 ✓ src/components/QuestionnaireCard.test.tsx (1 test) 36ms
 ✓ src/components/BlueprintCard.test.tsx (3 tests) 37ms
 ✓ src/components/PreviewPanel.test.tsx (4 tests) 44ms
 ✓ src/App.test.tsx (3 tests) 57ms

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Duration  377ms
```

### 3. Playwright E2E 全流程测试输出
```text
> frontend@0.1.0 test:e2e /Volumes/data/Nextcloud/coding/desktop/BuildUI/frontend
> playwright test

Running 1 test using 1 worker

     1 …layout -> Submit prompt -> Blueprint Approval -> Code Gen & Live Preview
  ✓  1 …-> Submit prompt -> Blueprint Approval -> Code Gen & Live Preview (1.5s)
  1 passed (2.5s)
```
