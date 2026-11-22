# AC 验收单 · TASK-067

> 任务 ID: TASK-067  
> 任务名称: 前端设置联动、抽屉组件与新建项目默认路径同步  
> 需求关联: `requirements.md` 中的 `v16.REQ-002` (AC-001, AC-002)  
> 执行日期: 2026-11-23  

---

## 1. 验收项与测试命令

```bash
pnpm --filter frontend test App.test.tsx
```

## 2. 真实执行结果

```
 ✓ src/App.test.tsx (33 tests) 817ms
   ✓ 手动启动预览时显示后端检查进度，修复完成后刷新源码列表
   ✓ 从桌面会话恢复已保存的阶段并发送续建请求
   ✓ 桌面工作台从后端加载空项目列表并使用真实创建入口
   ✓ App Guided Mode Home & Navigation (7)
     ✓ renders Guided Mode Home by default when launching App
     ✓ navigates from Guided Mode Home into Builder and automatically starts generating without clicking send
     ✓ 桌面端首页点击开始生成按钮，自动创建项目并直接调用生成，无需再次点击发送指令
     ✓ 桌面端构建页发送指令在无活跃项目时，自动创建项目开始构建，而不是跳转到工程管理页面
     ✓ switches between Home, Builder, and Style views via LeftDock icons
     ✓ switches to ComponentCenterView via dock-components and returns via Go Back button
     ✓ switches to ProjectsCenterView via dock-projects in LeftDock and manages applications
   ✓ App Main Split Layout & Workflow (23)
     ...
     ✓ creates project under custom workspace.dir when configured in settings 9ms

 Test Files  1 passed (1)
      Tests  33 passed (33)
```

## 3. 验收矩阵

| 验收标准 | 预期表现 | 实际结果 | 状态 |
|---|---|---|:---:|
| `v16.REQ-002-AC-001` | 设置保存后更新前端 `workspaceDir` 状态及 `settings['workspace.dir']` | `SettingsModal.onSave` 正确同步状态并更新内存配置 | PASS |
| `v16.REQ-002-AC-002` | `AppDrawer` 与 `ProjectsCenterView` 支持桌面端具名创建并调用 `CreateApp` | 传递 `onCreateNamedApp={desktop ? createDesktopProject : undefined}`，触发后端创建 | PASS |
