# v23 实现任务清单 (Tasks)

## 任务拆分与执行状态

- [x] **TASK-001: 标杆预设库扩充经典 App 与 Desktop 设计风格 (TDD Red -> Green)**
  - 目标：在 `styleExtractor.ts` 中扩充 App (ios-health, threads, duolingo, cashapp) 与 Desktop (windows-fluent, slack, vscode) 标杆预设，规范 `appType` 映射与平台 Prompt。
  - 对应 AC：`v23.REQ-001-AC-001`, `v23.REQ-001-AC-002`。
  - 测试：`styleExtractor.test.ts` (PASS)。

- [x] **TASK-002: 风格中心展示多端经典预设与分类过滤验证 (TDD Red -> Green)**
  - 目标：确保 `StyleCenterView.tsx` 中在 All / Web / App / Desktop 各过滤器下能够准确展示新增的经典预设并正确呈现形态 Badge 与色盘。
  - 对应 AC：`v23.REQ-001-AC-003`。
  - 测试：`StyleCenterView.test.tsx` (PASS)。

- [x] **TASK-003: 首页设计预设按 App / Web / Desktop 分类显示与筛选 (TDD Red -> Green)**
  - 目标：在 `HomeGuideView.tsx` 中为 Popover 增加平台分类筛选胶囊，扩充 `DEFAULT_STYLE_PRESETS` 附带 `appType`，在预设列表项中展示端形态微图标/徽章，根据分类即时过滤。
  - 对应 AC：`v23.REQ-002-AC-001`, `v23.REQ-002-AC-002`, `v23.REQ-002-AC-003`。
  - 测试：`HomeGuideView.test.tsx` (PASS)。

- [x] **TASK-004: 视觉回归与端到端验证 (QA & Visual Regression)**
  - 目标：执行 Vitest 全量前端测试，并使用 Playwright 截取首页风格分类展示与风格中心展示截图，沉淀验收证据。
  - 对应 AC：全部 AC。
  - 结果：Playwright e2e 2 passed, 8 张全真截图已沉淀于 `docs/spec/versions/v23/screenshots/`。
