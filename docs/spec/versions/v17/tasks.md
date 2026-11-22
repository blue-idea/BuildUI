# 实施计划（Tasks）· Blot-UI v17

> 文件路径：`docs/spec/versions/v17/tasks.md`  
> 规范版本：v17 · 日期：2026-11-23  
> 关联需求：[docs/spec/versions/v17/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v17/requirements.md)  
> 关联设计：[docs/spec/versions/v17/design.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v17/design.md)

执行时须严格遵循 `requirements.md` 中的验收标准，采用 TDD（红-绿-重构）开发方式。

---

## 任务清单

---

- [x] **TASK-069 · `ExportModal` 导出弹窗配色与主题系统对齐（Component TDD）**

  > 依赖：无

  - [x] 扩展测试用例 `frontend/src/components/ExportModal.test.tsx`（Red）：
    - 验证模态框外层容器具备自适应背景类（`bg-white` / `dark:bg-zinc-900`）与边框类（`border-slate-200` / `dark:border-zinc-800`）
    - 验证主标题文本具备自适应颜色类（`text-slate-900` / `dark:text-zinc-100`）
    - 验证信息卡片具备双模自适应背景与边框
  - [x] 改造 `frontend/src/components/ExportModal.tsx`（Green）使其支持明暗双模与主题规范
  - [x] 运行 Vitest 测试确保通过（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test ExportModal.test.tsx
  ```

  **验收证据：** 单元测试通过，`ExportModal` 配色与主题系统对齐。验收单见 [TASK-069-AC.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v17/ac/TASK-069-AC.md)。  
  _需求: `requirements.md` 中 `v17.REQ-001` (AC-001, AC-002)  
  _测试类型: Component

---

- [x] **TASK-070 · `VersionTimelineModal` 与 `DiffViewer` 配色与主题系统对齐（Component TDD）**

  > 依赖：无

  - [x] 扩展测试用例 `frontend/src/components/VersionTimelineModal.test.tsx`（Red）：
    - 验证时间线主模态框具备自适应类名（`bg-white` / `dark:bg-zinc-900`，`border-slate-200` / `dark:border-zinc-800`）
    - 验证快照未选中项与选中项具备自适应高亮类
    - 验证 `DiffViewer` 容器与变更行在双模下具备自适应对比度
  - [x] 改造 `frontend/src/components/VersionTimelineModal.tsx` 与 `DiffViewer.tsx`（Green）
  - [x] 运行 Vitest 测试确保通过（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test VersionTimelineModal.test.tsx
  ```

  **验收证据：** 单元测试通过，版本历史时光机与代码差异双模对齐。验收单见 [TASK-070-AC.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v17/ac/TASK-070-AC.md)。  
  _需求: `requirements.md` 中 `v17.REQ-002` (AC-001, AC-002, AC-003)  
  _测试类型: Component

---

- [x] **TASK-071 · `TemplateModal`, `CommandPalette` 与 `ThemeSelector` 配色与主题系统对齐（Component TDD）**

  > 依赖：无

  - [x] 扩展相关组件测试 `TemplateModal.test.tsx`, `CommandPalette.test.tsx`, `ThemeSelector.test.tsx`（Red）
  - [x] 改造 `TemplateModal.tsx`, `CommandPalette.tsx`, `ThemeSelector.tsx`（Green）
  - [x] 运行 Vitest 确保测试全绿（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test TemplateModal.test.tsx CommandPalette.test.tsx ThemeSelector.test.tsx
  ```

  **验收证据：** 模态框与辅助交互组件全景主题对齐。验收单见 [TASK-071-AC.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v17/ac/TASK-071-AC.md)。  
  _需求: `requirements.md` 中 `v17.REQ-003` (AC-001, AC-002, AC-003)  
  _测试类型: Component

---

- [x] **TASK-072 · 全量自动化回归与端到端质量验收**

  > 依赖：TASK-069, TASK-070, TASK-071

  - [x] 执行全套自动化测试套件：
    - `go test -count=1 ./...`
    - `pnpm --filter frontend test`
    - `pnpm --filter frontend build`
  - [x] 产出验收证据存入 `docs/spec/versions/v17/reports/`

  **验证方式：**
  ```bash
  pnpm --filter frontend test && pnpm --filter frontend build && go test ./...
  ```

  **验收证据：** 全量测试与类型构建 100% 通过。验收单见 [TASK-072-AC.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v17/ac/TASK-072-AC.md)。  
  _需求: 全量验收  
  _测试类型: System
