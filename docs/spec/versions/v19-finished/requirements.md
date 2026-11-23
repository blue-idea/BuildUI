# v19 需求规格说明书 (Requirements)

> 规范版本：v19 · 创建日期：2026-11-23  
> 目标模块：工作台预览沙箱（preview-inspector.ts）、组件审查与局部编辑控制器（ComponentInspector / LocalEditPopover）、工作台集成面板（WorkspacePanel）

---

## 1. 业务背景与问题陈述

当前 BuildUI 提供了初步的组件审查模式，但在实际使用中存在以下体验痛点：
1. **审查与局部编辑脱节**：用户点击“组件审查”按钮后，状态定义不够明确，缺少统一的“局部编辑”心智传达。
2. **缺乏浏览器 DevTools 级别的点选交互与防跳转保护**：在预览沙箱中点选带链接（`<a>`）或交互跳转逻辑（如 `<button>`）的元素时，容易发生意料之外的页面路由跳转或表单提交，导致无法正常选中目标元素。
3. **缺少直观的选取区域盒模型框（Box Model）**：选中目标元素后，仅显示简单的单色矩形外边框，无法清晰分辨元素的内边距（Padding）、外边距（Margin）、边框（Border）与实际内容区域（Content），使得局部样式调整和 AI 提示词意图缺乏几何参考。

---

## 2. 需求列表

### v19.REQ-001: 审查按钮直达局部编辑状态 (Inspect Button Enters Local Edit State)
- **EARS 描述**: While in the workspace preview panel, when the user clicks the component inspector toggle button, the system shall activate the Local Edit Mode with explicit visual indicator and crosshair cursor.
- **验收标准 (AC)**:
  - **AC-001-1**: 点击组件审查按钮进入激活的局部编辑状态，顶部悬浮横幅展示“Local Edit Mode: Select Elements”，沙箱内光标切换为 `crosshair`。
  - **AC-001-2**: 审查按钮呈现激活高亮状态；再次点击或按 Exit 退出局部编辑状态，并自动清理高亮浮层与选中标记。

### v19.REQ-002: 仿浏览器开发者工具点选识别与防跳转 (DevTools-style Element Selection & Jump Prevention)
- **EARS 描述**: While Local Edit Mode is active, when the user hovers or clicks any preview element, the system shall trace element bounds like browser DevTools and strictly prevent default link navigation or form submission.
- **验收标准 (AC)**:
  - **AC-002-1**: 鼠标在预览沙箱移动时，实时追踪悬停目标，浮层徽章显示 `<tagName>`、类名以及计算尺寸 `width × height`。
  - **AC-002-2**: 在捕获阶段拦截所有 `click`、`auxclick` 等事件，严格执行 `preventDefault()` 与 `stopImmediatePropagation()`，确保点击仅识别选定区域，不发生任何页面跳转或表单提交。

### v19.REQ-003: 选中后选取区域盒模型框与图解呈现 (Selected Box Model Highlight Box & Diagram)
- **EARS 描述**: When an element is selected in Local Edit Mode, the system shall extract computed box model metrics and render a multi-layer box model highlight overlay in the preview and a box model visual card in the local edit popover.
- **验收标准 (AC)**:
  - **AC-003-1**: 提取并随 `buildui:element-selected` 发送目标元素的 `boxModel` 数据（margin, border, padding, content 的四向数值与绝对坐标）。
  - **AC-003-2**: 沙箱内高亮展示四层分色盒模型框（Margin: 浅橙, Border: 浅黄, Padding: 浅绿, Content: 浅蓝）并带有锁定尺寸标记。
  - **AC-003-3**: 局部编辑控制器（`LocalEditPopover`）中展示 DevTools 风格的盒模型图解小部件（Box Model Diagram），清晰展示盒模型四层数值。
