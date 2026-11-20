# 项目宪法（Constitution）· Blot-UI (Wails + React)

> 文件路径：`docs/spec/versions/v1/constitution.md`  
> 规范版本：v1 · 日期：2026-11-20  
> 核心选型：Wails v2 (Go 1.26+) + React 19 + TypeScript

---

## 1. 项目定义与愿景

Blot-UI 是一个基于 **Wails + React** 构建的开源、本地优先、端到端闭环的 AI 原生应用构建桌面软件（AI App Builder）。
本工程的目标是实现完整的 AI 应用构建闭环：
- **本地优先（Local-First）**：完全运行在用户本地机器上，代码资产与 SQLite 数据库全权归属本地，支持自定义模型密钥（BYOK）。
- **零占位符与全功能交付（Zero-Placeholder）**：生成的代码必须完全可用、导入完整、无悬空依赖，真正能够开箱即用并构建运行。
- **验证自愈驱动（Self-Healing & Verification）**：依托本地编译器（`tsc`）、测试器与 Git Worktree 隔离构建环境，实现代码生成后的自动纠错。

---

## 2. 架构红线与根本原则

1. **绝对隔离原则**：
   - 生成的目标用户应用必须在完全独立的子目录和子进程中运行，禁止与 Blot-UI 主程序依赖及进程相互污染。
   - 生产环境打包验证（`run_build`）必须在独立的 Git Worktree 隔离快照下执行。
2. **渐进式门禁原则**：
   - 必须通过需求澄清（`planning_questionnaire`）与蓝图审批（`app_blueprint`）双重前置门禁，才允许大模型写入应用业务代码。
3. **安全第一原则**：
   - 所有执行的系统 Shell 命令必须经过安全策略沙箱审查（`shell_review_policy`）。
   - 严禁将用户 API 密钥明文写入代码库或非安全存储。
4. **高质量代码标准**：
   - Go 后端严格遵循标准错误分类（`BlotError`）与结构化并发治理（Context 取消控制）。
   - TypeScript 必须开启全面严格模式（`strict: true`），全仓杜绝 `any` 滥用。
   - 所有前后端通信必须依托 Wails 自动生成的强类型 Bindings 与受约束的运行时事件。

---

## 3. 质量与验收底线

- **严禁伪造测试**：测试结果必须来自真实调用（Go `go test`、React `Vitest`、桌面 `Playwright`），严禁未执行即标 `PASS`。
- **桌面 E2E 必须截图**：Playwright 桌面端验收测试必须保存截图作为证据。
- **无破坏性回退**：每次 Agent 编辑生成的应用代码，必须经由 `tsc` 类型检查通过才算基本可用。
- **版本审计轨迹**：每个可写会话必须生成标准 Git Commit，确保用户应用的所有代码修改具备完整的时间旅行与撤销能力。
