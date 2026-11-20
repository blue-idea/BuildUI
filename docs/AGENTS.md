# AGENTS.md · 项目级 Agent 入口

> 文件路径：`docs/AGENTS.md`  
> 规范协议：遵照 `hns-sdd` 规范驱动开发流程  
> 核心架构：Wails v2 (Go 1.26+) + React 19 + TypeScript  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 入口说明

本项目（Blot-UI）遵循 SDD（Spec-Driven Development，规范驱动开发）流程。AI 助手或开发人员进入项目后，**先读取本文件**，再读取 [docs/spec/README.md](spec/README.md) 取得当前活跃版本（`current_version`），随后按阶段规格执行。

---

## 必读文件清单（按顺序加载）

1. [docs/spec/README.md](spec/README.md) —— 当前活跃版本（`current_version`）与版本索引
2. [docs/architecture-overview.md](architecture-overview.md) —— 核心应用构建与自动生成机制全景剖析
3. [docs/knowledge/README.md](knowledge/README.md) —— 本地收录的核心源码与规则镜像索引
4. [docs/spec/steering/project-rules.md](spec/steering/project-rules.md) —— 协作 / Git / 测试门槛 / 研发流程
5. [docs/spec/steering/tech-stack.md](spec/steering/tech-stack.md) —— 锁定技术栈（Wails v2 + React 19 + Go 1.26）
6. [docs/spec/steering/style-guide.md](spec/steering/style-guide.md) —— 命名 / 错误格式 / 日志 / Wails 通信规范
7. `docs/spec/versions/{{VERSION}}/constitution.md` —— 项目宪法（v1 首次生成，后续版本沿用）
8. `docs/spec/versions/{{VERSION}}/requirements.md` —— 当前版本需求与 AC（EARS 规范）
9. `docs/spec/versions/{{VERSION}}/design.md` —— 系统架构与核心模块技术设计
10. `docs/spec/versions/{{VERSION}}/tasks.md` —— 任务清单与实施步骤

> 注：`{{VERSION}}` 请统一替换为 `docs/spec/README.md` 中的 `current_version` 字段值（当前为 `v1`）。

---

## 核心复刻目标与约束

- **零占位符实现**：所有核心系统必须实现完整逻辑，杜绝任何 TODO 或虚假 Mock。
- **Wails 强类型边界**：Go 后端服务通过 Wails `Bind` 导出强类型接口，前端通过自动生成的 TypeScript Bindings 调用，事件流经由 `runtime.EventsEmit` 分发。
- **本地应用开发环境集成**：实现独立的 Vite 开发服务器监管（`os/exec`）与 Git Worktree 隔离构建。
- **官方参考基准**：功能闭环与交互流参考 [https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)。
