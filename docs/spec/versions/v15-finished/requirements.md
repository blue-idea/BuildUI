# 需求文档（Requirements）· Blot-UI v15

> 文件路径：`docs/spec/versions/v15/requirements.md`  
> 规范版本：v15 · 日期：2026-11-23  
> 状态：已定稿（finalized）  
> 关联版本索引：[docs/spec/README.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/README.md)  
> 核心宪法继承：[docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 介绍

在当前的工作区面板（`WorkspacePanel`）中，顶部的拟真浏览器地址栏仅为一个静态不可编辑的 `<div>` 容器，直接呈现只读的 `previewUrl` 字符串。用户在开发多页面应用或测试路由跳转时，无法在地址栏中手动输入子路径（如 `/dashboard`、`/settings`、`/login`）进行定向跳转，极大地限制了多路由原型与复杂单页应用（SPA）的交互调试体验。

**v15 版本核心目标**：将工作台项目预览地址栏改造为全交互式的可编辑输入框，支持手动输入相对路由或完整 URL 并一键/回车跳转，同时接入沙箱内路由监听实现地址栏与沙箱内部跳转的双向同步（Interactive Address Bar, Manual Route Input & Navigation, and Two-Way Sandbox Route Sync）。

---

## 需求列表

---

### 需求 v15.REQ-001 · 预览地址栏手动路由输入与回车跳转

**用户故事：** 作为开发者，我希望在预览区顶部的地址栏中直接键入想要测试的路由路径（例如 `/dashboard`、`settings` 或带查询参数的 `/users?page=2`）并按回车键，预览沙箱能即时加载并跳转到对应页面。

#### 验收标准

```yaml
- id: v15.REQ-001-AC-001
  ears: >
    When the user views the WorkspacePanel in preview mode,
    the address bar shall render an interactive text input (with data-testid="browser-address-input") displaying the current active URL or route path.
  test_type: Component
  expected:
    ui_state: "地址栏呈现可聚焦编辑的 input 输入框，默认显示当前预览地址"
    side_effects: []

- id: v15.REQ-001-AC-002
  ears: >
    When the user types a relative route path (with or without leading slash, e.g. '/dashboard' or 'settings') or an absolute URL into the address input and presses Enter or submits the form,
    the WorkspacePanel shall resolve the target URL and command the preview iframe to navigate to that destination.
  test_type: Component
  expected:
    ui_state: "iframe.src 更新为目标地址，地址栏同步保持最新路由"
    side_effects:
      - "iframe 触发导航"

- id: v15.REQ-001-AC-003
  ears: >
    When the user presses the Escape key while typing in the address input,
    the address input shall revert its text value to the current active route/URL and blur the input.
  test_type: Component
  expected:
    ui_state: "输入内容还原，焦点退出输入框"
    side_effects: []

- id: v15.REQ-001-AC-004
  ears: >
    When the user clicks the browser Back or Forward navigation buttons,
    the component shall safely invoke history.back() or history.forward() on the preview iframe window.
  test_type: Component
  expected:
    ui_state: "iframe 执行历史回退或前进"
    side_effects: []
```

---

### 需求 v15.REQ-002 · 预览沙箱内部路由变化与地址栏双向同步

**用户故事：** 当我在预览沙箱内部点击页面中的导航链接（如 `<Link to="/about">`）或触发程序化跳转时，顶部的地址栏能自动保持同步更新，实时反映沙箱当前的真实路由。

#### 验收标准

```yaml
- id: v15.REQ-002-AC-001
  ears: >
    When the application inside the preview sandbox executes history.pushState, history.replaceState, or fires popstate/hashchange events,
    the sandbox preview inspector script shall dispatch a 'buildui:route-changed' message containing the current pathname and URL to the parent window.
  test_type: Unit
  expected:
    ui_state: "向 parent 发送包含 pathname 与 url 的结构化事件"
    side_effects: []

- id: v15.REQ-002-AC-002
  ears: >
    When WorkspacePanel receives a 'buildui:route-changed' event from the preview iframe,
    the address bar input shall automatically update its display value to match the active route path or URL.
  test_type: Integration
  expected:
    ui_state: "地址栏自动同步为沙箱最新路由"
    side_effects: []
```
