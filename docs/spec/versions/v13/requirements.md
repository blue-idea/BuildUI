# 需求文档（Requirements）· Blot-UI v13

> 文件路径：`docs/spec/versions/v13/requirements.md`  
> 规范版本：v13 · 日期：2026-11-22  
> 状态：已定稿（finalized）  
> 关联版本索引：[docs/spec/README.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/README.md)  
> 核心宪法继承：[docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 介绍

在可视化原型与全栈应用生成的开发流程中，用户希望在预览界面中直接“指哪打哪”：
1. 开发者无需在代码文件中翻找某个按钮或容器写在哪个文件的第几行；
2. 可以在实时预览沙箱中自由悬停与点选界面的**任意元素**（自由选取页面元素）；
3. 系统自动分析该元素，**精准定位其对应的源文件路径与完整的代码区域/行号范围（默认定位该容器元素的完整起始与闭合标签范围 Lines XX-YY）**，并提取出当前的原始代码片段；
4. 弹出局部定向编辑弹窗，直观呈现锁定的代码片段，并允许用户**一键切换到 Code 视图**查看与定位，或输入修改需求（借助快捷预设与自由 Prompt）；
5. 提交后系统组织工业级定向局部编辑 Prompt（附带代码区域上下文与零破坏铁律），**利用 AI 进行局部定向精准编辑与热更新**。

**v13 版本核心目标**：实现页面元素自由点选、源码文件与外层容器完整代码区域精准定位、一键跳转 Code 视图、以及基于代码上下文的定向局部 AI 编辑闭环（Free Visual Element Selection, Full Boundary Source & Code Region Localization, Code View Switching, and Targeted Local AI Editing）。

---

## 需求列表

---

### 需求 v13.REQ-001 · 预览沙箱任意元素自由点选与实时悬停高亮

**用户故事：** 作为开发者，我希望在预览区开启检查/局部编辑模式时，鼠标在沙箱页面内移动能自由悬停在任意元素上并看到高亮外框与标签提示，点击任意元素即可精确锁定该元素。

#### 验收标准

```yaml
- id: v13.REQ-001-AC-001
  ears: >
    When the user activates Inspector Mode in WorkspacePanel,
    the preview sandbox iframe shall enable free element inspection, tracking mouse movements to render an active hover highlight box with tagName and component path badge over any hovered DOM element.
  test_type: Component
  expected:
    ui_state: "审查模式激活后，沙箱内光标切换为十字准星，鼠标悬停元素显示高亮边框和标签提示浮条"
    side_effects: []

- id: v13.REQ-001-AC-002
  ears: >
    When the user clicks any DOM element inside the preview sandbox during inspector mode,
    the event listener shall prevent default link navigation or form submission, lock the target element with a persistent outline, and capture its element metadata (tagName, className, textSnippet, boundingBox, and raw data-dyad-id location).
  test_type: Component
  expected:
    ui_state: "目标元素被锁定高亮，阻止原始点击事件冒泡"
    side_effects: []

- id: v13.REQ-001-AC-003
  ears: >
    When a target DOM element is clicked and locked in the sandbox,
    the sandbox shall post a structured 'buildui:element-selected' message to the parent window containing the complete inspected element metadata.
  test_type: Integration
  expected:
    ui_state: "向父级 postMessage 发送包含 tagName, componentPath, line, col, textSnippet, className 的结构化消息"
    side_effects: []
```

---

### 需求 v13.REQ-002 · 智能源码文件与完整容器代码区域定位

**用户故事：** 作为系统，我希望在接收到用户点选的元素后，能自动读取对应的源文件，默认定位该外层容器元素的完整起始与闭合行范围，并提取该区域的完整代码片段。

#### 验收标准

```yaml
- id: v13.REQ-002-AC-001
  ears: >
    When parent window receives 'buildui:element-selected' with componentPath and line information,
    the application shall automatically load the target source file and execute sourceLocator to compute the full outer container boundary (startLine to endLine) and matching codeSnippet.
  test_type: Unit
  expected:
    return_value: "CodeRegion 对象，包含 filePath, startLine, endLine, codeSnippet, found: true"
    throws: null
    side_effects: []

- id: v13.REQ-002-AC-002
  ears: >
    When sourceLocator processes a component with line number or matching JSX tag,
    it shall accurately determine the full boundary of the JSX element (including outer opening tag through closing tag or self-closing tag) to produce the complete container code snippet.
  test_type: Unit
  expected:
    return_value: "完整包含起始与闭合标签范围的代码块"
    throws: null
    side_effects: []

- id: v13.REQ-002-AC-003
  ears: >
    When source location line information is missing or file cannot be matched,
    sourceLocator shall fallback gracefully using tag and text matching or file-level reference without throwing unhandled exceptions.
  test_type: Unit
  expected:
    return_value: "返回包含可用代码片段的降级定位结果或清晰定位提示"
    throws: null
    side_effects: []
```

---

### 需求 v13.REQ-003 · 局部编辑控制器升级与一键切换 Code 视图

**用户故事：** 作为开发者，我希望选定元素后在局部编辑弹层中清晰看到锁定的文件路径、代码行号与源码片段，并能一键切换到 Code 视图高亮该行，或使用快捷药丸/输入框进行编辑。

#### 验收标准

```yaml
- id: v13.REQ-003-AC-001
  ears: >
    When the LocalEditPopover is opened for a selected element with resolved code region,
    it shall render the element's located file path and line numbers (e.g. 'src/components/Header.tsx:14-22') along with an expandable Code Snippet preview box.
  test_type: Component
  expected:
    ui_state: "显示文件路径徽章、代码行号区间及代码预览折叠卡片"
    side_effects: []

- id: v13.REQ-003-AC-002
  ears: >
    When the user clicks the 'Jump to Code' (在代码中查看) button in LocalEditPopover,
    the application shall instantly switch activeView to 'code', open the corresponding file in CodeView, and highlight the targeted startLine.
  test_type: Component
  expected:
    ui_state: "工作区视图从 preview 切换到 code，激活目标文件并高亮滚动至目标行"
    side_effects: []

- id: v13.REQ-003-AC-003
  ears: >
    When the user clicks quick action presets or enters targeted editing instructions,
    the input field shall update immediately and allow submission via 'Apply Edit' button or Ctrl/Cmd+Enter shortcut.
  test_type: Component
  expected:
    ui_state: "输入框正常填充并能触发提交"
    side_effects: []
```

---

### 需求 v13.REQ-004 · 定向局部编辑 AI 指令装配与重构闭环

**用户故事：** 作为开发者，我希望点击“应用局部编辑”后，系统组装包含目标文件、完整容器代码行号和原始代码片段的上下文指令，驱动大模型对目标区域进行精准重构更新并实时预览。

#### 验收标准

```yaml
- id: v13.REQ-004-AC-001
  ears: >
    When the user submits targeted local editing instructions,
    the application shall assemble a structured prompt containing the target file, code region line range, original code snippet, user instruction, and code-preservation invariants.
  test_type: Unit
  expected:
    return_value: "结构化 Prompt 字符串，包含 [Target File]、[Code Region: Lines X-Y]、[Original Snippet] 与 [Instruction]"
    throws: null
    side_effects: []

- id: v13.REQ-004-AC-002
  ears: >
    When the assembled targeted local prompt is dispatched to the AI generation stream,
    the local agent shall update only the targeted file and region, write changes to disk, and trigger hot reload in the preview sandbox.
  test_type: Integration
  expected:
    ui_state: "AI 开始流式生成并局部重构代码，工作台自动刷新预览展现修改结果"
    side_effects: []
```
