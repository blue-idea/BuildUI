# 需求规格说明书（Requirements）· Blot-UI v2

> 文件路径：`docs/spec/versions/v2/requirements.md`  
> 规范版本：v2 · 日期：2026-11-21  
> 状态：就绪（已通过 STEP 4 审查）  
> 核心目标：多模型 LLM 流式接入、多轮上下文记忆、Git 时光机 Diff 审查与回滚、原生桌面打磨  
> 架构基准：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)  
> 继承规则：`docs/spec/steering/` 与 `docs/spec/versions/v1-finished/constitution.md`

---

## 1. 业务背景与目标

在 v1 版本中，Blot-UI 完成了从脚手架展开、需求澄清与蓝图门禁、增量 XML 状态机、TypeScript 自愈验证、Git Worktree 隔离沙箱、实时 Vite 预览监管到 Turn-level Git 提交的完整核心闭环。  
**v2 版本的核心使命**是将系统从模拟引擎推向真实生产可用，为开发者提供：
1. 灵活的**多模型真实 LLM 流式接入**能力（OpenAI / DeepSeek / Anthropic / Gemini / Ollama 本地模型）；
2. 具备**代码上下文感知与可中断的多轮对话流**；
3. 基于 Git 提交快照的**可视化代码 Diff 审查与一键时光机回滚**；
4. Wails 桌面端原生文件系统选择器与构建打包工程化体验。

---

## 2. 需求列表（EARS 句式）

### v2.REQ-001：多模型真实 LLM 流式驱动与配置中心

- **描述**：系统必须支持用户自主配置和管理 LLM Provider，通过统一的 OpenAI-compatible SSE 协议与真实大模型建立流式会话。
- **触发条件 (When)**：当用户打开设置面板并配置 API Key、Base URL 及 Model Name，或发起代码生成会话时。
- **系统行为 (Shall)**：
  - 系统应提供统一的 `LLMProvider` 抽象接口，支持流式 Server-Sent Events (SSE) 处理；
  - 系统应在 SQLite `settings` 表中安全持久化模型提供方配置，严禁硬编码；
  - 当调用外部 LLM API 发生网络超时、认证失败或速率限制（429）时，系统应向用户抛出结构化清晰友好的错误，并允许重试。
- **验收标准 (AC)**：
  - `v2.REQ-001-AC-001`：在设置面板成功配置并保存 Base URL、API Key 与 Model，前端重启后配置持久化保留。
  - `v2.REQ-001-AC-002`：在发起提问时，系统能真实连接到配置的兼容端点，通过流式解析逐块传输并将 XML 代码操作无缝衔接至落盘与验证管线。

### v2.REQ-002：多轮会话上下文装配与流式中断取消

- **描述**：系统必须支持跨轮次会话记忆，并在生成过程中赋予用户随时中止生成的能力。
- **触发条件 (When)**：当用户连续发送多轮变更需求，或在流式生成过程中点击“Stop Generation”按钮时。
- **系统行为 (Shall)**：
  - 系统应在组装 Prompt 时自动注入最近多轮聊天历史记录，并动态扫描子应用工作区目录树进行紧凑上下文组装；
  - 当用户在流式生成期间触发中止时，系统应立即通过 Go `context.Context` 发送 Cancel 信号中断 HTTP 连接与文件写盘，工作区自动恢复干净状态。
- **验收标准 (AC)**：
  - `v2.REQ-002-AC-001`：在第 2 轮及后续轮次对话中，Agent 能够基于历史会话与当前代码结构进行增量修改，而不是重复全量重建。
  - `v2.REQ-002-AC-002`：点击停止生成按钮后，流式生成在 500ms 内立即中止，不发生脏文件残留，并在界面提示 `Generation stopped by user`。

### v2.REQ-003：Git 版本快照时光机与可视化代码 Diff 审查

- **描述**：系统必须提供完整的历史版本管理界面，允许用户查看每个轮次的提交记录、对比代码 Diff，并一键回滚。
- **触发条件 (When)**：当用户在主界面点击“Version History”或切换到某个历史版本时。
- **系统行为 (Shall)**：
  - 系统应从 SQLite `versions` 表加载应用的提交历史时间线；
  - 系统应通过 `git diff` 提取指定版本与上个版本之间的文件改动列表及行级差异（Add/Delete）；
  - 当用户确认回滚到指定版本时，系统应执行安全工作区回滚（如 `git reset --hard` 或 `git checkout`），并触发实时 Vite 预览自动热重载呈现回滚后的界面。
- **验收标准 (AC)**：
  - `v2.REQ-003-AC-001`：版本时间线面板清晰列出所有历史版本快照卡片（含 Commit Hash、时间、触发信息）。
  - `v2.REQ-003-AC-002`：点击版本能准确展示行级 Diff 视图，点击“Rollback to this version”后，工作区代码与预览面板 100% 同步回退到该历史状态。

### v2.REQ-004：桌面原生文件系统选择器与工程化打包

- **描述**：系统必须支持原生文件目录选择器创建或关联工作空间，并提供桌面构建发布就绪的工程配置。
- **触发条件 (When)**：当用户选择在本地自定义路径创建应用或导出应用时。
- **系统行为 (Shall)**：
  - 系统应调用 Wails 原生 `runtime.OpenDirectoryDialog`，唤起原生操作系统目录选择器；
  - 导出应用时支持打包为独立压缩包或打开本地 Finder/资源管理器。
- **验收标准 (AC)**：
  - `v2.REQ-004-AC-001`：前端触发自定义目录时能够正确调起系统原生目录选择窗口并获取绝对路径。
  - `v2.REQ-004-AC-002`：全量前端与 Wails 后端能够一键完成生产构建打包，Playwright E2E 全流程回归通过。
