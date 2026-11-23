# v20 任务清单 (Tasks)

> 规范版本：v20 · 创建日期：2026-11-23  
> 关联需求：[requirements.md](file:///e:/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v20/requirements.md) · [design.md](file:///e:/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v20/design.md)

---

## 任务列表

### TASK-081: 后端 Vision LLM 风格提取核心服务实现 (`internal/theme`)
- [x] **执行步骤**:
  1. 在 `internal/theme/style.go` 中定义 `ExtractStyleRequest`、`ColorPaletteDTO` 和 `ExtractedStyleDTO` 数据结构。
  2. 在 `internal/theme/theme.go` 中扩展 `ThemeService`，增加 `SettingsRepository` 依赖与 `loadModel` 多服务商载入能力。
  3. 实现结构化 Prompt 组装、支持图片多模态 `llm.ChatMessage` 的请求构造，以及 Markdown/JSON 清洗反序列化器。
  4. 编写 `internal/theme/style_test.go`，覆盖普通文本输入、多模态图片输入、非合规 JSON 清洗与缺少配置时的错误返回。
- [x] **关联 AC**: `v20.REQ-001-AC-001`, `v20.REQ-001-AC-002`, `v20.REQ-001-AC-003`, `v20.REQ-001-AC-004`
- [x] **测试类型**: Go 单元测试 (`go test ./internal/theme/...`)

---

### TASK-082: Wails 主进程 RPC 桥接与端点暴露 (`app.go`)
- [x] **执行步骤**:
  1. 在 `app.go` 中为 `ThemeService` 注入 `settingsRepo`。
  2. 实现 `(a *App) ExtractStyle(req theme.ExtractStyleRequest) (*theme.ExtractedStyleDTO, error)` 方法并绑定至 Wails。
  3. 编写对应测试确保 RPC 路由与参数透传正确。
- [x] **关联 AC**: `v20.REQ-001-AC-005`
- [x] **测试类型**: Go 集成测试 (`go test ./...`)

---

### TASK-083: 前端风格提取器集成模型选择器与提取加载态
- [x] **执行步骤**:
  1. 在 `StyleExtractor.tsx` 输入区域内嵌 `ModelSelector`，支持选择 `Auto` 或任意已配置的服务商模型，并在无可用模型时提示前往设置。
  2. 改造 `handleExtract` 逻辑：异步调用 `desktopApp().ExtractStyle`，显示提取中的加载中动画与状态文字（禁用重复点击）。
  3. 提取成功后无缝更新状态，渲染真实大模型提取的色彩矩阵、实时 UI 卡片微预览与 `stylePrompt`；发生错误时给出友好错误提示。
  4. 更新 `StyleCenterView.tsx` 与 `App.tsx` 确保参数（`settings`、`onOpenSettings`）向下透传通畅。
  5. 编写/更新前端 Vitest 单元测试（`StyleExtractor.test.tsx`、`StyleCenterView.test.tsx`），覆盖模型切换、提取中 loading、成功展示与异常捕获。
- [x] **关联 AC**: `v20.REQ-002-AC-001`, `v20.REQ-002-AC-002`, `v20.REQ-002-AC-003`, `v20.REQ-002-AC-004`, `v20.REQ-003-AC-001`, `v20.REQ-003-AC-002`
- [x] **测试类型**: React 单元与组件测试 (`pnpm test:run`)

---

### TASK-084: 全栈质量验证与 Playwright 视觉回归验收
- [x] **执行步骤**:
  1. 执行 Go 后端全模块测试，确保 23 个包全部 PASS。
  2. 执行前端 Vitest 测试套件与 TypeScript 生产构建（`npm run build`），确保 0 警告 0 错误。
  3. 使用 Playwright MCP 在开发模式下进行交互操作，测试模型选择、风格提取过程与提取结果呈现，保留高清截图留证并归档到 `docs/spec/versions/v20/reports/screenshots/`。
  4. 输出完整的 `v20-final-report.md` 交付报告。
- [x] **关联 AC**: 全量 AC
- [x] **测试类型**: 桌面端 E2E & 视觉回归验收
