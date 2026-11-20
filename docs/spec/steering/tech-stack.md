# 项目级恒定规则 · 技术栈锁定 (tech-stack)

> 文件路径：`docs/spec/steering/tech-stack.md`  
> 适用范围：所有 Version 均继承本规则，确立 Wails + React 架构的基准技术选型。  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 核心运行环境

| 类别 | 选型 | 版本要求 | 作用说明 |
| :--- | :--- | :--- | :--- |
| **桌面运行时** | Wails v2 | ^2.9.0 (当前: v2.13.0) | 跨平台轻量桌面应用框架，原生绑定 Go 后端与 Webview 前端 |
| **后端语言** | Go | >= 1.24 (当前: go1.26.0) | 后端主服务、进程监管、Agent 运行时与本地数据层 |
| **Node.js** | Node.js | >= 20.0.0 (当前: v24.14.0) | 前端打包与目标用户应用（Scaffold）的本地运行依赖 |
| **包管理器** | pnpm | >= 9.0.0 (当前: v10.30.2) | 前端及生成应用的包管理器（严禁与 npm/yarn 混用） |

---

## 2. 前端技术栈（Frontend Webview）

| 类别 | 选型 | 版本要求 | 作用说明 |
| :--- | :--- | :--- | :--- |
| **核心框架** | React | ^19.0.0 | 前端用户界面渲染框架 |
| **构建工具** | Vite | ^6.0.0 | 前端快速打包与 HMR 开发服务器 |
| **编程语言** | TypeScript | ^5.5.0 | 严格静态类型支持（启用 `strict: true`） |
| **通信绑定** | Wails TS Bindings | 自动生成 (`frontend/wailsjs`) | 强类型前后端调用与运行时事件监听（`runtime.EventsEmit` / `EventsOn`） |
| **状态管理** | TanStack Query + Jotai | 最新稳定版 | 远程状态缓存与轻量原子化客户端状态 |
| **UI 原语** | Base UI (`@base-ui/react`) | 最新版本 | 无障碍 Headless UI 基础组件库（杜绝 Radix UI） |
| **样式系统** | Tailwind CSS | ^3.4.0 / ^4.0.0 | 实用类优先的 CSS 样式引擎 |
| **富文本与输入** | Lexical | 最新稳定版 | Chat 输入框、高亮语法与 Mention 提示 |

---

## 3. 后端与主服务技术栈（Go Backend）

| 类别 | 选型 | 作用说明 |
| :--- | :--- | :--- |
| **本地数据库** | SQLite (`modernc.org/sqlite`) | 纯 Go 驱动嵌入式 SQLite，无 CGO 依赖，完美支持 Windows 原生编译与数据隔离 |
| **数据库迁移与访问** | 原生 SQL / 轻量 SQL 构建器 | 结构化管理数据表迁移与强类型查询，存储应用元数据、会话记录与蓝图信息 |
| **Git 引擎** | Git CLI / `go-git` (`github.com/go-git/go-git/v5`) | 管理代码提交历史、分支切换与 Worktree 隔离快照构建 |
| **结构化日志** | Go `log/slog` | Go 1.21+ 内置结构化日志，分作用域输出 JSON/Text 日志到本地文件与控制台 |
| **多任务并发** | Goroutine + Go Channel + Context | 高效管理并发 Agent 任务、流式 Token 调度与子进程生命周期取消 |
| **进程监管** | Go `os/exec` | 监管用户目标应用 Vite 开发服务器，提供精准的端口监听与优雅退出控制 |

---

## 4. 生成目标应用的默认脚手架栈（Scaffold Application Stack）

被生成的 Web 应用程序标准技术栈保持与上游规范一致：
- **框架**：React 19 + TypeScript + Vite
- **UI 体系**：Tailwind CSS + shadcn/ui 全组件集 + Lucide React
- **路由体系**：React Router DOM
- **数据管理**：TanStack React Query
- **云端服务适配**：Supabase Client (`@supabase/supabase-js`) / Neon Serverless Postgres

---

## 5. 质量保证与测试技术栈

| 测试层级 | 工具 | 运行方式 | 验收要求 |
| :--- | :--- | :--- | :--- |
| **Go 单元/集成测试** | `go test` | `go test -race -cover ./...` | 核心逻辑覆盖率达成，展示实际控制台输出 |
| **React 单元/组件测试** | Vitest + Testing Library | `pnpm test` | 覆盖主要交互路径与状态变更 |
| **桌面端 E2E 测试** | Playwright | 驱动 Wails Webview 桌面窗口 | **必须截图留证** |
| **视觉回归测试** | Playwright Screenshot | 布局、主题与关键卡片比对 | **必须生成 Baseline 与 Diff** |
