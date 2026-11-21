# 需求文档（Requirements）· Blot-UI v8

> 文件路径：`docs/spec/versions/v8/requirements.md`  
> 规范版本：v8 · 日期：2026-11-21  
> 状态：定稿实施中（active）  
> 关联版本索引：[docs/spec/README.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/README.md)  
> 核心宪法继承：[docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 介绍

在 Blot-UI 的工作区（WorkspacePanel）代码检视视图中，当前仅使用基础 `<pre>` 标签渲染纯文本源码，缺少现代代码查看与检视体验：
1. 缺乏行号指示，无法快速定位代码行数；
2. 缺乏语法着色，单调纯文本可读性较弱；
3. 后端 TypeScript 检查或编译产生的错误诊断项（DiagnosticItem）仅作为日志打印在系统消息抽屉中，用户无法在代码检视面板中直观查阅错误列表，更无法一键从错误直接跳转定位至对应文件的具体代码行。

**v8 版本核心目标**：实现工作区轻量代码编辑器检视集成（Workspace Code Editor & Diagnostics Navigation），包括：
1. **轻量级代码高亮与行号指示**：在代码检视区内置零庞大第三方依赖的纯前端轻量语法高亮引擎，提供优雅的行号指示栏、行背景与主题自适应；
2. **目标代码行高亮定位与平滑滚动**：支持传入高亮目标行号，高亮该代码行并平滑滚动聚焦到视口中央；
3. **错误诊断面板与行内错误指示**：在检视区提供直观的诊断问题面板（Problems / Diagnostics），列出严重级别、文件、行列号与错误详情；
4. **诊断项联动直达跳转**：支持直接点击诊断项自动切换目标文件，并直达跳转高亮对应代码行。

---

## 需求列表

---

### 需求 v8.REQ-001 · 轻量级代码语法高亮与行号指示栏

**用户故事：** 作为开发者，我希望在工作区代码检视面板中查看代码时，能清晰看到代码行号和语法高亮，以便快速阅读和审阅代码逻辑。

#### 验收标准

```yaml
- id: v8.REQ-001-AC-001
  ears: >
    When code content is rendered in the code inspection viewer,
    the CodeEditorViewer shall display a dedicated line number gutter showing sequential line numbers (1, 2, 3...) that are aligned with code lines and unselectable during text selection.
  test_type: Component
  expected:
    ui_state: "每行具有独立的行号元素，行号不可选中文本（select-none），等宽对齐"
    side_effects: []

- id: v8.REQ-001-AC-002
  ears: >
    When source code in supported languages (such as TypeScript, JavaScript, JSX, TSX, CSS, JSON) is provided,
    the syntax tokenizer shall tokenize code into colored spans representing keywords, strings, numbers, comments, tags, and types without crashing.
  test_type: Unit
  expected:
    return_value: "Tokenized React elements"
    side_effects: []

- id: v8.REQ-001-AC-003
  ears: >
    When a highlightedLine property is specified,
    the CodeEditorViewer shall apply a highlighted background and border to the targeted line element and smoothly scroll it into view.
  test_type: Component
  expected:
    ui_state: "目标代码行具有 data-highlighted-line='true' 且具有高亮样式"
    side_effects: ["触发对应行 DOM scrollIntoView"]
```

---

### 需求 v8.REQ-002 · 错误诊断项展示与点击直达跳转代码行

**用户故事：** 作为开发者，我希望在检视代码时能看到错误诊断列表，并且点击任意错误时能自动切换到对应文件并跳转高亮到对应的代码行，以便快速排查和修改错误。

#### 验收标准

```yaml
- id: v8.REQ-002-AC-001
  ears: >
    When diagnostics (errors or warnings) are present,
    the WorkspacePanel shall render a Problems/Diagnostics panel in the code review area displaying the count, severity, file path, line:column, and error message.
  test_type: Component
  expected:
    ui_state: "展示诊断项列表，包含严重级别徽章、文件名、行列号及错误描述"
    side_effects: []

- id: v8.REQ-002-AC-002
  ears: >
    When the user clicks on a diagnostic item belonging to the currently open file,
    the CodeEditorViewer shall instantly highlight the targeted line and scroll to it.
  test_type: Integration
  expected:
    ui_state: "当前文件的指定代码行被高亮并居中显示"
    side_effects: []

- id: v8.REQ-002-AC-003
  ears: >
    When the user clicks on a diagnostic item belonging to a different file,
    the WorkspacePanel shall automatically switch the active file in the file tree and code viewer to the targeted file, and then highlight and scroll to the error line.
  test_type: Integration
  expected:
    ui_state: "左侧文件树选中态更新为目标文件，右侧展示目标文件源码并高亮目标行"
    side_effects: []

- id: v8.REQ-002-AC-004
  ears: >
    When a line in the active file has associated diagnostics,
    the CodeEditorViewer shall display an inline error indicator or marker on the line gutter and code line.
  test_type: Component
  expected:
    ui_state: "行号栏或行内展示错误标记与提示"
    side_effects: []
```
