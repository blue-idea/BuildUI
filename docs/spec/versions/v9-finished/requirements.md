# 需求文档（Requirements）· Blot-UI v9

> 文件路径：`docs/spec/versions/v9/requirements.md`  
> 规范版本：v9 · 日期：2026-11-22  
> 状态：定稿实施中（active）  
> 关联版本索引：[docs/spec/README.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/README.md)  
> 核心宪法继承：[docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 介绍

在 Blot-UI 的左侧导航栏（LeftDock）中，一直保留有“组件库（components）”图标入口，但目前仅作为辅助审查模式的简单开关，未提供独立的组件中心与插件扩展市场视图。
随着应用智能化与模型生态的拓展，用户需要能够为 AI 助手扩展工具能力的组件生态——即连接外部插件（Plugins / MCP Servers，模型上下文协议服务），从而使 AI 在构建应用时能够调用支付、部署、AI模型生成、计算机视觉等多维度工具能力。

**v9 版本核心目标**：实现组件库与插件市场中心（Plugins & Component Catalog View），包括：
1. **独立组件库/插件中心主视图**：点击 LeftDock 组件库图标即可直达独立的 `ComponentCenterView`，提供完整的顶部导航（Go Back、Plugins 标题与说明、+ Add Plugin 按钮）及实时统计（已安装插件数与可用工具数）；
2. **精选与分类目录检索（Curated Catalog & Category Discovery）**：支持从目录快速添加（Add from catalog），按 `Featured`（精选）与 `AI & Media`（AI 与多媒体）等分类卡片化展示插件，支持实时模糊搜索（Search catalog）；
3. **一键添加与安装状态管理（Add & Installed State Management）**：提供从目录一键安装至当前工作区的功能，已添加后动态更新启用状态与可用工具计数；
4. **自定义添加插件模态框（Custom Add Plugin Modal）**：支持手动配置新增 MCP 服务插件（插件名称、端点/命令、描述等），并即时生效。

---

## 需求列表

---

### 需求 v9.REQ-001 · 独立组件库/插件中心主视图与导航联动

**用户故事：** 作为开发者，我希望在点击左侧微坞的“组件库”导航时，能够进入专属的插件与组件市场页面，并能随时返回上一个工作界面。

#### 验收标准

```yaml
- id: v9.REQ-001-AC-001
  ears: >
    When the user clicks the components icon in LeftDock,
    the application shall activate the components dock tab and render the ComponentCenterView in the main view area.
  test_type: Component
  expected:
    ui_state: "渲染 ComponentCenterView，data-testid='component-center-view' 存在"
    side_effects: []

- id: v9.REQ-001-AC-002
  ears: >
    When the ComponentCenterView is displayed,
    it shall render a 'Go Back' navigation button, the 'Plugins' title, subtitle 'Connect plugins (MCP servers) to give the AI new tools.', and a '+ Add Plugin' action button.
  test_type: Component
  expected:
    ui_state: "包含 Go Back 按钮、Plugins 标题、说明文案及 + Add Plugin 按钮"
    side_effects: []

- id: v9.REQ-001-AC-003
  ears: >
    When the user clicks the 'Go Back' button,
    the application shall navigate back to the previous dock tab (builder or home).
  test_type: Component
  expected:
    ui_state: "返回先前的 dock 视图"
    side_effects: []
```

---

### 需求 v9.REQ-002 · 精选与分类目录检索与卡片展示

**用户故事：** 作为开发者，我希望在插件市场中按分类浏览精选的 MCP 插件卡片，并能通过关键词实时搜索过滤。

#### 验收标准

```yaml
- id: v9.REQ-002-AC-001
  ears: >
    When viewing the catalog section,
    the view shall display 'Add from catalog' section with grouped categories including 'Featured' and 'AI & Media', each containing plugin cards.
  test_type: Component
  expected:
    ui_state: "包含 Featured 分类（如 Stripe, Vercel）及 AI & Media 分类（如 Hugging Face, HeyGen, Higgsfield, Roboflow, Braintrust）"
    side_effects: []

- id: v9.REQ-002-AC-002
  ears: >
    When each plugin card is rendered,
    it shall display the plugin icon, title, OAuth/protocol badge, description, service domain, and an 'Add' action button.
  test_type: Component
  expected:
    ui_state: "卡片结构完整包含品牌标识、名称、badge、描述、域名与 Add 按钮"
    side_effects: []

- id: v9.REQ-002-AC-003
  ears: >
    When the user inputs text into the 'Search catalog' input field,
    the catalog list shall instantly filter cards by name, description, or domain matching the search query case-insensitively.
  test_type: Component
  expected:
    ui_state: "仅展示匹配关键词的插件卡片，无匹配时展示相应提示"
    side_effects: []
```

---

### 需求 v9.REQ-003 · 插件一键安装与已安装状态统计

**用户故事：** 作为开发者，我希望点击卡片上的 Add 按钮将插件添加到已启用插件库中，并实时看到插件与工具计数的变化。

#### 验收标准

```yaml
- id: v9.REQ-003-AC-001
  ears: >
    When no plugins are installed,
    the view shall show the summary '0 plugins · 0 tools enabled' and the empty state message 'No plugins added yet.'.
  test_type: Component
  expected:
    ui_state: "未添加插件时准确展示空状态文本与零计数"
    side_effects: []

- id: v9.REQ-003-AC-002
  ears: >
    When the user clicks the 'Add' button on a catalog plugin card,
    the plugin shall be added to the installed list, the status summary count shall increment, and the card action button shall reflect the added state.
  test_type: Component
  expected:
    ui_state: "安装后插件进入已安装区域，统计更新为例如 '1 plugins · X tools enabled'，按钮变为 Added 或提供配置/移除"
    side_effects: []
```

---

### 需求 v9.REQ-004 · 自定义添加插件弹窗（Custom Add Plugin Modal）

**用户故事：** 作为开发者，我希望能够自定义添加自建的 MCP Server（如本地 CLI 或私有端点），以满足定制化开发工具链需求。

#### 验收标准

```yaml
- id: v9.REQ-004-AC-001
  ears: >
    When the user clicks '+ Add Plugin',
    a modal dialog shall appear prompting for custom plugin name, server URL or command, and description.
  test_type: Component
  expected:
    ui_state: "弹出 Add Plugin Modal 对话框，包含完整表单字段"
    side_effects: []

- id: v9.REQ-004-AC-002
  ears: >
    When valid details are submitted in the modal,
    the new custom plugin shall be appended to the installed plugins and appear in the installed list.
  test_type: Component
  expected:
    ui_state: "模态框关闭，新增插件立即展示在已安装区域"
    side_effects: []
```
