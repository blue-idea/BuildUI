# 需求文档（Requirements）· Blot-UI v16

> 文件路径：`docs/spec/versions/v16/requirements.md`  
> 规范版本：v16 · 日期：2026-11-23  
> 状态：已定稿（finalized）  
> 关联版本索引：[docs/spec/README.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/README.md)  
> 核心宪法继承：[docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 介绍

当前系统支持在设置模态框（`SettingsModal`）中配置“本地工程存储路径”（`workspace.dir`），并持久化到 SQLite `settings` 数据表中。但在实际新建工程（`CreateApp` / `CreateAppFromTemplate`）时，后端核心服务 `AppService` 在没有传入自定义路径时仅读取硬编码或静态内存中的 `workspaceRoot`（如默认的系统配置目录或 `./workspace`），未动态联动用户最新配置的 `workspace.dir`；且在应用重启后或保存设置时，内存中的工作区根路径未同步刷新。导致用户在设置中自定义了新的默认存储路径后，新建项目依然落盘在旧默认目录，与用户预期脱节。

**v16 版本核心目标**：实现新建项目（包含空白项目、命名项目及模版初始化项目）与系统设置中配置的默认存储路径（`workspace.dir`）动态无缝联动（Dynamic Binding of Default Storage Path for New Projects）。

---

## 需求列表

---

### 需求 v16.REQ-001 · 新建项目动态绑定设置中的默认存储路径

**用户故事：** 作为开发者，当我在“系统设置 -> 工作区设置”中指定了新的本地工程存储路径后，后续无论在工程中心、应用抽屉还是模版库中创建新工程，该工程都应自动生成在此新配置的默认存储路径下。

#### 验收标准

```yaml
- id: v16.REQ-001-AC-001
  ears: >
    When AppService.CreateApp is invoked without a custom path (CustomPath=""),
    the system shall dynamically query the latest 'workspace.dir' from the database settings, resolving the project target directory under this configured root path.
  test_type: Unit
  expected:
    ui_state: "新工程被创建在设置所指定的自定义根目录下"
    side_effects:
      - "appEntity.Path 对应新设置的存储路径"

- id: v16.REQ-001-AC-002
  ears: >
    When the user updates the workspace directory in SettingsModal and saves,
    the backend SaveSettings and frontend state shall immediately update the active workspaceRoot so that subsequent project creations instantly use the new path without requiring app restart.
  test_type: Integration
  expected:
    ui_state: "设置保存后即时生效"
    side_effects:
      - "settings 表中 workspace.dir 被持久化"
      - "内存中的 workspaceRoot 被同步刷新"

- id: v16.REQ-001-AC-003
  ears: >
    When the desktop application starts up,
    AppService shall initialize its workspaceRoot using the saved 'workspace.dir' setting from the database, retaining the user's custom storage preference across application restarts.
  test_type: Integration
  expected:
    ui_state: "跨启动保持自定义工作区存储路径"
    side_effects:
      - "启动后新建项目默认落盘在先前保存的路径"

- id: v16.REQ-001-AC-004
  ears: >
    When a project is created from a template via CreateAppFromTemplate without an explicit DestPath,
    the system shall resolve DestPath under the dynamically configured default workspace directory.
  test_type: Unit
  expected:
    ui_state: "模版工程在配置的默认路径下解压与初始化"
    side_effects: []
```

---

### 需求 v16.REQ-002 · 前端抽屉与工程中心新建项目联动

**用户故事：** 当我在前端应用抽屉（`AppDrawer`）或工程中心（`ProjectsCenterView`）新建项目时，前端在桌面模式下调用后端 RPC 创建，在浏览器模拟模式下回显正确的自定义存储路径。

#### 验收标准

```yaml
- id: v16.REQ-002-AC-001
  ears: >
    When the user clicks New Application inside AppDrawer in desktop mode,
    the component shall invoke createDesktopProject, routing the creation to backend CreateApp.
  test_type: Component
  expected:
    ui_state: "触发真实项目创建流程"
    side_effects: []

- id: v16.REQ-002-AC-002
  ears: >
    When creating a project in non-desktop mode,
    the fallback path calculation shall resolve using settings['workspace.dir'] || workspaceDir instead of hardcoded '/workspace'.
  test_type: Component
  expected:
    ui_state: "新项目路径前缀与设置保持一致"
    side_effects: []
```
