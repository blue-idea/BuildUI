# v24 移动端路由自愈保障与蓝图待审批预览引导规格需求

## 1. 业务背景与问题分析
用户反馈在创建和生成移动端 App（Expo + React Native + NativeWind）后，右侧手机预览画面始终停留在脚手架最初的默认占位页面（`Home / Your app is ready to build`）。经实证排查，存在两大系统性成因：
1. **路由冲突与遮蔽**：脚手架根目录预置了 `src/app/index.tsx`。AI 在生成多 Tab 移动应用时，生成了 `src/app/(tabs)/_layout.tsx` 和 `src/app/(tabs)/index.tsx`，但未覆盖根目录的占位文件。Expo Router 优先匹配根路径 `/` 到旧的 `src/app/index.tsx`，导致新生成的页面被完全遮蔽。
2. **蓝图待审批阶段缺少视觉引导**：系统实行蓝图门禁机制（第一阶段仅生成蓝图，不写代码）。用户在首页点击开始构建后，若未在聊天区点击【Approve Blueprint】，代码根本不会写入。此时预览区如果显示，即为脚手架初始占位，用户产生“已生成完毕但预览无效”的困惑。

## 2. 需求条目与验收标准 (EARS & AC)

### v24.REQ-001：Native 路由冲突确定性自愈与提示词强化
- **v24.REQ-001-AC-001 (Prompt Enforcement)**：在 `internal/agent/native_prompt.go` 的 `nativeRouterScaffold` 中强化规则：明确当使用 `(tabs)` 或其他多路由结构时，必须覆盖重写 `src/app/index.tsx`（例如将其重定向为 `<Redirect href="/(tabs)" />`），或将主屏直接写入 `src/app/index.tsx`，严禁遗留初始占位代码。
- **v24.REQ-001-AC-002 (Deterministic Auto-healing)**：在 Go 后端中增加确定性自愈逻辑（如在 `scaffold.PrepareExpoPreview` 或工作区准备阶段）：
  - 检查项目是否为 Native Expo 应用（`workspace.UsesExpo`）；
  - 若检测到工程中存在 `src/app/(tabs)`（或子目录含有其 index），且根目录 `src/app/index.tsx` 仍旧保持初始脚手架模版指纹（包含 `"Your app is ready to build"` 或 HomeScreen 模板）；
  - 系统自动执行确定性自愈，将 `src/app/index.tsx` 重写为标准的 Expo Router 重定向：
    ```tsx
    import { Redirect } from 'expo-router';

    export default function Index() {
      return <Redirect href="/(tabs)" />;
    }
    ```
  - 确保不论大模型是否遗漏该文件，预览服务启动时 100% 能够直接重定向并渲染大模型生成的 `(tabs)` 主界面。
- **v24.REQ-001-AC-003 (Unit Test Coverage)**：为上述自愈逻辑编写完整的 Go 单元测试，覆盖各种边界（有 tabs 且为初始模版、已自定义 index.tsx、非 Native 项目等）。

### v24.REQ-002：工作区预览区蓝图待审批状态引导
- **v24.REQ-002-AC-001 (Blueprint Pending Guidance Overlay)**：
  - 在前端 `WorkspacePanel` 中，当活跃应用的蓝图处于待审批状态（`blueprint && !blueprint.approved`）时，在右侧预览区域渲染清晰的引导状态层。
  - 明确展示标题 `Blueprint Pending Approval`，说明 `Review the blueprint and click "Approve Blueprint" in the conversation to start building your application.`，并带有醒目图标与操作提示。
- **v24.REQ-002-AC-002 (Smooth Transition upon Approval)**：
  - 当用户在聊天界面点击【Approve Blueprint】审批通过后，待审批引导层自动撤销，平滑过渡至代码生成与预览加载状态。
- **v24.REQ-002-AC-003 (Vitest Component Test)**：
  - 编写 React 单元测试，验证未审批状态下的引导展示与审批后的平滑过渡。
