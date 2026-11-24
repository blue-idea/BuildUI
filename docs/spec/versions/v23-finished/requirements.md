# v23 经典多端风格扩充与首页预设分类显示规格需求

## 1. 业务背景与目标
为使应用生成从纯 Web 扩展到移动端 App 与桌面端 Desktop 时拥有原生标杆级视觉品质，需要在风格与设计中心扩充经典的 App（移动端）与 Desktop（桌面客户端）标杆设计系统；同时，首页设计预设选择 Popover 需要支持按照 App、Web、Desktop 进行分类显示与筛选，方便用户快速为不同端形态匹配最佳视觉语言。

## 2. 需求条目与验收标准 (EARS & AC)

### v23.REQ-001：风格与设计中心经典 App 与 Desktop 风格扩充
- **v23.REQ-001-AC-001**：在标杆预设库（`BENCHMARK_PRESETS` 及 `getBenchmarkThemePresets`）中增加经典移动端 App 设计系统预设，包括：
  1. `ios-health`: Apple Health Inspired (OLED 纯黑、荧光三环、大触控区圆角)
  2. `threads`: Threads Mobile Inspired (极简黑白、圆润信息流卡片)
  3. `duolingo`: Duolingo Mobile Inspired (活力明黄绿、游戏化扁平按钮)
  4. `cashapp`: Cash App Mobile Inspired (高对比深黑荧光绿、金融极简)
- **v23.REQ-001-AC-002**：在标杆预设库中增加经典桌面客户端 Desktop 设计系统预设，包括：
  1. `windows-fluent`: Windows Fluent Mica Inspired (亚克力毛玻璃、精细边框层次)
  2. `slack`: Slack Workstation Inspired (经典深紫侧边栏多栏工作台)
  3. `vscode`: VS Code Pro Dark Inspired (深炭灰极客工作台、状态栏精密分割)
  并确保已有的 Apple、Raycast 稳定归属为 `desktop` 形态。
- **v23.REQ-001-AC-003**：风格中心（`StyleCenterView`）在 All、Web、App、Desktop 筛选过滤下，准确统计和渲染各形态经典风格模版，正确呈现形态徽章（Badge）与色盘预览。

### v23.REQ-002：首页设计预设按 App / Web / Desktop 分类显示
- **v23.REQ-002-AC-001**：首页风格选择弹窗（Popover）提供平台分类筛选胶囊（`All` / `App` / `Desktop` / `Web`），用户可一键切换查看对应端形态的设计预设。
- **v23.REQ-002-AC-002**：首页默认风格预设（`DEFAULT_STYLE_PRESETS`）扩充并赋予 `appType`，首页风格列表项均带有对应端形态徽章或微图标（Smartphone、Monitor、Globe），使平台属性一目了然。
- **v23.REQ-002-AC-003**：用户切换分类时列表即时过滤；点击选中特定预设后，该预设被正确设为激活状态，首页操作栏显示选中徽章，构建提示词中注入该设计系统的专属 Prompt。
