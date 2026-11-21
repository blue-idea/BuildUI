# 需求规格说明书（Requirements）· Blot-UI v5

> 文件路径：`docs/spec/versions/v5/requirements.md`  
> 规范版本：v5 · 日期：2026-11-21  
> 状态：已定稿（Approved）  
> 核心目标：高质量应用模版预设库（App Templates & Presets）、全局快捷键与命令面板（Command Palette / Cmd+K）  
> 架构基准：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)  
> 继承规则：`docs/spec/steering/` 与 `docs/spec/versions/v1-finished/constitution.md`

---

## 1. 业务背景与演进目标

在完成了 v1（基础闭环）、v2（真实多模型 LLM 与 Git 时光机）、v3（多应用抽屉与微观组件审查）与 v4（动态依赖安装与 UI 主题引擎）后，Blot-UI 已经成为一个功能高度完备的本地 AI 前端生成工作台。  
**v5 版本的核心演进目标**是**极大加速开发起步**与**极致提升极客开发者的操作流转效率**：

1. **高质量应用模版预设库（App Templates & Presets）**：
   - 开发者新建应用时，不再需要从一片空白的默认模板开始或在提示词中费力描述通用架构；
   - 系统内置典型高频场景的前端模版（如 SaaS Dashboard 仪表盘、个人作品集 Portfolio、现代化产品落地页 Landing Page、电商展示 Storefront）；
   - 一键选定模版快速实例化，并自动初始化工作区文件与基础 Git 仓库。
2. **全局快捷键与命令面板（Command Palette / Cmd+K）**：
   - 为桌面端提供像 VSCode / Raycast 一样丝滑的全键盘快捷操作；
   - 在任何视图下按下 `Ctrl+K`（或 `Cmd+K`）即可呼出半透明磨砂命令面板；
   - 支持全键盘上下箭头与回车快速触发：在项目间跳转、瞬时切换主题、唤起工程导出、打开设置、切换审查模式或重载预览。

---

## 2. 需求列表与 EARS 验收标准

---

### 需求 v5.REQ-001 · 高质量应用模版预设库与一键脚手架生成

**用户故事：** 作为 前端应用创作者，我希望 在新建应用时能从丰富的开箱即用高质量模版中快速选择，以便 免除从零构思基础骨架，直接基于成熟页面进行微调。

#### 验收标准

```yaml
- id: v5.REQ-001-AC-001
  ears: >
    The system shall define and register built-in application templates
    including 'saas-dashboard', 'portfolio', 'landing-page', and 'storefront',
    each specifying id, name, description, category, tags, and template source files.
  test_type: Unit
  expected:
    return_value: "[]AppTemplate, length >= 4"
    throws: null
    side_effects: []

- id: v5.REQ-001-AC-002
  ears: >
    When the user requests to create an application from a template by template ID,
    the ScaffoldService shall write the template files into the target workspace directory,
    initialize the initial Git commit, and register the app entity in SQLite.
  test_type: Unit / Integration
  expected:
    return_value: "AppEntity, valid=true"
    throws: null
    side_effects:
      - "Workspace populated with template source"
      - "Git repository initialized"
      - "Database record created"

- id: v5.REQ-001-AC-003
  ears: >
    While in the Applications Drawer or New App workflow,
    the UI shall present a template selection modal with search and preview tags,
    allowing the user to pick a template to instantiate the new project.
  test_type: UI / E2E
  expected:
    ui_state: "TemplatePickerModal displays template cards and instant create button"
    side_effects:
      - "New app created and activated"
```

---

### 需求 v5.REQ-002 · 全局快捷键与全键盘命令面板（Command Palette）

**用户故事：** 作为 极客开发者，我希望 在任何界面下通过 `Ctrl+K`（或 `Cmd+K`）唤出全局命令面板，全键盘快速模糊检索应用、执行操作，以便 极大提高工作流效率。

#### 验收标准

```yaml
- id: v5.REQ-002-AC-001
  ears: >
    While the application window is focused,
    when the user presses 'Ctrl+K' (or 'Meta+K'),
    the UI shall open the Command Palette modal and automatically focus the query input.
  test_type: UI / E2E
  expected:
    ui_state: "Command palette overlay is visible with focused search input"
    side_effects: []

- id: v5.REQ-002-AC-002
  ears: >
    While the Command Palette is open,
    the system shall aggregate actions (Switch App, Change Theme, Open Settings, Export Project, Inspect Component, Reload Preview)
    and filter them in real-time based on fuzzy keyword matching.
  test_type: Unit / UI
  expected:
    ui_state: "Only commands matching user query are displayed in list"
    side_effects: []

- id: v5.REQ-002-AC-003
  ears: >
    While navigating the Command Palette,
    the user shall be able to navigate items with 'ArrowDown' and 'ArrowUp',
    execute the highlighted command with 'Enter',
    and close the palette with 'Escape'.
  test_type: UI / E2E
  expected:
    ui_state: "Command executed, palette closed"
    side_effects:
      - "Action triggered (e.g. theme changed or modal opened)"
```

---

## 3. 非功能性需求（NFR）

1. **键盘交互无阻滞（Instant Keyboard Responsiveness）**：`Ctrl+K` 唤起耗时需小于 30ms，模糊过滤算法纯本地计算，无网络等待，完全支持纯键盘导航。
2. **模版初始化鲁棒性（Template Safety）**：模版展开过程中需保障目录防穿透，模板文件完整且无语法报错，生成的首个 Git Commit 结构清晰规范。
3. **全局焦点安全控制（Focus Trapping）**：命令面板打开时，焦点被安全限制在面板内；关闭后，焦点自动恢复到触发前的元素上。
