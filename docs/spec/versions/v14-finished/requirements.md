# 需求文档（Requirements）· Blot-UI v14

> 文件路径：`docs/spec/versions/v14/requirements.md`  
> 规范版本：v14 · 日期：2026-11-23  
> 状态：已定稿（finalized）  
> 关联版本索引：[docs/spec/README.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/README.md)  
> 核心宪法继承：[docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 介绍

在当前系统中，用户通过应用抽屉（`AppDrawer`）或工程中心（`ProjectsCenterView`）删除不再需要的工程项目时，后端的 `AppService.DeleteApp` 仅从 SQLite 数据库中移除了应用记录（以及相关的 Chat、Message、Blueprint 等数据），但并未同步清理存储在磁盘上的物理工作区目录（`appEntity.Path`）。随着项目反复创建与删除，磁盘上残留了大量废弃的代码目录与 node_modules，造成存储浪费并引发用户困惑。

**v14 版本核心目标**：在删除工程项目时，实现数据库记录与磁盘物理工作区目录的联动清理，同时建立严格的路径安全防御屏障，杜绝误删根目录、当前工作目录或系统关键目录的风险。

---

## 需求列表

---

### 需求 v14.REQ-001 · 删除非活跃项目时物理工作区目录联动清理

**用户故事：** 作为开发者，当我在工程中心或应用抽屉中删除某个工程时，希望系统不仅从项目列表中移除该工程，还能彻底清除其在本地磁盘上的工程目录，避免残留孤儿文件占用空间。

#### 验收标准

```yaml
- id: v14.REQ-001-AC-001
  ears: >
    When an inactive project is deleted via AppService.DeleteApp(ctx, appID),
    the system shall retrieve the project entity, delete the database record, and recursively remove the project's physical directory from the filesystem.
  test_type: Unit
  expected:
    ui_state: "无直接前端UI变化，工程从列表消失"
    side_effects:
      - "数据库中的应用记录及级联数据被清除"
      - "磁盘上对应的项目目录被物理删除"

- id: v14.REQ-001-AC-002
  ears: >
    When a user attempts to delete the currently active project via AppService.DeleteApp(ctx, appID),
    the system shall reject the request with a PreconditionError and leave the physical directory on disk completely untouched.
  test_type: Unit
  expected:
    ui_state: "返回错误提示：cannot delete currently active application"
    side_effects:
      - "数据库未变更"
      - "磁盘物理目录保持原状未被删除"

- id: v14.REQ-001-AC-003
  ears: >
    When an inactive project being deleted has an active dev server runner instance,
    AppService.DeleteApp shall terminate the dev runner instance before deleting the directory and database record.
  test_type: Unit
  expected:
    ui_state: "开发服务器进程被平稳停止"
    side_effects:
      - "runner.StopApp 被调用"
```

---

### 需求 v14.REQ-002 · 物理目录安全校验与防御屏障

**用户故事：** 作为系统架构师，我需要确保在执行物理目录删除（`os.RemoveAll`）前进行严格的边界与安全校验，严禁误删根目录、用户主目录、系统目录或当前应用根工作区。

#### 验收标准

```yaml
- id: v14.REQ-002-AC-001
  ears: >
    When AppService.DeleteApp is invoked on a project whose path is empty, root (/ or C:\), user home directory, current working directory (cwd), or system root directory,
    the directory safety validator shall reject directory deletion and prevent catastrophic file loss.
  test_type: Unit
  expected:
    ui_state: "安全拦截，物理文件不受破坏"
    side_effects:
      - "关键系统目录与根目录受到绝对保护"

- id: v14.REQ-002-AC-002
  ears: >
    When AppService.DeleteApp is invoked on a project whose physical directory has already been deleted or does not exist on disk,
    the service shall proceed to cleanly delete the database records without returning a file-not-found error.
  test_type: Unit
  expected:
    ui_state: "静默容错，成功清理数据库"
    side_effects:
      - "数据库记录成功删除，不因文件不存在而报异常"
```
