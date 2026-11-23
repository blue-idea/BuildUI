# 实施计划（Tasks）· Blot-UI v18

> 文件路径：`docs/spec/versions/v18/tasks.md`  
> 规范版本：v18 · 日期：2026-11-23  
> 关联需求：[docs/spec/versions/v18/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v18/requirements.md)  
> 关联设计：[docs/spec/versions/v18/design.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v18/design.md)

执行时须严格遵循 `requirements.md` 中的验收标准，采用 TDD（红-绿-重构）开发方式。

---

## 任务清单

---

- [x] **TASK-073 · 标杆网站风格提取引擎与 Style Prompt 生成器重构（Unit TDD）**

  > 依赖：无

  - [x] 扩展测试文件 `frontend/src/utils/styleExtractor.test.ts`（Red）：
    - 验证输入知名网站或 URL（如 "https://linear.app", "stripe.com", "supabase", "airbnb" 等）时，准确提取该网站特征色板与规范
    - 验证输入任意语义文本时，智能推导色彩矩阵并生成合规色盘
    - 验证生成的 `stylePrompt` 包含 Design System Tokens, Color Palette, Component Directives 与 Tailwind 类指引
  - [x] 更新 `frontend/src/types/style.ts` 与 `frontend/src/utils/styleExtractor.ts`（Green）：
    - 扩展 Linear, Stripe, Supabase, Vercel, Apple, Airbnb, GitHub 等真实标杆预设
    - 升级 `buildDesignSystemPrompt` 生成结构化工业级设计 Prompt
    - 增强 URL 解析与自然语言语义哈希推导算法
  - [x] 运行 Vitest 确保测试全绿（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test styleExtractor.test.ts
  ```

  **验收证据：** 单元测试通过，提取准确性与 Prompt 结构化达标。  
  _需求: `requirements.md` 中 `v18.REQ-001` (AC-001, AC-002, AC-003)  
  _测试类型: Unit

---

- [x] **TASK-074 · 风格提取器界面增强与模版保存持久化（Component TDD）**

  > 依赖：TASK-073

  - [x] 扩展测试文件 `frontend/src/components/StyleExtractor.test.tsx` 与 `StyleCenterView.test.tsx`（Red）：
    - 验证提取后展示完整色板矩阵、圆角与排版标签、Prompt 预览及复制功能
    - 验证点击“保存为模版”按钮调用 `onSaveTemplate` 并传递包含 `stylePrompt` 的模版对象
    - 验证风格中心支持持久化、展示并应用保存的提取模版
  - [x] 改造 `StyleExtractor.tsx` 与 `StyleCenterView.tsx`（Green）：
    - 美化结果展示卡片与微交互
    - 完整保留 `stylePrompt` 并在本地存储（localStorage）同步
  - [x] 运行 Vitest 确保测试全绿（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test StyleExtractor.test.tsx StyleCenterView.test.tsx
  ```

  **验收证据：** 组件测试全绿，保存模版无缝流转。  
  _需求: `requirements.md` 中 `v18.REQ-002` (AC-001, AC-002, AC-003)  
  _测试类型: Component

---

- [x] **TASK-075 · 首页设计系统预设动态加载与 Style Prompt 深度注入（Integration TDD）**

  > 依赖：TASK-073, TASK-074

  - [x] 扩展测试文件 `frontend/src/components/HomeGuideView.test.tsx` 与 `frontend/src/App.test.tsx`（Red）：
    - 验证首页调色板浮层展示动态传入的风格模版列表（包括用户提取保存的模版）
    - 验证选择自定义风格模版后，`assembledPrompt` 显式内嵌该模版的 `stylePrompt`
    - 验证在 App 层面，在风格中心保存新模版后，首页能即时选到该模版
  - [x] 改造 `HomeGuideView.tsx` 与 `App.tsx`（Green）：
    - 透传 `styleTemplates` 并在浮层中动态渲染模版色标与名称
    - 在 `assembledPrompt` 中注入 `[Design System Style Prompt]` 段落
    - 在 `App.tsx` 中建立统一的主题/风格模版持久化存储
  - [x] 运行 Vitest 确保测试全绿（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test HomeGuideView.test.tsx App.test.tsx
  ```

  **验收证据：** 首页动态联动与 Prompt 注入测试全绿。  
  _需求: `requirements.md` 中 `v18.REQ-003` (AC-001, AC-002, AC-003)  
  _测试类型: Integration, Component

---

- [x] **TASK-076 · 全量自动化回归、Playwright 视觉验收与 v18 交付**

  > 依赖：TASK-073, TASK-074, TASK-075

  - [x] 执行全套自动化测试套件：
    - `go test -count=1 ./...`
    - `pnpm --filter frontend test`
    - `pnpm --filter frontend build`
  - [x] 使用 Playwright MCP 进行端到端真实操作与视觉回归截屏（提取真实网站、保存模版、首页选择生成）
  - [x] 产出验收证据存入 `docs/spec/versions/v18/reports/` 并合并主分支

  **验证方式：**
  ```bash
  pnpm --filter frontend test && pnpm --filter frontend build && go test ./...
  ```

  **验收证据：** 全量测试 100% 通过，视觉留证完整。  
  _需求: 全量验收  
  _测试类型: System
