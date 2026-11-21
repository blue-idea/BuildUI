# 实施任务分解（Tasks）· Blot-UI v4

> 文件路径：`docs/spec/versions/v4/tasks.md`  
> 规范版本：v4 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项交付任务）  
> 选型架构：Wails v2 + React 19 + TypeScript + Go 1.26 + SQLite + Git  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 任务概览表

| 任务编号 | 任务名称 | 对应需求 | 预计产物 | 测试类型 | 状态 |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **TASK-017** | 智能第三方依赖提取、白名单安全校验与沙箱异步安装服务 | `v4.REQ-001` | `internal/agent/dependency_manager.go`, `internal/app/runner/` | Unit / Integ | 待开始 |
| **TASK-018** | UI 视觉主题引擎、预设集管理与跨沙箱动态 CSS 注入 | `v4.REQ-002` | `internal/theme/`, `ThemeSelector.tsx`, `app.go` | Unit / UI | 待开始 |
| **TASK-019** | 主界面集成：依赖安装实时进度反馈与主题持久化联动 | `v4.REQ-001`, `v4.REQ-002` | `App.tsx`, `PreviewPanel.tsx`, `App.test.tsx` | Unit / UI | 待开始 |
| **TASK-020** | Blot-UI v4 全流程整合与 Playwright E2E 自动化验收 | `v4.REQ-001` ~ `v4.REQ-002` | `frontend/e2e/v4-workflow.spec.ts`, 截图证据 | E2E / Visual | 待开始 |

---

## 任务详情

### TASK-017 · 智能第三方依赖提取、白名单安全校验与沙箱异步安装服务

> 依赖：无  
> 官方源码参考：[src/services/package_service.ts](https://github.com/dyad-sh/dyad/blob/main/src/services/package_service.ts)

- [x] 在 `internal/agent/dependency_manager.go` 中实现 `ValidatePackageName` 与 `SanitizePackages`：正则校验防命令注入
- [x] 在 `internal/app/runner/runner.go` 中扩展 `InstallPackages`：异步调用 `pnpm add`，通过 Wails 事件总线推流安装状态
- [x] 在 `app.go` 中暴露 `InstallDependencies` RPC 方法供前端与 Agent 触发

**验证方式：**
```bash
go test -v -count=1 ./internal/agent/... ./internal/app/runner/...
```

**验收证据：** 单元测试与集成测试通过，生成 `docs/spec/versions/v4/ac/TASK-017-AC.md`。  
_需求:_ `requirements.md` 中 `v4.REQ-001`  
_验收标准:_ `v4.REQ-001-AC-001`, `v4.REQ-001-AC-002`, `v4.REQ-001-AC-003`  
_测试类型:_ Unit / Integration

---

### TASK-018 · UI 视觉主题引擎、预设集管理与跨沙箱动态 CSS 注入

> 依赖：无  
> 官方源码参考：[src/themes/theme_manager.ts](https://github.com/dyad-sh/dyad/blob/main/src/themes/theme_manager.ts)

- [x] 在 `internal/theme/theme.go` 中定义 5 组内置主题预设，并在 `app.go` 暴露 `GetThemePresets` 与 `SetAppTheme`
- [x] 在前端实现 `frontend/src/components/ThemeSelector.tsx`：提供优雅的主题下拉切换器，呈现主题色标
- [x] 编写前端单元测试 `ThemeSelector.test.tsx`

**验证方式：**
```bash
go test -v -count=1 ./internal/theme/...
cd frontend && pnpm test -- ThemeSelector
```

**验收证据：** 单元测试通过，生成 `docs/spec/versions/v4/ac/TASK-018-AC.md`。  
_需求:_ `requirements.md` 中 `v4.REQ-002`  
_验收标准:_ `v4.REQ-002-AC-001`, `v4.REQ-002-AC-002`  
_测试类型:_ Unit / UI

---

### TASK-019 · 主界面集成：依赖安装实时进度反馈与主题持久化联动

> 依赖：TASK-017, TASK-018  
> 官方源码参考：[src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts)

- [ ] 在 `frontend/src/App.tsx` 导航栏集成 `ThemeSelector`，并通过 `postMessage` 向 `PreviewPanel` 注入 CSS 变量
- [ ] 在 `App.tsx` 中监听依赖安装事件并在聊天区展示动态安装卡片与重试机制
- [ ] 扩展 `App.test.tsx` 覆盖主题切换与依赖安装状态反馈

**验证方式：**
```bash
cd frontend && pnpm test -- App
```

**验收证据：** 单元测试通过，生成 `docs/spec/versions/v4/ac/TASK-019-AC.md`。  
_需求:_ `requirements.md` 中 `v4.REQ-001`, `v4.REQ-002`  
_验收标准:_ `v4.REQ-001-AC-002`, `v4.REQ-002-AC-002`, `v4.REQ-002-AC-003`  
_测试类型:_ UI / Unit

---

### TASK-020 · Blot-UI v4 全流程整合与 Playwright E2E 自动化验收

> 依赖：TASK-017 ~ TASK-019  
> 官方源码参考：[src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts)

- [ ] 在 `frontend/e2e/v4-workflow.spec.ts` 中编写端到端自动化测试用例，覆盖：
  1. 顶部导航栏切换主题（如切换至 Cyberpunk Neon 与 Forest Emerald），验证宿主与预览主题类名与 CSS 变量；
  2. 触发依赖安装事件，验证安装进度卡片呈现与安装成功反馈；
  3. 捕获并留存 4 组关键高保真验收截图。
- [ ] 编写 `docs/spec/versions/v4/ac/TASK-020-AC.md` 与 `v4-final-report.md`，执行全量回归。

**验证方式：**
```bash
cd frontend && pnpm exec playwright test e2e/v4-workflow.spec.ts
go test -v -count=1 ./...
```

**验收证据：** Playwright E2E 全流程测试通过，产出高保真截图证据，全量构建测试通过。  
_需求:_ `requirements.md` 中 `v4.REQ-001` ~ `v4.REQ-002`  
_验收标准:_ 全部 AC 全量通过  
_测试类型:_ E2E / Visual Regression
