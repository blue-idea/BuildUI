# 实施计划（Tasks）· Blot-UI v9

> 文件路径：`docs/spec/versions/v9/tasks.md`  
> 规范版本：v9 · 日期：2026-11-22  

执行时须严格遵循 [docs/spec/versions/v9/requirements.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v9/requirements.md) 中对应需求的验收标准。
每项任务通过 `_需求:` 引用相关需求与 AC 编号，通过 `_测试类型:` 关联 QA 执行策略。

---

## 任务清单

---

- [x] **TASK-037 · 定义数据模型与开发 PluginCard 插件卡片组件（TDD）**

  > 依赖：无

  - [x] 编写测试用例 `frontend/src/components/PluginCard.test.tsx`（Red）
  - [x] 创建 `frontend/src/types/plugin.ts` 定义 `PluginItem` 与 `CatalogCategory` 接口
  - [x] 实现 `frontend/src/components/PluginCard.tsx`：
    - 支持图标、标题、Badge（如 OAuth）、描述文本、服务域名展示
    - 支持未添加时展示 "Add" 按钮及点击事件
    - 支持已添加状态标识及禁用或配置选项（Green）
  - [x] 运行 Vitest 确保测试通过并优化代码（Refactor）

  **验证方式：**
  ```bash
  npm test --prefix frontend -- PluginCard.test.tsx
  ```

  _需求: `requirements.md` 中 `v9.REQ-002`  
  验收标准：`v9.REQ-002-AC-002`, `v9.REQ-003-AC-002`  
  _测试类型: Component, Unit

---

- [x] **TASK-038 · 开发 AddPluginModal 自定义添加插件模态框（TDD）**

  > 依赖：TASK-037

  - [x] 编写测试用例 `frontend/src/components/AddPluginModal.test.tsx`（Red）
  - [x] 实现 `frontend/src/components/AddPluginModal.tsx`：
    - 包含插件名称、端点/命令、描述等输入字段
    - 表单验证（必填字段检查与防空校验）
    - 提交后触发回调并重置关闭
    - 支持取消按钮与 ESC 键盘快捷关闭（Green）
  - [x] 运行 Vitest 确保测试通过并重构优化（Refactor）

  **验证方式：**
  ```bash
  npm test --prefix frontend -- AddPluginModal.test.tsx
  ```

  _需求: `requirements.md` 中 `v9.REQ-004`  
  验收标准：`v9.REQ-004-AC-001`, `v9.REQ-004-AC-002`  
  _测试类型: Component, Unit

---

- [x] **TASK-039 · 开发 ComponentCenterView 主视图与目录搜索过滤（TDD）**

  > 依赖：TASK-037, TASK-038

  - [x] 编写测试用例 `frontend/src/components/ComponentCenterView.test.tsx`（Red）
  - [x] 实现 `frontend/src/components/ComponentCenterView.tsx`：
    - 渲染顶部导航：`← Go Back` 按钮、`Plugins` 标题、副标题与 `+ Add Plugin` 按钮
    - 渲染统计指标栏：`X plugins · Y tools enabled`，空状态展示 `No plugins added yet.`
    - 渲染 `Add from catalog` 区域，包含 `☆ Featured` 和 `AI & Media` 等分类
    - 提供 `Search catalog` 实时搜索框并实现大小写不敏感实时过滤
    - 支持从目录点击 `Add` 将插件添加至已安装列表中
    - 点击 `+ Add Plugin` 打开自定义添加弹窗（Green）
  - [x] 运行 Vitest 确保测试通过并重构优化（Refactor）

  **验证方式：**
  ```bash
  npm test --prefix frontend -- ComponentCenterView.test.tsx
  ```

  _需求: `requirements.md` 中 `v9.REQ-001`, `v9.REQ-002`, `v9.REQ-003`  
  验收标准：`v9.REQ-001-AC-002`, `v9.REQ-002-AC-001`, `v9.REQ-002-AC-003`, `v9.REQ-003-AC-001`  
  _测试类型: Component, Integration

---

- [x] **TASK-040 · 全局 LeftDock 导航联动与 i18n 双语字典接入**

  > 依赖：TASK-039

  - [x] 更新 `frontend/src/components/LeftDock.tsx`：
    - 点击 `dock-components` 时激活 `components` 标签
  - [x] 在 `frontend/src/App.tsx` 中接入 `ComponentCenterView`：
    - 记录 `previousDockTab` 支持从组件库一键返回工作区
    - 维护全局已安装插件状态并可持久化
  - [x] 在 `frontend/src/i18n/locales/zh.ts` 与 `en.ts` 中补充组件库与插件完整双语词条
  - [x] 更新并运行 `frontend/src/App.test.tsx` 与全量测试套件

  **验证方式：**
  ```bash
  npm test --prefix frontend
  ```

  _需求: `requirements.md` 中 `v9.REQ-001`  
  验收标准：`v9.REQ-001-AC-001`, `v9.REQ-001-AC-003`  
  _测试类型: Integration, E2E

---

- [x] **TASK-041 · 视觉回归验证、Playwright 截图留证与 v9 交付**

  > 依赖：TASK-040

  - [x] 使用 Playwright 对组件库页面（浅色与深色主题、空状态与添加状态、搜索状态）进行截屏留证
  - [x] 生成 `docs/spec/versions/v9/v9-final-report.md` 并更新各 AC 状态
  - [x] 确保代码无编译与 Lint 错误

  **验证方式：**
  ```bash
  npm --prefix frontend test && npm --prefix frontend run lint
  ```

  _需求: 全量 v9 需求  
  _测试类型: Visual Regression, QA Acceptance
