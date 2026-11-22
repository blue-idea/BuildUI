# 需求文档（Requirements）· Blot-UI v11

> 文件路径：`docs/spec/versions/v11/requirements.md`  
> 规范版本：v11 · 日期：2026-11-22  
> 状态：定稿实施中（active）  
> 关联版本索引：[docs/spec/README.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/README.md)  
> 核心宪法继承：[docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 介绍

在通过 AI 生成应用程序界面的开发流程中，直接输入大篇幅全局提示词（如“请重新修改整个界面的所有按钮和列表”）容易导致无关模块被破坏或代码大规模重写。开发者迫切需要一种现代化的 **“所见即所得”局部精准编辑体验**：
1. 开发者在实时沙箱预览区直接鼠标悬停并点击想要修改的具体 UI 元素（例如特定的按钮、导航标题、卡片、表单输入框等）；
2. 系统自动捕获并锁定该元素的上下文信息（HTML 标签、当前 CSS/Tailwind 类名、文案内容、以及映射的目标源代码组件路径）；
3. 弹出定向局部编辑控制器（Targeted Local Edit Controller），提供常用快捷修改指令（如修改文案、调整背景色、增大间距、修改圆角等）以及自由输入的精准局部修改指令；
4. 发起修改时，系统精准锁定目标组件范围，将局部修改意图定向注入对话生成流中，仅重构目标局部代码，保护全局应用架构不受破坏。

**v11 版本核心目标**：实现可视化元素点选与定向局部 AI 编辑（Visual Element Selection & Targeted Local AI Editing）。

---

## 需求列表

---

### 需求 v11.REQ-001 · 预览区可视化元素悬停与点选锁定

**用户故事：** 作为开发者，我希望在开启检查/局部编辑模式时，鼠标在预览沙箱中悬停能清晰看到元素高亮边框和标签名，点击即可锁定目标元素。

#### 验收标准

```yaml
- id: v11.REQ-001-AC-001
  ears: >
    When the user activates Inspector Mode in PreviewPanel,
    the application shall overlay an interactive element selector allowing hover inspection and click selection of DOM/component elements.
  test_type: Component
  expected:
    ui_state: "激活检查模式后进入元素交互点选状态，包含正在检查指示条与退出按钮"
    side_effects: []

- id: v11.REQ-001-AC-002
  ears: >
    When the user hovers over an element in the inspector,
    an element highlight box shall follow the target element showing its tagName (e.g. <button>, <nav>, <h2>) and component location.
  test_type: Component
  expected:
    ui_state: "显示高亮边框与标签提示徽章"
    side_effects: []

- id: v11.REQ-001-AC-003
  ears: >
    When the user clicks a targeted element,
    the inspector shall lock the selection and open the Targeted Local Edit popover/card over the selected element.
  test_type: Component
  expected:
    ui_state: "目标元素锁定，弹出局部编辑面板，包含元素标签、类名与文件路径"
    side_effects: []
```

---

### 需求 v11.REQ-002 · 局部编辑控制器与快捷预设指令

**用户故事：** 作为开发者，我希望在锁定元素后能直观查看元素详情，并通过一键快捷预设或自定义指令快速表达修改需求。

#### 验收标准

```yaml
- id: v11.REQ-002-AC-001
  ears: >
    When the Targeted Local Edit popover is displayed,
    it shall render element metadata (tagName, componentPath, currentClasses) and a dedicated targeted prompt textarea.
  test_type: Component
  expected:
    ui_state: "元数据清晰展示，提供文本输入框供输入精准 AI 指令"
    side_effects: []

- id: v11.REQ-002-AC-002
  ears: >
    When the user clicks any quick action pill (such as 'Change Color', 'Update Text', 'Adjust Padding', 'Full Rounded'),
    the targeted prompt textarea shall instantly populate with structured template prompt for that quick action.
  test_type: Component
  expected:
    ui_state: "快捷药丸按钮点击后自动填充模板指令至输入框中"
    side_effects: []
```

---

### 需求 v11.REQ-003 · 定向局部编辑指令注入与 AI 代码重构

**用户故事：** 作为开发者，我希望提交局部编辑指令后，系统将精准上下文填入会话流并自动触发针对该组件的局部重构。

#### 验收标准

```yaml
- id: v11.REQ-003-AC-001
  ears: >
    When the user submits the targeted edit prompt,
    the application shall format the prompt with targeted component context (e.g., '@[componentPath] Edit [element]: ...'), populate the chat input, and automatically switch to builder view if not already there.
  test_type: Component
  expected:
    ui_state: "输入框填入结构化定向指令，关闭检查浮层，准备触发 AI 局部生成"
    side_effects: []

- id: v11.REQ-003-AC-002
  ears: >
    When the user presses Escape or clicks Cancel on the local edit popover,
    the selection shall be cleared without submitting any prompt.
  test_type: Component
  expected:
    ui_state: "清空选中状态并关闭浮层"
    side_effects: []
```
