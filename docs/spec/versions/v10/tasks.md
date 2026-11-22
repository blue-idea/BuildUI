# 实施计划（Tasks）· Blot-UI v10

> 文件路径：`docs/spec/versions/v10/tasks.md`  
> 规范版本：v10 · 日期：2026-11-22  

执行时须严格遵循 [docs/spec/versions/v10/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v10/requirements.md) 中对应需求的验收标准。

---

## 任务清单

---

- [x] **TASK-042 · 定义风格数据模型与开发 StyleExtractor 提取引擎及组件（TDD）**

  > 依赖：无

  - [x] 编写测试用例 `frontend/src/components/StyleExtractor.test.tsx`（Red）
  - [x] 创建 `frontend/src/types/style.ts` 定义 `StyleTemplate` 与 `ExtractedStyle`
  - [x] 实现 `frontend/src/utils/styleExtractor.ts` 风格提取与 Design Prompt 组装工具
  - [x] 实现 `frontend/src/components/StyleExtractor.tsx`：
    - 支持图片选择/拖拽上传与参考物产品名称输入
    - 支持点击提取生成调色盘、设计标签与结构化 Prompt
    - 渲染实时 UI 预览组件（Button, Card, Input, Badge）
    - 提供“保存为模版”与“复制 Prompt”按钮及回调（Green）
  - [x] 运行 Vitest 确保测试通过并优化代码（Refactor）

  **验证方式：**
  ```bash
  npm test --prefix frontend -- StyleExtractor.test.tsx
  ```

  _需求: `requirements.md` 中 `v10.REQ-002`, `v10.REQ-003`, `v10.REQ-004`  
  _测试类型: Component, Unit

---

- [x] **TASK-043 · 开发 StyleCenterView 双 Tab 风格中心与模版持久化（TDD）**

  > 依赖：TASK-042

  - [x] 编写测试用例 `frontend/src/components/StyleCenterView.test.tsx`（Red）
  - [x] 实现 `frontend/src/components/StyleCenterView.tsx`：
    - 双 Tab 切换：`Style Templates` 与 `Reference Extractor`
    - 模版列表渲染与激活选中状态
    - 提取新风格后点击保存，动态新增至模版库并支持切换应用
  - [x] 运行 Vitest 确保测试通过并重构优化（Refactor）

  **验证方式：**
  ```bash
  npm test --prefix frontend -- StyleCenterView.test.tsx
  ```

  _需求: `requirements.md` 中 `v10.REQ-001`, `v10.REQ-004`  
  _测试类型: Component, Integration

---

- [x] **TASK-044 · App 全局风格路由联动与 i18n 补充**

  > 依赖：TASK-043

  - [x] 在 `frontend/src/App.tsx` 中使用 `StyleCenterView` 替代原有静态风格页
  - [x] 将用户自定义保存的风格模版与全局主题状态打通
  - [x] 在 `frontend/src/i18n/locales/zh.ts` 与 `en.ts` 中补充风格中心词条
  - [x] 运行全量测试验证

  **验证方式：**
  ```bash
  npm test --prefix frontend
  ```

  _需求: `requirements.md` 中 `v10.REQ-001`  
  _测试类型: Integration, E2E

---

- [x] **TASK-045 · Playwright 视觉验收截图留证与 v10 交付**

  > 依赖：TASK-044

  - [x] 使用 Playwright 对风格中心（模版库、提取器、提取结果、实时预览、深浅色模式）进行真实截屏留证
  - [x] 编写 `docs/spec/versions/v10/v10-final-report.md`
  - [x] 勾选 `docs/book/todo.md` 中的第 2 条完成项

  **验证方式：**
  ```bash
  npm --prefix frontend test && npm --prefix frontend run lint
  ```

  _需求: 全量 v10 需求  
  _测试类型: Visual Regression, QA Acceptance
