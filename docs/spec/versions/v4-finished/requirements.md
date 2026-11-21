# 需求规格说明书（Requirements）· Blot-UI v4

> 文件路径：`docs/spec/versions/v4/requirements.md`  
> 规范版本：v4 · 日期：2026-11-21  
> 状态：草案（Draft）  
> 核心目标：智能第三方依赖管理与自动安装、UI 视觉主题预设引擎与预览沙箱双向实时注入  
> 架构基准：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)  
> 继承规则：`docs/spec/steering/` 与 `docs/spec/versions/v1-finished/constitution.md`

---

## 1. 业务背景与演进目标

在完成 v1、v2 与 v3 的里程碑交付后，Blot-UI 已具备完整的多应用工作空间管理、蓝图审批门禁、XML 流式生成落盘、TypeScript 自动自愈校验、Git 版本时光机与组件级可视化精准定位修改能力。  
**v4 版本的核心演进目标**是突破单工程静态能力的限制，赋予应用**丰富的现代生态扩展力**与**卓越的视觉定制能力**：

1. **智能第三方依赖管理与沙箱自动安装（Dynamic Dependency Manager & Automatic Sandbox Installation）**：
   - 当大模型生成复杂的现代前端交互（如采用 `lucide-react` 图标库、`recharts` 图表库、`framer-motion` 动效库或 `canvas-confetti`）时，系统自动识别并提取依赖包信息；
   - 在应用工作空间中异步静默执行依赖安装，并实时推流安装状态至前端界面，避免因缺少包导致白屏或 Vite 崩溃。
2. **UI 视觉主题预设引擎与预览沙箱双向动态注入（UI Theme Engine & Dynamic Style Injection）**：
   - 提供内置风格预设主题集（如 Dark Slate, Cyberpunk Neon, Forest Emerald, Sunset Glow, Clean Light）；
   - 支持在主界面顶部一键切换主题，通过跨框架/跨沙箱 `postMessage` 机制将 CSS 变量即时注入预览 iframe，实现零刷新瞬间主题变换；
   - 主题配置随应用 Blueprint 状态持久化至 SQLite，在应用切换后无缝恢复。

---

## 2. 需求列表与 EARS 验收标准

---

### 需求 v4.REQ-001 · 智能第三方依赖管理与沙箱自动安装

**用户故事：** 作为 前端应用创作者，我希望 系统在我提出复杂图表或图标组件需求时，能智能检测并自动在沙箱中安装相应的 npm 依赖，以便 我无需手动跳出到终端执行命令即可立即预览完整效果。

#### 验收标准

```yaml
- id: v4.REQ-001-AC-001
  ears: >
    When the XML stream parser encounters a '<boltAction type="add_dependency">' tag
    or detects undeclared npm package imports in generated code,
    the DependencyService shall extract package names and versions,
    validate them against an npm package naming whitelist to prevent command injection,
    and update the workspace 'package.json'.
  test_type: Unit
  expected:
    return_value: "[]DependencyItem, valid=true"
    throws: null
    side_effects:
      - "Workspace package.json dependencies updated"

- id: v4.REQ-001-AC-002
  ears: >
    When new dependencies are detected during generation,
    the AppRunner shall execute 'pnpm add <packages>' asynchronously within the workspace,
    forward real-time stdout/stderr lines to the frontend event channel,
    and trigger preview hot-module reload without crashing the Vite dev server.
  test_type: Integration / E2E
  expected:
    ui_state: "Tool progress indicator shows 'Installing dependencies...' then completes"
    side_effects:
      - "node_modules updated with target package"
      - "Preview iframe hot-reloaded"

- id: v4.REQ-001-AC-003
  ears: >
    If a package installation fails due to network outage or invalid package name,
    the AppRunner shall capture the stderr, mark the action as failed with a BlotError,
    notify the user in the chat timeline, and allow one-click retry.
  test_type: Unit
  expected:
    return_value: "error containing KindExternal or KindValidation"
    throws: "BlotError"
    side_effects:
      - "Error displayed in chat stream"
```

---

### 需求 v4.REQ-002 · UI 视觉主题预设引擎与预览沙箱双向动态注入

**用户故事：** 作为 应用设计者，我希望 能在多个高质量主题预设中自由切换，并瞬间在实时预览中看到配色的整体改变，以便 快速探索和确立应用的最佳视觉风格。

#### 验收标准

```yaml
- id: v4.REQ-002-AC-001
  ears: >
    The system shall define and register built-in theme presets
    including 'dark-slate' (default), 'cyberpunk-neon', 'forest-emerald', and 'sunset-glow',
    each specifying semantic CSS color tokens for primary, background, surface, text, and border.
  test_type: Unit
  expected:
    return_value: "[]ThemePreset, length >= 4"
    throws: null
    side_effects: []

- id: v4.REQ-002-AC-002
  ears: >
    When the user selects a new theme preset from the ThemeSelector dropdown in the header,
    the UI shall immediately apply the theme tokens to the host dashboard,
    and dispatch a 'THEME_INJECT' message with the color token map to the preview iframe,
    updating CSS custom properties ':root' without reloading the document.
  test_type: UI / E2E
  expected:
    ui_state: "Host and preview iframe reflect newly selected color palette instantly"
    side_effects:
      - "postMessage sent to iframe"
      - "Active theme updated in App state"

- id: v4.REQ-002-AC-003
  ears: >
    When an application's theme is changed or a new app is created,
    the system shall persist the theme_id to the database 'blueprints' table,
    and restore the corresponding theme preset when that application is activated.
  test_type: Unit / Integration
  expected:
    return_value: "theme_id string persisted and loaded"
    throws: null
    side_effects:
      - "Database blueprint record theme_id column updated"
```

---

## 3. 非功能性需求（NFR）

1. **依赖安全性防护（Package Name Sanitization）**：严格正则校验待安装包名（格式需满足 `^(@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*(@[a-z0-9-._~^><=]+)?$`），禁止任何分号、管道符、反引号及 shell 元字符，杜绝命令注入。
2. **主题注入性能（Zero Flash & Zero Reload）**：主题切换延迟需控制在 50ms 以内，通过 DOM `style.setProperty` 动态注入 CSS 变量，严禁触发整个 iframe 的销毁与重新初始化。
3. **平台稳定性（Fault-Tolerant Runners）**：依赖安装过程与已启动的 Vite 服务器并行运行，网络中断或安装超时不应导致前端主界面冻结或桌面崩溃。
