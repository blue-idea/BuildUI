# 版本终结验收报告（Final Report）· Blot-UI v14

> 文件路径：`docs/spec/versions/v14/v14-final-report.md`  
> 规范版本：v14 · 日期：2026-11-23  
> 状态：验收完成（completed）  
> 核心需求文档：[requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v14/requirements.md)  
> 技术设计文档：[design.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v14/design.md)  
> 实施任务文档：[tasks.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v14/tasks.md)

---

## 1. 版本目标与交付成果

v14 版本针对用户需求“项目删除时，需要同时删除项目的目录”，完整实现了**项目物理工作区目录联动递归清理、运行态 Dev Runner 平稳终止、以及高强度系统路径防灾安全屏障**：

1. **工作区物理目录联动递归清理（`AppService.DeleteApp`）**：
   - 当用户在前端（应用抽屉 `AppDrawer` 或工程中心 `ProjectsCenterView`）删除非活跃工程时，后端先从数据库中查询待删除实体的真实工程路径 `appEntity.Path`；
   - 级联删除 SQLite 数据库中相关工程、会话、消息、蓝图及版本数据；
   - 联动调用 `os.RemoveAll(appEntity.Path)` 彻底清理磁盘工程目录与 node_modules，避免孤儿文件残留与磁盘空间浪费。

2. **多层系统防灾安全屏障（`IsSafeProjectDirectory`）**：
   - 过滤空路径、相对点路径（`.` / `..`）；
   - 严禁删除根目录（`/` 或系统根卷 `C:\`）；
   - 严禁删除用户主目录（`os.UserHomeDir()`）；
   - 严禁删除当前应用工作目录（`os.Getwd()`）及其直接父目录；
   - 严禁删除 Unix 根直接子目录（如 `/bin`, `/usr`, `/etc`, `/Users`, `/Applications`, `/var` 等顶级系统路径）；
   - 保证仅有合法深度的子工程目录才被允许执行物理删除。

3. **运行态 Runner 实例平稳终止**：
   - 在清理工程物理目录与数据库之前，自动检查并停止该工程可能挂载的本地 Dev Server 子进程，释放端口并解除文件锁。

4. **预先缺失目录平稳容错**：
   - 若用户在外部资源管理器中已手动移除了项目目录，`DeleteApp` 依然能平稳清空数据库记录，不会报文件不存在异常。

---

## 2. 自动化测试与质量指标

| 测试层级 | 工具 | 用例总数 | 通过数 | 覆盖说明 |
|---|---|---|---|---|
| **Go 单元与集成测试** | `go test -count=1 ./internal/app/...` | 5 个测试文件 | **ALL PASS** | 覆盖安全目录校验、物理目录联动删除、活跃工程禁止删除、Runner 平稳停止、目录缺失容错 |
| **Go 全包回归** | `go test ./...` | 全量测试包 | **ALL PASS** | 覆盖 internal/agent, internal/app, internal/blueprint, internal/llm, internal/scaffold 等 |
| **前端全量测试** | Vitest + React Testing Library | 35 个套件 / 207 个用例 | **207 / 207 PASS** | 覆盖 App, ProjectsCenterView, AppDrawer 全链路无退化 |
| **构建与类型检查** | `tsc && vite build` | 1617 模块构建通过 | **0 Error** | 0 TypeScript 错误，打包耗时 1.08s |

---

## 3. 验收文件清单

- `docs/spec/versions/v14/ac/TASK-061-AC.md`: 目录安全防灾校验器验收单
- `docs/spec/versions/v14/ac/TASK-062-AC.md`: DeleteApp 联动物理目录清理验收单
