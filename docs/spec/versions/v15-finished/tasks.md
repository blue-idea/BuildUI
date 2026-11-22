# 实施计划（Tasks）· Blot-UI v15

> 文件路径：`docs/spec/versions/v15/tasks.md`  
> 规范版本：v15 · 日期：2026-11-23  
> 关联需求：[docs/spec/versions/v15/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v15/requirements.md)  
> 关联设计：[docs/spec/versions/v15/design.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v15/design.md)

执行时须严格遵循 `requirements.md` 中的验收标准，采用 TDD（红-绿-重构）开发方式。

---

## 任务清单

---

- [x] **TASK-063 · 预览沙箱路由监听与双向消息分发（`preview-inspector.ts`，TDD）**

  > 依赖：无

  - [x] 编写测试用例 `frontend/src/preview-inspector.test.ts`（Red）：
    - 验证拦截 `history.pushState` 并向 parent 派发 `buildui:route-changed`
    - 验证拦截 `history.replaceState` 并派发 `buildui:route-changed`
    - 验证监听 `popstate` / `hashchange` 事件派发包含当前 pathname 与完整 url 的消息
  - [x] 在 `frontend/src/preview-inspector.ts` 与 `internal/scaffold/template/src/preview-inspector.ts` 中实现路由监听（Green）
  - [x] 运行 Vitest 确保测试通过并重构（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test preview-inspector.test.ts
  ```

  **验收证据：** 测试覆盖沙箱路由跳变消息分发（4/4 pass）。见 `docs/spec/versions/v15/ac/TASK-063-AC.md`。  
  _需求: `requirements.md` 中 `v15.REQ-002` (AC-001)  
  _测试类型: Unit

---

- [x] **TASK-064 · 工作台地址栏手动输入、回车跳转与双向同步（`WorkspacePanel.tsx`，TDD）**

  > 依赖：TASK-063

  - [x] 编写测试用例 `frontend/src/components/WorkspacePanel.test.tsx`（Red）：
    - 验证地址栏渲染具有 `data-testid="browser-address-input"` 的输入框
    - 验证输入相对路径 `/dashboard` 按回车触发 iframe 导航到目标完整路径
    - 验证输入无前导斜杠路径 `settings` 自动规范化为 `/settings` 并跳转
    - 验证输入绝对路径 `http://localhost:5173/settings` 正确跳转
    - 验证按 Escape 键恢复原始地址并失焦
    - 验证接收 `buildui:route-changed` 事件后自动更新地址栏文本
    - 验证后退/前进按钮安全调用 history API
  - [x] 在 `frontend/src/components/WorkspacePanel.tsx` 中实现可编辑地址栏与导航控制逻辑（Green）
  - [x] 运行 Vitest 确保测试通过并重构（Refactor）

  **验证方式：**
  ```bash
  pnpm --filter frontend test WorkspacePanel.test.tsx
  ```

  **验收证据：** 单元与组件测试全过（14/14 pass）。见 `docs/spec/versions/v15/ac/TASK-064-AC.md`。  
  _需求: `requirements.md` 中 `v15.REQ-001` (AC-001, AC-002, AC-003, AC-004), `v15.REQ-002` (AC-002)  
  _测试类型: Component, Integration

---

- [x] **TASK-065 · 端到端视觉回归与全量质量验收（Playwright E2E）**

  > 依赖：TASK-064

  - [x] 编写或扩展端到端验证脚本，使用 Playwright 启动前端并进入工作台：
    - 验证地址栏可聚焦并手动输入路由
    - 截屏留证存入 `docs/spec/versions/v15/reports/screenshots/`
  - [x] 运行 Go 与前端全量测试及构建确保零退化

  **验证方式：**
  ```bash
  pnpm --filter frontend test && pnpm --filter frontend build && go test ./...
  ```

  **验收证据：** 端到端截图留证，全量测试 ALL PASS。见 `docs/spec/versions/v15/ac/TASK-065-AC.md`。  
  _需求: 全量验收  
  _测试类型: E2E, Visual Regression
