# v24 移动端路由自愈保障与蓝图待审批预览引导收官报告

## 1. 版本目标达成概述
本版本针对“所有生成的 App 预览页面始终停留在初始占位 Home 页面”的问题，从“后端确定性自愈保障”、“AI 提示词硬性约束”与“前端预览交互引导”三个维度实施了全链路闭环修复：

1. **确定性路由自愈引擎 (Deterministic Route Auto-healing)**：
   - 在 `internal/scaffold/expo_preview.go` 与 `internal/agent/model_chat.go` 中内置自愈检查 `AutoHealNativeRouterEntry`。
   - 只要检测到 Native 应用包含 `(tabs)` 且根 `index.tsx` 仍旧保持初始占位特征，系统在生成提交和启动 Expo 预览时自动将根入口重定向至 `/(tabs)`，彻底终结了文件残留遮蔽大模型生成界面的历史缺陷。

2. **Native 提示词约束规范强化**：
   - 在 `internal/agent/native_prompt.go` 中明确告知大模型：使用 `(tabs)` 路由时必须重写 `src/app/index.tsx` 为 `<Redirect href="/(tabs)" />`，严禁遗留初始占位组件。

3. **预览区蓝图待审批引导层**：
   - 在 `frontend/src/components/WorkspacePanel.tsx` 中新增待审批提示状态，未审批蓝图前不再展示困惑的脚手架初始占位或空白，而是清晰呈现状态说明与快捷操作按钮，审批后平滑恢复正常预览。

## 2. 质量与测试覆盖
- Go 核心包（`agent`, `scaffold`, `app`, `runner` 等 18 个包）全量通过。
- Vitest 57 个组件与主应用测试全量通过。
