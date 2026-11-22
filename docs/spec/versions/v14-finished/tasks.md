# 实施计划（Tasks）· Blot-UI v14

> 文件路径：`docs/spec/versions/v14/tasks.md`  
> 规范版本：v14 · 日期：2026-11-23  
> 关联需求：[docs/spec/versions/v14/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v14/requirements.md)  
> 关联设计：[docs/spec/versions/v14/design.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v14/design.md)

执行时须严格遵循 `requirements.md` 中的验收标准，采用 TDD（红-绿-重构）开发方式。

---

## 任务清单

---

- [x] **TASK-061 · 目录安全防灾校验器 `isSafeProjectDirectory`（TDD）**

  > 依赖：无

  - [x] 编写测试用例 `internal/app/safe_dir_test.go`（Red）：
    - 验证拦截空路径、点号（`.`）
    - 验证拦截根目录（`/` 或系统根卷）
    - 验证拦截用户主目录（`os.UserHomeDir()`）
    - 验证拦截当前工作目录（`os.Getwd()`）及其直接父目录
    - 验证拦截直接挂载于根目录下的系统顶级路径（如 `/bin`, `/usr`, `/etc`）
    - 验证允许合法的工程子目录（如 `/Users/user/workspace/demo`）
  - [x] 在 `internal/app/service.go` 中实现 `IsSafeProjectDirectory(dir string) bool`（Green）
  - [x] 运行 Go 单元测试确保测试全绿并通过（Refactor）

  **验证方式：**
  ```bash
  go test -v -run TestIsSafeProjectDirectory ./internal/app/...
  ```

  **验收证据：** 单元测试通过，安全校验覆盖全部边界。见 `docs/spec/versions/v14/ac/TASK-061-AC.md`。  
  _需求: `requirements.md` 中 `v14.REQ-002` (AC-001)  
  _测试类型: Unit

---

- [x] **TASK-062 · `AppService.DeleteApp` 联动物理目录清理与运行态停止（TDD）**

  > 依赖：TASK-061

  - [x] 编写测试用例 `internal/app/delete_dir_test.go`（Red）：
    - 验证删除非活跃项目后，不仅数据库记录清除，本地物理目录 `appEntity.Path` 亦被递归彻底删除（`os.Stat` 返回不存在）
    - 验证尝试删除当前活跃项目时返回错误，且磁盘目录完整保留未被删除
    - 验证如果工程物理目录先前已被手动删除，`DeleteApp` 依然能成功删除数据库记录（容错测试）
    - 验证若项目关联了运行中的 runner，删除前正确终止该 runner
  - [x] 修改 `internal/app/service.go` 中 `DeleteApp` 的实现（Green）：
    - 获取待删除 `AppEntity`
    - 停止正在运行的 runner（若有）
    - 级联删除数据库记录
    - 执行目录安全校验，调用 `os.RemoveAll(appEntity.Path)` 清理磁盘工作区
  - [x] 运行测试验证（Refactor）

  **验证方式：**
  ```bash
  go test -v -run "TestAppService_DeleteApp.*" ./internal/app/...
  ```

  **验收证据：** 单元测试通过，项目删除与物理目录清理联动成功。见 `docs/spec/versions/v14/ac/TASK-062-AC.md`。  
  _需求: `requirements.md` 中 `v14.REQ-001` (AC-001, AC-002, AC-003), `v14.REQ-002` (AC-002)  
  _测试类型: Unit, Integration
