# 需求规格说明书（Requirements）· Blot-UI v3

> 文件路径：`docs/spec/versions/v3/requirements.md`  
> 规范版本：v3 · 日期：2026-11-21  
> 状态：已定稿（Approved）  
> 核心目标：多应用侧边栏工作空间管理、可视化组件定位审查器（Visual Component Inspector）、一键工程 Zip 导出与原生资源管理器定位  
> 架构基准：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)  
> 继承规则：`docs/spec/steering/` 与 `docs/spec/versions/v1-finished/constitution.md`

---

## 1. 业务背景与演进目标

在 v1 与 v2 版本中，Blot-UI 完成了从脚手架展开、蓝图审批门禁、XML 流式落盘、自愈验证、Turn-level Git 提交、多模型真实 LLM 流式交互到 Git 版本时光机回滚与原生桌面增强的坚实工程闭环。  
**v3 版本的核心演进目标**是让开发者能够专业高效地管理多个项目、深入微观组件进行定向修改，并便捷地交付分发工程：

1. **多应用管理与多工作空间切换（Multi-App Drawer & Workspace Switcher）**：
   - 提供侧边栏抽屉式多应用面板，支持快速浏览全部已创建应用、新建应用、切换活动应用与安全删除应用；
   - 切换应用时，自动切换会话流、蓝图状态与活动开发服务器。
2. **可视化组件定位审查器（Visual Component Inspector）**：
   - 在实时预览区赋予开发者“所见即所改”的精准审查能力；
   - 鼠标悬浮与点击 DOM 元素可高亮显示对应的组件源码文件路径（如 `src/components/Header.tsx`），并自动联动将组件引用填入聊天输入框，触发定向增量修改。
3. **工程打包导出与本地资源管理器定位（App Export & Native File Reveal）**：
   - 支持将当前应用过滤掉临时产物（如 `node_modules`, `.git`, `dist`）后一键打包导出为结构标准的 `.zip` 压缩包；
   - 支持直接唤起 Windows 资源管理器或 Finder 定位到应用物理磁盘目录。

---

## 2. 需求列表与 EARS 验收标准

---

### 需求 v3.REQ-001 · 侧边栏多应用管理与工作空间无缝切换

**用户故事：** 作为 独立开发者或多项目负责人，我希望 在同一个桌面端中管理多个独立的 Web 应用程序并自由切换，以便 在不同项目间并行开发而互不干扰。

#### 验收标准

```yaml
- id: v3.REQ-001-AC-001
  ears: >
    When the user requests to switch to another existing application by app ID,
    the AppService shall stop the current preview server, load the target app's chats,
    blueprints, versions, and workspace directory, and update the active application state.
  test_type: Unit
  expected:
    return_value: "ActiveAppDTO, valid=true"
    throws: null
    side_effects:
      - "Database active_app record updated"
      - "Active chat session switched"

- id: v3.REQ-001-AC-002
  ears: >
    While on the main dashboard,
    when the user clicks the 'Apps Drawer' toggle button in the navigation bar,
    the UI shall slide open the multi-app drawer listing all apps with their name,
    creation time, and an active badge on the currently loaded app.
  test_type: E2E
  expected:
    ui_state: "Apps drawer is visible containing app cards and 'New App' button"
    side_effects: []

- id: v3.REQ-001-AC-003
  ears: >
    When the user clicks 'Delete' on an inactive application card and confirms the prompt,
    the system shall remove the app record and its associated blueprints, chats,
    and versions from SQLite via cascade deletion.
  test_type: Unit
  expected:
    return_value: "nil"
    throws: null
    side_effects:
      - "App and dependent records removed from database"
```

---

### 需求 v3.REQ-002 · 预览区可视化组件定位审查器与定向 Prompt 联动

**用户故事：** 作为 前端应用构建者，我希望 直接在实时预览中点击我想修改的 UI 元素，以便 立即获取其源码路径并在聊天框中发起定向调整，避免手动查找文件。

#### 验收标准

```yaml
- id: v3.REQ-002-AC-001
  ears: >
    When the ComponentInspector receives an inspect event payload containing tag, class,
    and nearest component metadata from preview iframe,
    the system shall resolve the associated component file path and construct a targeted prompt template.
  test_type: Unit
  expected:
    return_value: "ResolvedComponentDTO, path ends with .tsx"
    throws: null
    side_effects: []

- id: v3.REQ-002-AC-002
  ears: >
    While the live preview is running,
    when the user clicks the 'Inspect Component' button on the preview panel toolbar,
    the preview shall enter inspect mode displaying an active overlay banner.
  test_type: E2E
  expected:
    ui_state: "Inspect mode active indicator is displayed on preview toolbar"
    side_effects: []

- id: v3.REQ-002-AC-003
  ears: >
    While in inspect mode,
    when the user clicks an element in the preview panel,
    the system shall exit inspect mode, display the selected component path badge,
    and pre-fill the chat input with '@src/components/...: ' ready for typing.
  test_type: E2E
  expected:
    ui_state: "Chat input contains @component_path prefix and receives focus"
    side_effects: []
```

---

### 需求 v3.REQ-003 · 一键工程 Zip 导出与操作系统原生资源管理器定位

**用户故事：** 作为 应用构建者，我希望 能够一键把构建成功的应用导出为 Zip 归档或在操作系统资源管理器中打开，以便 提交给客户、部署到第三方平台或进行二次开发。

#### 验收标准

```yaml
- id: v3.REQ-003-AC-001
  ears: >
    When the user invokes ExportAppZip for a specific app ID,
    the ExportService shall traverse the app workspace directory excluding .git, node_modules,
    and dist, and generate a valid zip file archive.
  test_type: Unit
  expected:
    return_value: "string, ends with .zip and file size > 0"
    throws: null
    side_effects:
      - "Zip archive written to output path"

- id: v3.REQ-003-AC-002
  ears: >
    When the user requests OpenInFileManager for a valid workspace or zip path,
    the system shall trigger the OS-native file explorer command to reveal the target directory.
  test_type: Unit
  expected:
    return_value: "nil"
    throws: null
    side_effects:
      - "OS file manager process spawned"

- id: v3.REQ-003-AC-003
  ears: >
    While on the main dashboard,
    when the user clicks 'Export Project' in the header action menu,
    the UI shall display an export confirmation modal with 'Download Zip' and 'Reveal in Explorer' options,
    and show a success feedback upon completion.
  test_type: E2E
  expected:
    ui_state: "Export modal displayed with successful export path and action buttons"
    side_effects: []
```

---

## 3. 质量检查清单

- [x] 每条 EARS 中“系统响应”均具备可量化断言与明确返回值或 UI 状态，无主观模糊表述。
- [x] 覆盖了应用切换、删除级联清理、审查模式开启/退出、文件排查与导出异常场景。
- [x] 每条 AC 均明确绑定 `test_type`（Unit / E2E / API）。
- [x] 需求编号 `v3.REQ-001` ~ `v3.REQ-003` 连续无遗漏，AC 编号全局唯一。
