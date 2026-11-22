# 技术设计方案（Design）· Blot-UI v11

> 文件路径：`docs/spec/versions/v11/design.md`  
> 规范版本：v11 · 日期：2026-11-22  
> 状态：定稿实施中（active）  
> 关联需求：[docs/spec/versions/v11/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v11/requirements.md)

---

## 1. 架构与组件划分

在 `PreviewPanel.tsx` 与 `ComponentInspector.tsx` 现有基础上，升级重构为真正的元素点选与局部编辑控制器：

```
PreviewPanel (Right Pane)
   │
   ├── Inspector Header Bar (Active status, exit button, hint)
   │
   ├── Interactive Element Overlay (Overlay canvas over preview)
   │     ├── Hover Highlight Box (follows cursor hover)
   │     └── Target Selection Box (when clicked)
   │
   └── LocalEditPopover (Floating dialog over locked element)
         ├── Element Header: <button> in src/components/RecipeCard.tsx
         ├── Current Classes / Props Badge
         ├── Quick Action Pills:
         │     [🎨 Change Color] [✏️ Update Text] [📏 Adjust Padding] [🔘 Rounded Full]
         ├── Prompt Input Area: "Make this button indigo with soft shadow"
         └── Actions: [Cancel / ESC]  [🚀 Apply Targeted AI Edit]
```

---

## 2. 数据模型定义

在 `frontend/src/types/inspect.ts` 中定义类型：

```typescript
export interface InspectedElement {
  id: string;
  tagName: string;
  componentPath: string;
  className?: string;
  textSnippet?: string;
  selector?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface QuickActionPreset {
  id: string;
  label: string;
  icon?: string;
  promptTemplate: (element: InspectedElement) => string;
}
```

---

## 3. 预设快捷指令库（Quick Action Presets）

- **Change Color**: `Change background color of <{{tagName}}> to primary brand color`
- **Update Text**: `Update text content of <{{tagName}}> to ""`
- **Adjust Spacing**: `Add more padding (p-4) and subtle gap to <{{tagName}}>`
- **Rounded Corners**: `Apply rounded-full pill styling to <{{tagName}}>`
- **Make Interactive**: `Add hover micro-interaction (scale-105 transition-all) to <{{tagName}}>`

---

## 4. 上下文与指令格式化（Targeted Prompt Assembly）

当用户提交局部编辑时，调用工具函数组装标准精准定向指令：

```
[Target Component: {{componentPath}}]
[Target Element: <{{tagName}} className="{{className}}">]
Instruction: {{userPrompt}}
Requirement: Only update this specific element and its immediate styling in {{componentPath}}. Do not modify any other component or business logic.
```

这样大模型接收到后能精准定位到具体 AST 节点与 Tailwind 类名，进行零破坏性的局部代码重构。
