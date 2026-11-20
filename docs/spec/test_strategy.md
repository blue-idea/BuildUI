# docs/spec/test_strategy.md · 项目级测试策略简报

> 文件路径：`docs/spec/test_strategy.md`  
> 首次创建：STEP 1（项目级资产，所有版本继承）  
> 核心选型：Go 1.26 + Vitest + Playwright (Wails E2E)  
> 官方测试规范参考：[AGENTS.md](../../AGENTS.md)

---

## 1. 测试分层与金字塔模型

```
       ▲
      / \        桌面端端到端测试 (Playwright E2E)
     /   \       Wails 桌面真实窗口、React 界面渲染、实时预览 Iframe 联动（必须截图留证）
    /-----\
   /       \     Go 集成与接口测试 (Go Integration & Service Tests)
  /         \    Wails Service 绑定、纯 Go SQLite 事务、Git Worktree 隔离构建、Fake LLM 流式调用
 /-----------\
/             \  单元测试 (Go Test & Vitest Unit Tests)
/_______________\ Go 核心业务逻辑/XML Token 流式拆词器 + 前端 React 组件与 Hook 渲染测试
```

---

## 2. 测试策略细则

### 2.1 Go 单元与集成测试（Go Tests）
- **覆盖目标**：
  - `internal/agent`：增量 XML 流式解析器、大模型提示词构造、Tool 路由。
  - `internal/app`：脚手架展开复制、进程生命周期监管。
  - `internal/db`：纯 Go SQLite 迁移与 CRUD 事务。
  - `internal/verification`：TypeScript 编译器输出解析、Git Worktree 隔离构建沙箱。
- **运行命令**：`go test -race -cover ./...`
- **执行规范**：
  - 严禁伪造测试结果；数据库测试使用内存 SQLite（`:memory:`）或独立事务清理。

### 2.2 React 前端单元与组件测试（Vitest + Testing Library）
- **覆盖目标**：
  - `frontend/src/components`：蓝图审批卡片、问卷交互卡片、Markdown 流式渲染器。
  - `frontend/src/hooks`：Wails 事件监听 Hook、本地状态管理。
- **运行命令**：`pnpm test`

### 2.3 桌面端 E2E 测试（Playwright Wails E2E）
- **覆盖目标**：
  - 应用完整生命周期：新建应用 -> 澄清问卷 -> 蓝图卡片审批 -> 代码生成流式呈现 -> Vite 预览服务启动 -> Iframe 显示。
- **验收铁律**：
  - **必须截图留证**：测试执行过程中必须保留运行截图至测试报告作为验收凭证。
  - **视觉回归**：关键页面（主界面、蓝图卡片、代码预览）生成 Baseline 与 Diff 截图。

---

## 3. 质量门禁与准出标准

| 阶段 | 准出指标 |
| :--- | :--- |
| **代码提交 (Commit)** | `gofmt` 与 `pnpm run fmt:check` 通过、Linter 零警告、`pnpm run ts` 类型检查无报错 |
| **任务验收 (Task Done)** | 配套测试由红变绿、真实控制台输出无 FAIL、E2E 测试保存截图证据 |
| **分支合并 (Merge)** | 全套 Go 与 React 测试 100% 通过、无破坏性回归 |
