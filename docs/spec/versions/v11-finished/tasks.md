# 实施计划（Tasks）· Blot-UI v11

> 文件路径：`docs/spec/versions/v11/tasks.md`  
> 规范版本：v11 · 日期：2026-11-22  

执行时须严格遵循 [docs/spec/versions/v11/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v11/requirements.md) 中对应需求的验收标准。

---

## 任务清单

---

- [x] **TASK-046 · 定义检查数据模型与开发 LocalEditPopover 局部编辑组件（TDD）**

  > 依赖：无

  - [x] 编写测试用例 `frontend/src/components/LocalEditPopover.test.tsx`（Red）
  - [x] 创建 `frontend/src/types/inspect.ts` 定义 `InspectedElement` 与快捷预设类型
  - [x] 实现 `frontend/src/utils/targetedPrompt.ts` 组装局部定向 AI 指令工具
  - [x] 实现 `frontend/src/components/LocalEditPopover.tsx`：
    - 展示元素 tagName、组件路径与 className 徽章
    - 提供常用快捷操作预设药丸（Change Color, Update Text, Adjust Spacing 等）
    - 文本输入框支持输入与 Enter 发送
    - 支持 Cancel / ESC 退出（Green）
  - [x] 运行 Vitest 确保测试通过并重构优化（Refactor）

  **验证方式：**
  ```bash
  npm test --prefix frontend -- LocalEditPopover.test.tsx
  ```

  _需求: `requirements.md` 中 `v11.REQ-002`, `v11.REQ-003`  
  _测试类型: Component, Unit

---

- [x] **TASK-047 · 升级 ComponentInspector 支持元素点选高亮与锁定联动（TDD）**

  > 依赖：TASK-046

  - [x] 编写测试用例 `frontend/src/components/ComponentInspector.test.tsx`（Red）覆盖：
    - 渲染检查状态栏与元素悬停/选择器交互
    - 点击元素锁定并唤起 `LocalEditPopover`
    - 触发提交时将结构化局部定向 Prompt 回调至父级
  - [x] 重构实现 `frontend/src/components/ComponentInspector.tsx`（Green）
  - [x] 运行 Vitest 确保测试通过并优化代码（Refactor）

  **验证方式：**
  ```bash
  npm test --prefix frontend -- ComponentInspector.test.tsx
  ```

  _需求: `requirements.md` 中 `v11.REQ-001`, `v11.REQ-002`  
  _测试类型: Component, Integration

---

- [x] **TASK-048 · PreviewPanel 与 App 全局定向编辑流程打通**

  > 依赖：TASK-047

  - [x] 更新 `frontend/src/components/PreviewPanel.tsx` 接入新的审查与局部编辑控制器
  - [x] 在 `frontend/src/App.tsx` 中接收定向局部编辑请求，自动填充 Prompt 并触发构建视图
  - [x] 在 `frontend/src/i18n/locales/zh.ts` 与 `en.ts` 中补充局部编辑词条
  - [x] 运行全量测试验证

  **验证方式：**
  ```bash
  npm test --prefix frontend
  ```

  _需求: `requirements.md` 中 `v11.REQ-003`  
  _测试类型: Integration, E2E

---

- [x] **TASK-049 · Playwright 视觉验收截图留证与 v11 交付**

  > 依赖：TASK-048

  - [x] 使用 Playwright 对局部编辑状态（检查条、选定元素、局部编辑弹窗、快捷预设填充、深浅色模式）进行真实截屏留证
  - [x] 编写 `docs/spec/versions/v11/v11-final-report.md`
  - [x] 勾选 `docs/book/todo.md` 中的第 3 条完成项

  **验证方式：**
  ```bash
  npm --prefix frontend test && npm --prefix frontend run lint
  ```

  _需求: 全量 v11 需求  
  _测试类型: Visual Regression, QA Acceptance
