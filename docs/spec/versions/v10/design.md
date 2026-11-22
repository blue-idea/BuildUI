# 技术设计方案（Design）· Blot-UI v10

> 文件路径：`docs/spec/versions/v10/design.md`  
> 规范版本：v10 · 日期：2026-11-22  
> 状态：定稿实施中（active）  
> 关联需求：[docs/spec/versions/v10/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v10/requirements.md)

---

## 1. 架构概览

我们将现有的风格管理逻辑升级为包含提取器与模版库的完整模块：

```
LeftDock (dock-style) ──> activeDockTab = 'style'
                               │
                               ▼
                       StyleCenterView
   ┌─────────────────────────────────────────────────────────────┐
   │ Header: 风格设计中心 (Style Center)                          │
   │ Tabs: [ 风格模版库 (Templates) ]  [ 参照物风格提取器 (Extractor) ]│
   ├──────────────────────────────┬──────────────────────────────┤
   │ Style Templates Grid         │ Reference Style Extractor    │
   │ - System Presets             │ - Reference Inputs           │
   │ - Custom Extracted Templates │   * Image Upload Dropzone    │
   │ - Actions: Apply / Delete    │   * Reference Brand / Name   │
   │                              │ - Extraction Engine          │
   │                              │ - Live Component Preview     │
   │                              │ - [Save Template] [Copy]     │
   └──────────────────────────────┴──────────────────────────────┘
```

---

## 2. 数据模型定义

在 `frontend/src/types/style.ts` 中定义类型：

```typescript
export interface ColorPalette {
  primary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}

export interface ExtractedStyle {
  id: string;
  name: string;
  referenceSource: string; // 如 'Linear', 'Uploaded Screenshot'
  palette: ColorPalette;
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  typography: string;
  tags: string[];
  designPrompt: string;
  createdAt: string;
}

export interface StyleTemplate extends ExtractedStyle {
  isPreset?: boolean;
}
```

---

## 3. 智能提取引擎算法（Style Extractor Engine）

在 `frontend/src/utils/styleExtractor.ts` 中封装可复用的提取逻辑：
- 根据参考物关键字（如 `Linear`, `Stripe`, `Apple`, `Notion`, `Raycast`, `Vercel`, `GitHub`, `Cyberpunk` 等）自动匹配或从上传图像特征模拟提取最优色彩矩阵；
- 自动组装符合大模型系统级指导的结构化 **Design Prompt**：
  ```
  Design Direction: {{name}} inspired modern interface.
  Color System: Primary {{primary}}, Background {{background}}, Surface {{surface}}, Text {{text}}, Border {{border}}.
  UI Aesthetics: {{borderRadius}} rounded corners, subtle elevation, clean typographic hierarchy.
  Key Directives: Maintain high contrast, focus on content hierarchy, use minimal border separators.
  ```

---

## 4. 关键组件职责划分

1. **`StyleExtractor.tsx`**：
   - 参照物输入表单（图片上传、参照物名称输入）；
   - 提取按钮与提取中加载状态；
   - 调色盘与生成的 Design Prompt 显示；
   - 实时 Mock UI 预览卡片（按钮、卡片、输入框、Tag）；
   - “保存为模版”与“复制 Prompt”按钮。
2. **`StyleCenterView.tsx`**：
   - 顶栏 Tab 切换（`templates` | `extractor`）；
   - 模版库展示列表（包含内置预设与用户提取后保存的模版）；
   - 模版应用切换（联动系统 `activeThemeId`）。
