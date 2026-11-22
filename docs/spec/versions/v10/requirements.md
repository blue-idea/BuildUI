# 需求文档（Requirements）· Blot-UI v10

> 文件路径：`docs/spec/versions/v10/requirements.md`  
> 规范版本：v10 · 日期：2026-11-22  
> 状态：定稿实施中（active）  
> 关联版本索引：[docs/spec/README.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/README.md)  
> 核心宪法继承：[docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 介绍

在前端界面与客户端原型快速构建过程中，设计风格是决定应用视觉质感与用户体验的关键要素。开发者常常希望借助知名优秀产品（如 Linear、Stripe、Apple、Notion、Raycast、Vercel 等）或一张现成的设计参考图作为参照物，快速提取其核心色彩、表面质感、圆角、排版和设计规则，并转化为大模型可严格执行的 **系统设计提示词（Design System Prompt）**，甚至固化保存为长久可复用的模版。

**v10 版本核心目标**：实现风格中心与参照物提取器（Style Center & Reference Extractor），包括：
1. **风格中心双 Tab 视图**：在左侧微坞「风格页（`dock-style`）」中集成两个核心工作区：【风格模版库 (Style Templates)】与【参照物风格提取器 (Reference Style Extractor)】；
2. **多模态参照物输入**：支持上传本地设计参考图片/截图，或输入参照物产品名称（如 Linear, Stripe, Apple 等），或输入风格关键词特征；
3. **智能设计特征提取引擎**：自动解析生成设计调色盘（Primary 主色、Background 背景色、Surface 表面色、Text 文本色、Border 边框色）、圆角与阴影规格、视觉标签，以及标准结构化的 **AI 设计提示词（Design System Prompt）**；
4. **实时组件模拟预览**：提供基于提取风格的实时 UI 交互卡片模拟（按钮、输入框、卡片、标签、统计指标）；
5. **模版保存与持久化复用**：提取的风格可一键【保存为风格模版】，自动入库并在系统主题与首页构建中可选复用，同时支持一键【复制设计 Prompt】。

---

## 需求列表

---

### 需求 v10.REQ-001 · 风格中心双 Tab 主架构与模版列表

**用户故事：** 作为开发者，我希望在风格页中既能查看和切换现有的风格模版，又能切换到提取器进行新风格的创建。

#### 验收标准

```yaml
- id: v10.REQ-001-AC-001
  ears: >
    When the user navigates to the style page,
    the StyleCenterView shall render two tabs: 'Style Templates' (模版库) and 'Reference Extractor' (风格提取器).
  test_type: Component
  expected:
    ui_state: "包含两个 Tab 切换按钮，默认激活 Style Templates 或可随时切换"
    side_effects: []

- id: v10.REQ-001-AC-002
  ears: >
    When the Style Templates tab is active,
    it shall render a grid of available style templates showing palette swatches, design direction, and tags, with an option to apply as current theme.
  test_type: Component
  expected:
    ui_state: "网格卡片列出模版信息，当前激活模版具有明显高亮选中标识"
    side_effects: []
```

---

### 需求 v10.REQ-002 · 参照物输入与风格智能提取

**用户故事：** 作为开发者，我希望能够上传参考图或输入参照物名称，自动提取出色彩与设计规则。

#### 验收标准

```yaml
- id: v10.REQ-002-AC-001
  ears: >
    When the Reference Extractor tab is active,
    it shall provide an image upload area (supporting drag-and-drop or file pick) and a text input for reference product/brand name.
  test_type: Component
  expected:
    ui_state: "包含图片上传区和参照物文本输入框"
    side_effects: []

- id: v10.REQ-002-AC-002
  ears: >
    When the user clicks 'Extract Style & Prompt',
    the extractor shall parse the reference and generate a complete color palette, visual styling attributes, and a structured Design System Prompt.
  test_type: Component
  expected:
    ui_state: "展示提取出的调色板（Primary, Background, Surface, Text, Border）及生成的 Prompt"
    side_effects: []
```

---

### 需求 v10.REQ-003 · 实时 UI 组件效果预览

**用户故事：** 作为开发者，我希望在提取风格后能立即看到模拟组件渲染效果，以评估视觉风格是否满足预期。

#### 验收标准

```yaml
- id: v10.REQ-003-AC-001
  ears: >
    When a style is extracted or selected,
    the view shall render a live UI preview card applying the extracted primary, background, surface, and text colors to real mock components (button, card, input, badge).
  test_type: Component
  expected:
    ui_state: "实时效果预览卡片动态响应所提取的颜色和圆角配置"
    side_effects: []
```

---

### 需求 v10.REQ-004 · 保存为风格模版与 Prompt 复制

**用户故事：** 作为开发者，我希望将提取出的风格保存为模版供以后直接使用，或一键复制 Prompt 发给 AI。

#### 验收标准

```yaml
- id: v10.REQ-004-AC-001
  ears: >
    When the user clicks 'Save as Style Template',
    the extracted style shall be appended to the user's style templates list and immediately appear in the Style Templates tab.
  test_type: Component
  expected:
    ui_state: "新风格模版保存成功，模版总数递增，切换至模版 Tab 可直接看到并选用"
    side_effects: []

- id: v10.REQ-004-AC-002
  ears: >
    When the user clicks 'Copy Prompt',
    the full design system prompt text shall be copied to the clipboard and a copy success indicator shall be displayed.
  test_type: Component
  expected:
    ui_state: "Prompt 复制到剪贴板，界面提示 Copied"
    side_effects: []
```
