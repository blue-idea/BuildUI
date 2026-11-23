# TASK-001 App 技术路线验收报告

| 检查 | 实际结果 |
| --- | --- |
| TDD Red | 首页 App 的提示词仍指向 React，Go 创建结果缺少 Expo 文件和运行时标记，构建请求缺少 App 技术栈。各对应测试在实现前按预期失败。 |
| Go 竞态和覆盖率 | `go test -race -coverprofile=/tmp/buildui-v22-go.cover ./...` 通过。语句覆盖率 72.3%。 |
| React 测试 | `pnpm --dir frontend exec vitest run --coverage` 通过。36 个文件、242 个测试，行覆盖率 82%。 |
| 前端构建和检查 | `pnpm --dir frontend build` 通过。 `pnpm --dir frontend lint` 无错误，`WorkspacePanel.tsx` 有 1 处既存 Hook 依赖警告。 |
| Expo 实际构建 | 在临时项目执行依赖安装、`pnpm exec tsc --noEmit` 和 `pnpm exec expo export --platform all --max-workers 2` 成功。生成了 iOS、Android 的 Hermes 包及 Web 的 JS、CSS 和 HTML。 |
| Wails 端到端 | 使用真实 Wails 绑定、隔离工作区和 `docs/spec/info.md` 的本地模型端口。模拟模型返回蓝图和构建步骤，并故意引用缺失资源。实际 Metro 报错并触发模型修复。再次构建成功后，Playwright MCP 在工作台预览点按按钮，观察到 `Workout logged`。预览重启后还原初始状态，停止后 Wails 返回空预览地址。 |
| 视觉回归 | 对比同尺寸的 App 选项卡截图。每像素的 RGB 通道最大差值为 2（满值 255），未观察到布局差异。 |
| 预览验收范围 | 按用户确认，App 在工作台通过 React Native Web 预览。原生安装、分发和模拟器交互属于此次验收范围之外。 |

[基线](../screenshots/home-app-baseline.png) · [当前](../screenshots/home-app-current.png) · [像素差异](../screenshots/home-app-diff.png) · [蓝图](../screenshots/native-blueprint.png) · [预览交互](../screenshots/native-preview-workout-logged.png)

## 2026-11-24 工作台 Web 预览复验

以空白 Wails 工作区从首页 App 选项开始，使用本地测试模型生成缺失图片引用。Metro 构建触发一次修复，随后在工作台 iframe 加载 React Native Web。Playwright MCP 验证按钮由 `Log workout` 变为 `Workout logged`。点击 `Restart preview` 后按钮恢复初始状态。关闭项目后 iframe 消失，Wails 返回空预览地址，原本地端口拒绝连接。复验期间 iOS 和 Android 均无启动或连接的设备。

Go 竞态测试与前端 242 项测试全部通过，覆盖率分别为语句 72.3% 和行 82%。前端生产构建通过，Lint 无错误并保留既有的 Hook 依赖警告。

[Web 预览复验截图](../screenshots/native-web-preview-2026-11-24.png)
