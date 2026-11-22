# 版本完成质量报告 · Blot-UI v16

> 规范版本：v16  
> 任务范畴：TASK-066, TASK-067, TASK-068  
> 执行日期：2026-11-23  
> 分支名称：`feat/TASK-066-068-custom-workspace-dir`  

---

## 1. 目标与背景概述

用户需求反馈：在系统设置中设定了新的默认存储路径（`workspace.dir`），但在新建项目或从模版创建项目时，项目依然创建在启动时默认的项目根目录下，未能使用新设置的默认路径。

本次 v16 迭代遵循 HNS-SDD 敏捷规范与严格 TDD 流程，彻底打通了设置存储路径（`workspace.dir`）在后端生命周期与前端状态中的动态响应机制：
1. **动态解析**: `AppService.GetWorkspaceRoot(ctx)` 动态优先读取 SQLite settings 表中的 `workspace.dir`，确保任何时刻创建新项目均能即时采用最新设置路径。
2. **内存与生命周期联动**: 在应用启动时从 settings 表恢复默认路径；在调用 `SaveSettings` 保存新路径时，即时同步刷新 `appService.SetWorkspaceRoot(newDir)`，无需重启应用立即生效。
3. **前端与抽屉视图同步**: `AppDrawer` 与 `ProjectsCenterView` 正确挂载 `onCreateNamedApp` 入口；`SettingsModal` 保存后同步更新前端工作区目录状态。

---

## 2. 变更文件清单

| 文件路径 | 变更类型 | 说明 |
|---|:---:|---|
| `internal/app/service.go` | 修改 | 新增 `GetWorkspaceRoot(ctx context.Context) string`，并在 `CreateApp` 中使用其动态解析结果作为根目录 |
| `internal/app/workspace_root_test.go` | 新增 | Go TDD 单元与集成测试，覆盖默认回退、配置优先、新建项目路径、动态更新即时生效 |
| `app.go` | 修改 | `startup` 从 settings 表恢复存储路径；`SaveSettings` 同步更新内存；`CreateAppFromTemplate` 动态解析默认 `DestPath` |
| `frontend/src/App.tsx` | 修改 | `SettingsModal.onSave` 同步刷新 `workspaceDir`；`AppDrawer` 与 `ProjectsCenterView` 注入 `onCreateNamedApp`；fallback 动态解析 `settings['workspace.dir']` |
| `frontend/src/App.test.tsx` | 修改 | 新增配置自定义 `workspace.dir` 后新建项目的测试用例 |
| `docs/spec/README.md` | 修改 | 更新活跃版本标识至 v16，归档 v15 |
| `docs/spec/versions/v16/*` | 新增 | requirements.md, design.md, tasks.md, traceability.md, AC 验收单 |

---

## 3. 测试验证与质量数据

### 3.1 Go 自动化测试

- **执行命令**: `go test -count=1 ./...`
- **覆盖包范围**: 18 个核心包（app, db, agent, scaffold, export, settings, template 等）
- **通过率**: **100% PASS**（0 失败，0 忽略）

### 3.2 前端自动化测试

- **执行命令**: `pnpm --filter frontend test`
- **测试套件**: 35 passed (35)
- **测试用例**: 214 passed (214)
- **通过率**: **100% PASS**（0 失败）

### 3.3 TypeScript 类型检查与构建

- **执行命令**: `pnpm --filter frontend build`
- **构建结果**: `tsc && vite build` 耗时 1.16s，产物打包无错误

---

## 4. 结论与交付物

本次修改完整满足用户期望：在系统设置中设置了新的默认存储路径后，新建项目（包括空白项目、模版项目、以及从首页/工作台快捷创建的项目）均直接在用户新设定的默认路径下创建，无须重启应用。
所有代码经 TDD 测试全绿保护，质量达标，已具备合并到主干的条件。
