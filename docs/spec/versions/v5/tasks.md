# 实施任务分解（Tasks）· Blot-UI v5

> 文件路径：`docs/spec/versions/v5/tasks.md`  
> 规范版本：v5 · 日期：2026-11-21  
> 状态：就绪（已拆解 4 项交付任务）  
> 选型架构：Wails v2 + React 19 + TypeScript + Go 1.26 + SQLite + Git  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 任务概览表

| 任务编号 | 任务名称 | 对应需求 | 预计产物 | 测试类型 | 状态 |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **TASK-021** | 应用模版元数据管理与脚手架初始化服务 | `v5.REQ-001` | `internal/template/`, `app.go` | Unit / Integ | 待开始 |
| **TASK-022** | 前端模版选择器组件 `TemplateModal.tsx` 与新建项目联动 | `v5.REQ-001` | `TemplateModal.tsx`, `AppDrawer.tsx` | Unit / UI | 待开始 |
| **TASK-023** | 全局命令面板 `CommandPalette.tsx` 与全键盘快捷键系统集成 | `v5.REQ-002` | `CommandPalette.tsx`, `App.tsx` | Unit / UI | 待开始 |
| **TASK-024** | Blot-UI v5 全流程整合与 Playwright E2E 自动化验收 | `v5.REQ-001` ~ `v5.REQ-002` | `frontend/e2e/v5-workflow.spec.ts`, 截图证据 | E2E / Visual | 待开始 |

---

## 任务详情

### TASK-021 · 应用模版元数据管理与脚手架初始化服务

> 依赖：无  
> 官方源码参考：[src/services/template_service.ts](https://github.com/dyad-sh/dyad/blob/main/src/services/template_service.ts)

- [x] 在 `internal/template/template.go` 中注册 4 套官方内置模版（SaaS Dashboard, Portfolio, Landing Page, Storefront）
- [x] 实现 `TemplateService.InstantiateTemplate`：解压模版代码、初始化 Git 仓库、关联 SQLite 活跃应用
- [x] 在 `app.go` 中暴露 `GetAppTemplates` 与 `CreateAppFromTemplate` Wails RPC 接口

**验证方式：**
```bash
go test -v -count=1 ./internal/template/...
```

**验收证据：** 单元测试通过，成功实例化模版并注册应用，生成 `docs/spec/versions/v5/ac/TASK-021-AC.md`。  
_需求:_ `requirements.md` 中 `v5.REQ-001`  
_验收标准:_ `v5.REQ-001-AC-001`, `v5.REQ-001-AC-002`  
_测试类型:_ Unit / Integration

---

### TASK-022 · 前端模版选择器组件 `TemplateModal.tsx` 与新建项目联动

> 依赖：TASK-021  
> 官方源码参考：[src/components/TemplatePicker.tsx](https://github.com/dyad-sh/dyad/blob/main/src/components/TemplatePicker.tsx)

- [x] 创建 `frontend/src/components/TemplateModal.tsx`：提供模版卡片浏览、分类过滤与一键实例化项目表单
- [x] 在 `AppDrawer.tsx` 的 "+ New Application" 中联动呼出 `TemplateModal`
- [x] 编写前端单元测试 `TemplateModal.test.tsx`

**验证方式：**
```bash
cd frontend && pnpm test -- TemplateModal
```

**验收证据：** 单元测试通过，生成 `docs/spec/versions/v5/ac/TASK-022-AC.md`。  
_需求:_ `requirements.md` 中 `v5.REQ-001`  
_验收标准:_ `v5.REQ-001-AC-003`  
_测试类型:_ Unit / UI

---

### TASK-023 · 全局命令面板 `CommandPalette.tsx` 与全键盘快捷键系统集成

> 依赖：TASK-022  
> 官方源码参考：[src/components/CommandPalette.tsx](https://github.com/dyad-sh/dyad/blob/main/src/components/CommandPalette.tsx)

- [x] 创建 `frontend/src/components/CommandPalette.tsx`：提供半透明磨砂居中搜索弹窗，支持全键盘高亮选择与回车触发
- [x] 在 `App.tsx` 中注册全局 `keydown` 监听器（`Ctrl+K` / `Cmd+K` / `Escape`），聚合系统全部常用操作项
- [x] 编写前端单元测试 `CommandPalette.test.tsx` 与 `App.test.tsx` 扩展用例

**验证方式：**
```bash
cd frontend && pnpm test -- CommandPalette App
```

**验收证据：** 单元测试通过，生成 `docs/spec/versions/v5/ac/TASK-023-AC.md`。  
_需求:_ `requirements.md` 中 `v5.REQ-002`  
_验收标准:_ `v5.REQ-002-AC-001`, `v5.REQ-002-AC-002`, `v5.REQ-002-AC-003`  
_测试类型:_ UI / Unit

---

### TASK-024 · Blot-UI v5 全流程整合与 Playwright E2E 自动化验收

> 依赖：TASK-021 ~ TASK-023  
> 官方源码参考：[src/main.ts](https://github.com/dyad-sh/dyad/blob/main/src/main.ts)

- [ ] 在 `frontend/e2e/v5-workflow.spec.ts` 中编写端到端自动化测试用例，覆盖：
  1. 通过模版中心选择 `SaaS Analytics Dashboard` 模版一键初始化全新项目；
  2. 使用快捷键 `Ctrl+K` 呼出命令面板，输入关键字模糊搜索；
  3. 通过命令面板切换至 `Cyberpunk Neon` 主题；
  4. 截取并留存 4 组关键高保真验收截图。
- [ ] 编写 `docs/spec/versions/v5/ac/TASK-024-AC.md` 与 `v5-final-report.md`，执行全量回归。

**验证方式：**
```bash
cd frontend && pnpm exec playwright test e2e/v5-workflow.spec.ts
go test -v -count=1 ./...
```

**验收证据：** Playwright E2E 全流程测试通过，产出高保真截图证据，全量构建测试通过。  
_需求:_ `requirements.md` 中 `v5.REQ-001` ~ `v5.REQ-002`  
_验收标准:_ 全部 AC 全量通过  
_测试类型:_ E2E / Visual Regression
