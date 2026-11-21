# 实施计划（Tasks）· Blot-UI v8

> 文件路径：`docs/spec/versions/v8/tasks.md`  
> 规范版本：v8 · 日期：2026-11-21  

执行时须严格遵循 [docs/spec/versions/v8/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v8/requirements.md) 中对应需求的验收标准。
每项任务通过 `_需求:` 引用相关需求与 AC 编号，通过 `_测试类型:` 关联 QA 执行策略。

---

## 任务清单

---

- [x] **TASK-033 · 开发 CodeEditorViewer 轻量代码高亮与行号组件（TDD）**

  > 依赖：无

  - [x] 编写测试用例 `frontend/src/components/CodeEditorViewer.test.tsx`（Red）
  - [x] 实现 `frontend/src/components/CodeEditorViewer.tsx`：
    - 支持行号栏指示（Gutter）与等宽文本对齐
    - 纯前端轻量语法高亮分词（keywords, strings, numbers, comments, tags, types）
    - 支持 `highlightedLine` 高亮指定行与自动滚动进入视口
    - 支持行号栏/行内关联诊断错误指示（Green）
  - [x] 运行 Vitest 确保测试全部通过并重构优化（Refactor）

  **验证方式：**
  ```bash
  npm test --prefix frontend -- CodeEditorViewer.test.tsx
  ```

  _需求: `requirements.md` 中 `v8.REQ-001`  
  验收标准：`v8.REQ-001-AC-001`, `v8.REQ-001-AC-002`, `v8.REQ-001-AC-003`, `v8.REQ-002-AC-004`  
  _测试类型: Component, Unit

---

- [x] **TASK-034 · WorkspacePanel 集成代码检视编辑器与诊断问题面板（TDD）**

  > 依赖：TASK-033

  - [x] 编写测试用例 `frontend/src/components/WorkspacePanel.test.tsx`（Red）覆盖：
    - 渲染 `CodeEditorViewer` 替代原 `<pre>` 标签
    - 渲染诊断项列表面板（Problems Panel）
    - 点击同文件诊断项高亮并定位对应代码行
    - 点击跨文件诊断项自动切换当前文件并高亮定位对应代码行
  - [x] 修改 `frontend/src/components/WorkspacePanel.tsx` 实现诊断面板与代码编辑器联动（Green）
  - [x] 在 `frontend/src/i18n/locales/en.ts` 与 `zh.ts` 中补充诊断与编辑器国际化词条

  **验证方式：**
  ```bash
  npm test --prefix frontend -- WorkspacePanel.test.tsx
  ```

  _需求: `requirements.md` 中 `v8.REQ-002`  
  验收标准：`v8.REQ-002-AC-001`, `v8.REQ-002-AC-002`, `v8.REQ-002-AC-003`  
  _测试类型: Component, Integration

---

- [x] **TASK-035 · App 全局诊断状态流与代码检视全链路打通**

  > 依赖：TASK-034

  - [x] 在 `frontend/src/App.tsx` 中接入 `diagnostics` 状态并传入 `WorkspacePanel`
  - [x] 在 TypeScript 检查与编译以及示例环境中提供健全的诊断数据流支持
  - [x] 扩展并执行 `frontend/src/App.test.tsx` 验证整体验收逻辑

  **验证方式：**
  ```bash
  npm test --prefix frontend
  ```

  _需求: `requirements.md` 中 `v8.REQ-001`, `v8.REQ-002`  
  _测试类型: E2E, Integration

---

- [x] **TASK-036 · 视觉回归验证、Playwright 截图留证与 v8 收尾定稿**

  > 依赖：TASK-035

  - [x] 运行 Playwright 截屏留存代码高亮、行号指示与错误诊断跳转的真实视觉截图
  - [x] 完善 `docs/spec/versions/v8/ac/` 验收用例与 `v8-final-report.md`
  - [x] 更新 `tasks.md` 状态与 `README.md`
