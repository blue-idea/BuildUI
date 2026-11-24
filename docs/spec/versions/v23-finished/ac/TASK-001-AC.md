# v23 验收矩阵与测试证据 (AC Matrix)

## 需求项与验收标准执行对照

| REQ / AC 编号 | 验收标准描述 | 测试类型 | 测试用例 / 证据路径 | 状态 |
|--------------|------------|---------|-------------------|:---:|
| `v23.REQ-001-AC-001` | 知识库扩充经典移动端 App 设计风格（Apple Health, Threads, Duolingo, Cash App） | 单元测试 (Vitest) | `src/utils/styleExtractor.test.ts` | **PASS** |
| `v23.REQ-001-AC-002` | 知识库扩充经典桌面客户端 Desktop 设计风格（Windows Fluent, Slack, VS Code），稳定 Apple/Raycast 桌面归属 | 单元测试 (Vitest) | `src/utils/styleExtractor.test.ts` | **PASS** |
| `v23.REQ-001-AC-003` | 风格中心展示多端经典预设，并在 All / Web / App / Desktop 过滤下正确渲染徽章与色盘 | 组件测试 & E2E | `src/components/StyleCenterView.test.tsx`、`docs/spec/versions/v23/screenshots/06-style-center-all-templates.png` | **PASS** |
| `v23.REQ-002-AC-001` | 首页风格选择 Popover 提供平台分类筛选胶囊（All / App / Desktop / Web） | 组件测试 & E2E | `src/components/HomeGuideView.test.tsx`、`e2e/v23-style-presets.spec.ts` | **PASS** |
| `v23.REQ-002-AC-002` | 首页默认风格预设扩充并标记端形态，列表项渲染对应平台微图标与端徽章 | 组件测试 & 视觉回归 | `src/components/HomeGuideView.test.tsx`、`docs/spec/versions/v23/screenshots/02-home-style-popover-app.png` | **PASS** |
| `v23.REQ-002-AC-003` | 用户在首页切换分类后风格即时过滤，选中后正确展示激活徽章并向提示词注入 Design System Prompt | 组件测试 & E2E | `src/components/HomeGuideView.test.tsx`、`docs/spec/versions/v23/screenshots/05-home-selected-apple-health.png` | **PASS** |
