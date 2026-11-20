# docs/knowledge/README.md · 核心引用源码与规则本地知识库

> 本目录作为 Dyad 核心复刻工程的**本地知识库**，完整备份了上游 Dyad 项目中最关键的 54 个实现源码、规则文件与提示词，便于离线查阅与逆向复刻。  
> 官方源码基准仓库：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 知识库索引与上游网络对齐清单

### 1. 工业级脚手架（Scaffold）
| 本地备份文件 | 上游网络完整路径 | 作用说明 |
| :--- | :--- | :--- |
| `scaffold/AI_RULES.md` | [github: scaffold/AI_RULES.md](https://github.com/dyad-sh/dyad/blob/main/scaffold/AI_RULES.md) | 脚手架目录规范与 AI 编程守则 |
| `scaffold/package.json` | [github: scaffold/package.json](https://github.com/dyad-sh/dyad/blob/main/scaffold/package.json) | 预置依赖栈（React 19 + Tailwind + 40+ shadcn/ui 组件） |
| `scaffold/src/App.tsx` | [github: scaffold/src/App.tsx](https://github.com/dyad-sh/dyad/blob/main/scaffold/src/App.tsx) | 默认路由入口与 TanStack Query / Toaster 配置 |
| `scaffold/src/pages/Index.tsx` | [github: scaffold/src/pages/Index.tsx](https://github.com/dyad-sh/dyad/blob/main/scaffold/src/pages/Index.tsx) | 默认主页入口 |
| `scaffold/src/components/ui/button.tsx` | [github: scaffold/src/components/ui/button.tsx](https://github.com/dyad-sh/dyad/blob/main/scaffold/src/components/ui/button.tsx) | shadcn/ui 组件实现参考 |

### 2. 蓝图设计与前置门禁（App Blueprint）
| 本地备份文件 | 上游网络完整路径 | 作用说明 |
| :--- | :--- | :--- |
| `src/ipc/handlers/app_blueprint_handlers.ts` | [github: src/ipc/handlers/app_blueprint_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/app_blueprint_handlers.ts) | 蓝图内存与持久化状态机及批准 IPC 处理器 |
| `src/ipc/types/app_blueprint.ts` | [github: src/ipc/types/app_blueprint.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/types/app_blueprint.ts) | 蓝图、问卷与视觉资产 Zod Schema 契约 |
| `src/pro/main/ipc/handlers/local_agent/tools/write_app_blueprint.ts` | [github: src/pro/main/ipc/handlers/local_agent/tools/write_app_blueprint.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/write_app_blueprint.ts) | Agent 生成应用蓝图的工具定义 |

### 3. 多代理协同与提示词工程（Prompts & Multi-Agent）
| 本地备份文件 | 上游网络完整路径 | 作用说明 |
| :--- | :--- | :--- |
| `src/prompts/local_agent_prompt.ts` | [github: src/prompts/local_agent_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/local_agent_prompt.ts) | Local Agent v2 核心系统提示词（工作流与零占位符铁律） |
| `src/prompts/system_prompt.ts` | [github: src/prompts/system_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/system_prompt.ts) | 思考链、XML 标签规范与代码示例体系 |
| `src/prompts/plan_mode_prompt.ts` | [github: src/prompts/plan_mode_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/plan_mode_prompt.ts) | 规划（Plan）模式提示词规范 |
| `src/prompts/chat_markdown_prompt.ts` | [github: src/prompts/chat_markdown_prompt.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/chat_markdown_prompt.ts) | Markdown 渲染与格式化指引 |
| `src/prompts/shell_review_policy.ts` | [github: src/prompts/shell_review_policy.ts](https://github.com/dyad-sh/dyad/blob/main/src/prompts/shell_review_policy.ts) | 本地 Shell 命令执行前的独立安全审查策略 |
| `src/prompts/guides/add-authentication.md` | [github: src/prompts/guides/add-authentication.md](https://github.com/dyad-sh/dyad/blob/main/src/prompts/guides/add-authentication.md) | 认证系统实现提示词指南 |
| `src/pro/main/ipc/handlers/local_agent/tools/subagent_tools.ts` | [github: src/pro/main/ipc/handlers/local_agent/tools/subagent_tools.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/subagent_tools.ts) | Explorer 与 Implementer 子代理调度工具 |

### 4. 闭环验证与自动修复流水线（Verification Engine）
| 本地备份文件 | 上游网络完整路径 | 作用说明 |
| :--- | :--- | :--- |
| `src/pro/main/ipc/handlers/local_agent/tools/run_type_checks.ts` | [github: src/pro/main/ipc/handlers/local_agent/tools/run_type_checks.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/run_type_checks.ts) | TypeScript 静态类型检查工具 |
| `src/ipc/handlers/problems_handlers.ts` | [github: src/ipc/handlers/problems_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/problems_handlers.ts) | 语法问题收集与诊断处理器 |
| `src/pro/main/ipc/handlers/local_agent/tools/run_build.ts` | [github: src/pro/main/ipc/handlers/local_agent/tools/run_build.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/run_build.ts) | Git Worktree 隔离快照生产打包验证工具 |
| `src/ipc/services/git_overlay_workspace.ts` | [github: src/ipc/services/git_overlay_workspace.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/services/git_overlay_workspace.ts) | Git Overlay Worktree 隔离工作区创建与同步服务 |
| `src/ipc/services/isolated_package_install.ts` | [github: src/ipc/services/isolated_package_install.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/services/isolated_package_install.ts) | 隔离依赖安装服务 |
| `src/pro/main/ipc/handlers/local_agent/tools/run_tests.ts` | [github: src/pro/main/ipc/handlers/local_agent/tools/run_tests.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/run_tests.ts) | Playwright E2E 自动化测试执行与截图捕捉工具 |
| `src/ipc/handlers/tests_handlers.ts` | [github: src/ipc/handlers/tests_handlers.ts](https://github.com/dyad-sh/dyad/blob/main/src/ipc/handlers/tests_handlers.ts) | 测试运行隔离与用例执行处理器 |

### 5. 核心工具集（Agent Tools）
| 本地备份文件 | 上游网络完整路径 | 作用说明 |
| :--- | :--- | :--- |
| `src/pro/main/ipc/handlers/local_agent/tools/write_file.ts` | [github: src/pro/main/ipc/handlers/local_agent/tools/write_file.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/write_file.ts) | 文件写入与全量重写工具 |
| `src/pro/main/ipc/handlers/local_agent/tools/search_replace.ts` | [github: src/pro/main/ipc/handlers/local_agent/tools/search_replace.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/search_replace.ts) | 精准按行局部代码替换工具 |
| `src/pro/main/ipc/handlers/local_agent/tools/add_dependency.ts` | [github: src/pro/main/ipc/handlers/local_agent/tools/add_dependency.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/add_dependency.ts) | 自动安装 npm 第三方依赖包工具 |
| `src/pro/main/ipc/handlers/local_agent/tools/execute_sql.ts` | [github: src/pro/main/ipc/handlers/local_agent/tools/execute_sql.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tools/execute_sql.ts) | 数据库 SQL 查询与执行工具 |
| `src/pro/main/ipc/handlers/local_agent/tool_definitions.ts` | [github: src/pro/main/ipc/handlers/local_agent/tool_definitions.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/tool_definitions.ts) | 工具集合装配与权限过滤逻辑 |
| `src/pro/main/ipc/handlers/local_agent/local_agent_handler.ts` | [github: src/pro/main/ipc/handlers/local_agent/local_agent_handler.ts](https://github.com/dyad-sh/dyad/blob/main/src/pro/main/ipc/handlers/local_agent/local_agent_handler.ts) | Local Agent 核心调度执行处理器 |

### 6. 数据模型与本地存储（Database & Persistence）
| 本地备份文件 | 上游网络完整路径 | 作用说明 |
| :--- | :--- | :--- |
| `src/db/schema.ts` | [github: src/db/schema.ts](https://github.com/dyad-sh/dyad/blob/main/src/db/schema.ts) | SQLite Drizzle ORM Schema 定义 |
| `src/db/index.ts` | [github: src/db/index.ts](https://github.com/dyad-sh/dyad/blob/main/src/db/index.ts) | SQLite 数据库连接初始化 |

### 7. 运行时管理与动态实时预览（Runtime & Preview）
| 本地备份文件 | 上游网络完整路径 | 作用说明 |
| :--- | :--- | :--- |
| `src/app_run/definition.ts` | [github: src/app_run/definition.ts](https://github.com/dyad-sh/dyad/blob/main/src/app_run/definition.ts) | 本地应用开发服务器状态机定义 |
| `src/app_run/transport.ts` | [github: src/app_run/transport.ts](https://github.com/dyad-sh/dyad/blob/main/src/app_run/transport.ts) | 运行状态机跨进程事件传输 |
| `src/preview_iframe/controller.ts` | [github: src/preview_iframe/controller.ts](https://github.com/dyad-sh/dyad/blob/main/src/preview_iframe/controller.ts) | 预览 Iframe 页面刷新与生命周期控制器 |
| `src/preview_iframe/commands.ts` | [github: src/preview_iframe/commands.ts](https://github.com/dyad-sh/dyad/blob/main/src/preview_iframe/commands.ts) | 预览交互指令（rebuild、restart、refresh） |
| `src/preview_console/store.ts` | [github: src/preview_console/store.ts](https://github.com/dyad-sh/dyad/blob/main/src/preview_console/store.ts) | 运行时前端控制台日志与报错收集 Store |

### 8. 架构规范与核心规则（Rules）
| 本地备份文件 | 上游网络完整路径 | 作用说明 |
| :--- | :--- | :--- |
| `rules/local-agent-tools.md` | [github: rules/local-agent-tools.md](https://github.com/dyad-sh/dyad/blob/main/rules/local-agent-tools.md) | Agent 工具标记、只读/计划模式与状态修改防护 |
| `rules/electron-ipc.md` | [github: rules/electron-ipc.md](https://github.com/dyad-sh/dyad/blob/main/rules/electron-ipc.md) | IPC 端点安全边界与 React Query 绑定规范 |
| `rules/dyad-errors.md` | [github: rules/dyad-errors.md](https://github.com/dyad-sh/dyad/blob/main/rules/dyad-errors.md) | DyadError / DyadErrorKind 异常分类规范 |
| `rules/app-operation-coordination.md` | [github: rules/app-operation-coordination.md](https://github.com/dyad-sh/dyad/blob/main/rules/app-operation-coordination.md) | 主进程跨子系统协同规范 |
| `rules/hybrid-testing.md` | [github: rules/hybrid-testing.md](https://github.com/dyad-sh/dyad/blob/main/rules/hybrid-testing.md) | Vitest 混合集成测试规范 |
| `rules/e2e-testing.md` | [github: rules/e2e-testing.md](https://github.com/dyad-sh/dyad/blob/main/rules/e2e-testing.md) | Playwright E2E 测试最佳实践 |
| `rules/git-workflow.md` | [github: rules/git-workflow.md](https://github.com/dyad-sh/dyad/blob/main/rules/git-workflow.md) | Git 分支与 Worktree 协作指引 |
