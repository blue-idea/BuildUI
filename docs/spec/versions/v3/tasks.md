# 实施任务清单（Tasks）· Blot-UI v3

> 文件路径：`docs/spec/versions/v3/tasks.md`  
> 规范版本：v3 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项高内聚交付任务）  
> 架构基准：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 任务拆解一览

| 任务编号 | 任务名称 | 依赖关系 | 对应需求 | 预计产出 / 交付模块 |
| :--- | :--- | :---: | :---: | :--- |
| **TASK-013** | 多应用工作区管理服务、活跃应用切换与 SQLite 级联安全删除 | 无 | `v3.REQ-001` | `internal/app`, `internal/db`, `AppDrawer.tsx` |
| **TASK-014** | 可视化组件定位审查器（Component Inspector）与定向 Prompt 联动 | TASK-013 | `v3.REQ-002` | `internal/inspector`, `PreviewPanel.tsx`, `ComponentInspector.tsx` |
| **TASK-015** | 一键工程 Zip 归档导出服务与操作系统原生资源管理器定位 | TASK-013 | `v3.REQ-003` | `internal/export`, `ExportModal.tsx` |
| **TASK-016** | Blot-UI v3 全流程整合与 Playwright E2E 自动化验收 | TASK-013 ~ 015 | `v3.REQ-001..003` | `frontend/e2e/v3-workflow.spec.ts`, 验收报告 |

---

## 详细任务定义

### TASK-013 · 多应用工作区管理服务、活跃应用切换与 SQLite 级联安全删除

> 依赖：无  
> 官方源码参考：[src/ipc/handlers/apps_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/apps_handlers.ts)

- [x] 在 `internal/db/app_repository.go` 中扩展 `SetActiveAppID`、`GetActiveAppID` 以及带事务外键级联检查的 `DeleteApp` 逻辑
- [x] 在 `internal/app/app_service.go` 中实现 `SwitchApp` 方法：停止旧应用的开发服务器，原子切换活动应用指针，重新挂载对应的工作区与历史会话
- [x] 在 `app.go` 中暴露 `SwitchApp` 与 `DeleteApp` Wails RPC 绑定
- [x] 在前端构建 `AppDrawer.tsx`：提供侧边抽屉式多应用面板，显示应用列表、当前活跃徽标、新建应用按钮与删除非活跃应用按钮

**验证方式：**
```bash
go test -v -count=1 ./internal/app/... ./internal/db/...
cd frontend && pnpm test -- AppDrawer
```

**验收证据：** 单元测试通过，能够在抽屉中切换应用并刷新主工作区视图（详见 `docs/spec/versions/v3/ac/TASK-013-AC.md`）。  
_需求:_ `requirements.md` 中 `v3.REQ-001`  
_验收标准:_ `v3.REQ-001-AC-001`, `v3.REQ-001-AC-002`, `v3.REQ-001-AC-003`  
_测试类型:_ Unit / Integration

---

### TASK-014 · 可视化组件定位审查器（Component Inspector）与定向 Prompt 联动

> 依赖：TASK-013  
> 官方源码参考：[src/pro/main/ipc/handlers/local_agent/tools/read_file.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/read_file.ts) 与 [scaffold/src/App.tsx](https://github.com/dyad-sh/dyad/blob/main/scaffold/src/App.tsx)

- [x] 在 `internal/inspector` 中实现 `InspectorService.ResolveComponent`：根据元素元数据逆向解析对应的 `.tsx` 组件路径并生成提示词模板
- [x] 在 `app.go` 中暴露 `ResolveComponent` RPC 方法
- [x] 在前端构建 `ComponentInspector.tsx`，在 `PreviewPanel.tsx` 增加“Inspect Component”切换开关与活动提示遮罩
- [x] 点击 DOM 元素时触发审查捕获，将 `@src/components/...: ` 自动预填至聊天输入框并获得焦点

**验证方式：**
```bash
go test -v -count=1 ./internal/inspector/...
cd frontend && pnpm test -- ComponentInspector
```

**验收证据：** 单元测试通过，能够在预览中开启审查模式并点击元素自动填充前缀至输入框（详见 `docs/spec/versions/v3/ac/TASK-014-AC.md`）。  
_需求:_ `requirements.md` 中 `v3.REQ-002`  
_验收标准:_ `v3.REQ-002-AC-001`, `v3.REQ-002-AC-002`, `v3.REQ-002-AC-003`  
_测试类型:_ Unit / Integration

---

### TASK-015 · 一键工程 Zip 归档导出服务与操作系统原生资源管理器定位

> 依赖：TASK-013  
> 官方源码参考：[src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts)

- [x] 在 `internal/export/exporter.go` 中实现 `ExportAppZip`：安全校验工作区路径防御 Zip Slip，自动过滤 `.git`, `node_modules`, `dist` 归档为 `.zip`
- [x] 在 `internal/export/reveal.go` 中实现跨平台 `OpenInFileManager`：参数化调用原生资源管理器定位目录，防命令注入
- [x] 在 `app.go` 中暴露 `ExportAppZip` 与 `OpenInFileManager` RPC 绑定
- [x] 在前端构建 `ExportModal.tsx`：提供一键导出 Zip 与在资源管理器中打开当前工程的交互操作

**验证方式：**
```bash
go test -v -count=1 ./internal/export/...
cd frontend && pnpm test -- ExportModal
```

**验收证据：** 单元测试通过，成功生成标准 Zip 压缩文件并支持唤起原生文件管理器（详见 `docs/spec/versions/v3/ac/TASK-015-AC.md`）。  
_需求:_ `requirements.md` 中 `v3.REQ-003`  
_验收标准:_ `v3.REQ-003-AC-001`, `v3.REQ-003-AC-002`, `v3.REQ-003-AC-003`  
_测试类型:_ Unit / Desktop

---

### TASK-016 · Blot-UI v3 全流程整合与 Playwright E2E 自动化验收

> 依赖：TASK-013 ~ TASK-015  
> 官方源码参考：[src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts)

- [x] 在 `frontend/e2e/v3-workflow.spec.ts` 中编写端到端自动化测试用例，覆盖：
  1. 侧边栏打开多应用抽屉并切换应用；
  2. 开启预览区组件审查模式，点击元素触发 `@src/components/...` 注入；
  3. 打开工程导出面板执行 Zip 打包与打开目录操作；
  4. 截取并留存 4 组关键里程碑高保真视觉验收截图。
- [x] 编写 `docs/spec/versions/v3/ac/TASK-016-AC.md` 与 `v3-final-report.md`，执行全量回归。

**验证方式：**
```bash
cd frontend && pnpm exec playwright test e2e/v3-workflow.spec.ts
go test -v -count=1 ./...
```

**验收证据：** Playwright E2E 全流程测试通过，产出高保真截图证据，全量构建测试通过。  
_需求:_ `requirements.md` 中 `v3.REQ-001` ~ `v3.REQ-003`  
_验收标准:_ 全部 AC 全量通过  
_测试类型:_ E2E / Visual Regression
