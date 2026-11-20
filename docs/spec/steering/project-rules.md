# 项目级恒定规则 · 工程化与协作规范 (project-rules)

> 文件路径：`docs/spec/steering/project-rules.md`  
> 适用范围：所有 Version 均继承本规则，确立 Wails + React 架构的工程化协作与质量门槛。  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 协作与分支规范

1. **主干稳定**：`main` 分支为受保护分支，始终保持编译通过与可运行状态。
2. **任务分支**：每个独立任务建立特性分支，命名规范为 `feat/TASK-XXX-<name>` 或 `fix/TASK-XXX-<name>`。
3. **提交信息（Git Commit）**：
   - 遵循 Conventional Commits 格式：`feat(scope): ...`、`fix(scope): ...`、`docs(scope): ...`、`test(scope): ...`。
   - 关联对应任务编号：例如 `feat(agent): implement app blueprint questionnaire (TASK-003)`。

---

## 2. 研发质量门槛与验证流程

在任何代码合入或提交前，必须依次通过以下四级检验：

```sh
# 1. 代码格式化校验 (Go + Frontend)
gofmt -l .
pnpm run fmt:check

# 2. 静态分析 (Linter)
golangci-lint run
pnpm run lint

# 3. 严格类型检查 (TypeScript)
pnpm run ts

# 4. 单元与集成测试 (Go + React)
go test -race -cover ./...
pnpm test
```

> **注意**：
> - Go 格式化统一遵循标准 `gofmt`。
> - 前端格式化必须使用 lockfile 锁定的格式化工具（禁止调用未绑定的外部全局版本）。
> - 禁止使用 `npx tsc` 直接执行类型检查，必须运行统一配置的 `pnpm run ts`。

---

## 3. 测试与验收规范（TDD 铁律）

- **红绿重构协议**：严禁在缺少对应失败测试的情况下直接编写业务逻辑代码。
- **真实调用要求**：测试结果必须来自真实进程调用与状态变更；禁止跳过、伪造或捏造任何测试输出。
- **环境隔离**：
  - 子项目构建必须在隔离的 Git Worktree 中执行，杜绝污染当前主开发工作区。
  - Go 后端测试与数据库测试必须使用独立的内存数据库或事务清理机制。
  - 桌面 E2E 测试必须调用真实 Wails 运行时并通过 Playwright 截图留存验收凭据。

---

## 4. 安全与权限防护规范

1. **Wails 通信与边界防护**：
   - 前端所有调用必须经由 Go 后端显式注册的 Service Structs（通过 `wails.Run` 中的 `Bind` 暴露）。
   - 禁止在前端直接执行任意系统命令；所有系统调用必须由 Go 后端鉴权、校验参数后代理执行。
2. **命令注入防范**：
   - 代理执行本地 shell 命令前必须经过安全策略审查（Shell Review Policy）。
   - 敏感工具必须支持用户确认与显式授权流程（Consent Request）。
3. **密钥安全**：
   - 严禁在代码库中提交任何真实 API 密钥。本地使用受保护的本地 SQLite 数据库或系统安全凭据管理。
