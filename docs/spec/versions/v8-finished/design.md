# 技术方案设计（Design）· Blot-UI v8

> 文件路径：`docs/spec/versions/v8/design.md`  
> 规范版本：v8 · 日期：2026-11-21  
> 关联需求：[docs/spec/versions/v8/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v8/requirements.md)

---

## 1. 架构概览与设计思想

本次设计聚焦于在不引入臃肿外部重量级编辑器（如数十兆的 Monaco Editor）的前提下，实现极速、高可靠、开箱即用的轻量代码检视与错误诊断联动系统。

```mermaid
flowchart TD
    subgraph AppState["App 层状态管理"]
        App[App.tsx]
        App -->|diagnostics: DiagnosticItem[]| WorkspacePanel
        App -->|activeView: 'code'| WorkspacePanel
    end

    subgraph WorkspacePanelComponent["WorkspacePanel 代码检视区域"]
        WorkspacePanel --> FileTree["FileTree (左侧文件树)"]
        WorkspacePanel --> CodeViewerContainer["右侧代码检视容器"]
        CodeViewerContainer --> CodeEditorViewer["CodeEditorViewer (轻量代码查看器)"]
        CodeViewerContainer --> DiagnosticsPanel["DiagnosticsPanel (诊断/问题抽屉)"]
    end

    subgraph CodeEditorViewerInternals["CodeEditorViewer 内部机制"]
        CodeEditorViewer --> Tokenizer["Lightweight Regex Tokenizer"]
        CodeEditorViewer --> LineGutter["行号指示栏 (Gutter & Markers)"]
        CodeEditorViewer --> CodeLine["代码行与 Token 着色渲染"]
        CodeEditorViewer --> AutoScroll["Target Line 高亮与 DOM scrollIntoView"]
    end

    DiagnosticsPanel -->|Click Diagnostic| JumpHandler["handleSelectDiagnostic"]
    JumpHandler -->|Switch File if needed| FileTree
    JumpHandler -->|Set highlightedLine| CodeEditorViewer
```

---

## 2. 核心模块与组件设计

### 2.1 轻量代码分词与语法高亮（Lightweight Syntax Tokenizer）

创建 `frontend/src/components/CodeEditorViewer.tsx`，内置纯函数分词器 `tokenizeLine(line: string, language: string): Token[]`。

- 支持的 Token 类型：
  - `keyword`: `const`, `let`, `var`, `function`, `return`, `import`, `export`, `from`, `interface`, `type`, `class`, `if`, `else`, `switch`, `case`, `default`, `async`, `await`, `true`, `false`, `null`, `undefined`, `void`, `new`, `typeof` 等。
  - `string`: 单双引号、模板字符串。
  - `number`: 数字字面量。
  - `comment`: 单行注释 `//` 与行内多行注释 `/* */`。
  - `tag`: JSX/HTML 标签名 `<div`, `</div>`, `<span` 等。
  - `attribute`: JSX 属性名 `className=`, `onClick=` 等。
  - `type`: 常见 TypeScript 类型与 React 组件名。
  - `punctuation`: 标点符号与运算符。
  - `plain`: 普通文本。

### 2.2 行号指示栏（Line Number Gutter）与行高亮

每行代码封装为具有明确行号标识的结构：
- `id={`code-line-${lineNumber}`}`
- `data-line={lineNumber}`
- `data-highlighted-line={isHighlighted ? "true" : undefined}`
- `data-has-error={hasError ? "true" : undefined}`

当 `highlightedLine` 属性变化时，触发 `useEffect` 自动寻找对应 DOM 元素，执行平滑滚动：
```ts
lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
```

### 2.3 错误诊断项（DiagnosticItem）与问题面板（DiagnosticsPanel）

- `DiagnosticItem` 沿用现有结构：
  ```ts
  export interface DiagnosticItem {
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
  }
  ```
- 在代码检视面板中增加可折叠的诊断问题面板（`data-testid="diagnostics-panel"`）：
  - 顶部栏显示当前问题数量及切换按钮（如 `Problems (2)` 或 `No problems`）。
  - 列表项（`data-testid="diagnostic-item"`）清晰展示：
    - 严重性图标（Error 为红色 CircleAlert / XCircle，Warning 为黄色 AlertTriangle）。
    - 消息内容、文件名以及 `line:column`。
  - 点击事件：
    - 若 `item.file !== activePath`，触发文件切换；
    - 更新 `highlightedLine = item.line`；
    - 执行代码高亮与居中聚焦。
