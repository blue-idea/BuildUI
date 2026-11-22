# 实施计划（Tasks）· Blot-UI v16

> 文件路径：`docs/spec/versions/v16/tasks.md`  
> 规范版本：v16 · 日期：2026-11-23  
> 关联需求：[docs/spec/versions/v16/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v16/requirements.md)  
> 关联设计：[docs/spec/versions/v16/design.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v16/design.md)

执行时须严格遵循 `requirements.md` 中的验收标准，采用 TDD（红-绿-重构）开发方式。

---

## 任务清单

---

- [x] **TASK-066 · `AppService.GetWorkspaceRoot` 动态读取 settings 配置并联动 `CreateApp`（Go TDD）**

  > 依赖：无

  - [x] 编写测试用例 `internal/app/workspace_root_test.go`（Red）：
    - 验证当 settings 表中存在 `workspace.dir` 时，`GetWorkspaceRoot(ctx)` 返回该自定义路径
    - 验证当 settings 表为空时，`GetWorkspaceRoot(ctx)` 依次回退到 `workspaceRoot` 变量与 `./workspace`
    - 验证 `CreateApp(ctx, req)` 在 `CustomPath == ""` 时，自动在 `workspace.dir` 下创建工程子目录
    - 验证动态更新 `workspace.dir` 后，后续 `CreateApp` 立即在新路径下创建工程
  - [x] 在 `internal/app/service.go` 中实现 `GetWorkspaceRoot(ctx context.Context) string` 并改造 `CreateApp`（Green）
  - [x] 在 `app.go` 中联动更新 `startup`、`SaveSettings` 与 `CreateAppFromTemplate`（Green）
  - [x] 运行 Go 单元测试确保测试全部通过（Refactor）

  **验证方式：**
  ```bash
  go test -v -run TestWorkspaceRoot ./internal/app/...
  ```

  **验收证据：** 单元测试通过，`workspace.dir` 与新建项目完美联动。验收单见 [TASK-066-AC.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v16/ac/TASK-066-AC.md)。  
  _需求: `requirements.md` 中 `v16.REQ-001` (AC-001, AC-002, AC-003, AC-004)  
  _测试类型: Unit, Integration

---

- [x] **TASK-067 · 前端设置联动、抽屉组件与新建项目默认路径同步**

  > 依赖：TASK-066

  - [x] 扩展前端测试 `frontend/src/App.test.tsx`：
    - 验证在设置中保存新 `workspace.dir` 后，新建项目使用新路径
    - 验证 `AppDrawer` 传递 `onCreateNamedApp` 并在点击 New Application 时调用
  - [x] 在 `frontend/src/App.tsx` 中：
    - 在 `SettingsModal.onSave` 中同步更新 `workspaceDir`
    - 在 `AppDrawer` 中注入 `onCreateNamedApp={desktop ? createDesktopProject : undefined}`
    - 在 fallback `onCreateApp` 中采用 `settings['workspace.dir']` 作为目录前缀
  - [x] 运行 Vitest 确保测试全绿并通过

  **验证方式：**
  ```bash
  pnpm --filter frontend test App.test.tsx
  ```

  **验收证据：** 前端全量测试 ALL PASS。验收单见 [TASK-067-AC.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v16/ac/TASK-067-AC.md)。  
  _需求: `requirements.md` 中 `v16.REQ-002` (AC-001, AC-002)  
  _测试类型: Component, Integration

---

- [x] **TASK-068 · 全量回归与端到端质量验收**

  > 依赖：TASK-066, TASK-067

  - [x] 执行全套自动化测试套件：
    - `go test -count=1 ./...`
    - `pnpm --filter frontend test`
    - `pnpm --filter frontend build`
  - [x] 产出验收证据存入 `docs/spec/versions/v16/ac/` 与 `reports/`

  **验证方式：**
  ```bash
  pnpm --filter frontend test && pnpm --filter frontend build && go test ./...
  ```

  **验收证据：** 全量测试与类型构建 100% 通过。验收单见 [TASK-068-AC.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v16/ac/TASK-068-AC.md)。  
  _需求: 全量验收  
  _测试类型: System
