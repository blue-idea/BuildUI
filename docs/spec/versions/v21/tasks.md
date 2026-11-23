# v21 任务清单 (Tasks)

> 规范版本：v21 · 创建日期：2026-11-23  
> 关联需求：[requirements.md](file:///e:/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v21/requirements.md) · [design.md](file:///e:/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v21/design.md)

---

## 任务列表

### TASK-085: 后端多应用类型参数接收、定制化领域 Prompt 构建与 DTO 增强 (`internal/theme`)
- [x] **执行步骤**:
  1. 在 `internal/theme/style.go` 中为 `ExtractStyleRequest` 与 `ExtractedStyleDTO` 增加 `AppType` 字段（默认 `"web"`）。
  2. 实现 `buildStyleSystemPrompt(appType string) string`，针对 Web、App、Desktop 分别注入平台特定的交互与布局指导。
  3. 编写 `internal/theme/style_test.go` 单元测试，断言不同 `AppType`（空值默认 web、app、desktop）请求时 System Prompt 中包含对应的设计规约指令。
- [x] **关联 AC**: `v21.REQ-001-AC-001`, `v21.REQ-001-AC-002`
- [x] **测试类型**: Go 单元测试 (`go test ./internal/theme/...`)

---

### TASK-086: 前端风格提取器应用类型选择交互与本地算法改造
- [x] **执行步骤**:
  1. 在 `frontend/src/utils/styleExtractor.ts` 中改造 `extractStyleFromReference` 与 `buildDesignSystemPrompt`，支持传入 `appType`，定制标签与 Prompt 说明。
  2. 在 `StyleExtractor.tsx` 中增加应用类型单选胶囊（Web / App / Desktop，默认 Web），点击切换并随请求透传。
  3. 提取结果卡片展示平台类型徽章，分色渲染；更新国际化翻译词条（`appTypeWeb`, `appTypeApp`, `appTypeDesktop`）。
  4. 编写 `StyleExtractor.test.tsx` 单元测试，验证应用类型切换与请求参数透传。
- [x] **关联 AC**: `v21.REQ-001-AC-003`, `v21.REQ-002-AC-001`, `v21.REQ-002-AC-002`, `v21.REQ-002-AC-003`
- [x] **测试类型**: React 单元与组件测试 (`pnpm test:run StyleExtractor`)

---

### TASK-087: 风格模版库应用类型徽章标注与分类筛选
- [x] **执行步骤**:
  1. 在 `frontend/src/types/style.ts` 与 `ThemeSelector.tsx` 中增加 `appType?: 'web' | 'app' | 'desktop'` 属性。
  2. 在 `StyleCenterView.tsx` 模版卡片右上角渲染端形态徽章（Badge），未标注历史模版默认按 Web 渲染。
  3. 在模版库顶部增加类型筛选器（全部 / Web / App / Desktop），点击过滤可用模版列表。
  4. 编写 `StyleCenterView.test.tsx` 测试，验证模版卡片徽章显示与分类过滤行为。
- [x] **关联 AC**: `v21.REQ-003-AC-001`, `v21.REQ-003-AC-002`, `v21.REQ-003-AC-003`
- [x] **测试类型**: React 组件测试 (`pnpm test:run StyleCenterView`)

---

### TASK-088: 全栈质量验证与 Playwright 视觉回归验收
- [x] **执行步骤**:
  1. 执行 Go 后端全模块测试，确保 23 个包 100% PASS。
  2. 执行前端 Vitest 测试套件与 TypeScript 生产编译，确保 0 错误 0 警告。
  3. 使用 Playwright MCP 在开发模式下进行交互操作，截取应用类型选择、提取结果徽章及模版库筛选的高清截图留证。
  4. 编写并输出完整的 `v21-final-report.md` 交付报告。
- [x] **关联 AC**: 全量 AC
- [x] **测试类型**: 桌面端 E2E & 视觉回归验收
