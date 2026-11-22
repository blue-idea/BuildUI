# AC 验收单 · TASK-064

> 任务 ID: TASK-064  
> 任务名称: 工作台地址栏手动输入、回车跳转与双向同步（`WorkspacePanel.tsx`，TDD）  
> 需求关联: `requirements.md` 中的 `v15.REQ-001` (AC-001, AC-002, AC-003, AC-004), `v15.REQ-002` (AC-002)  
> 执行日期: 2026-11-23  

---

## 1. 验收项与测试命令

```bash
pnpm --filter frontend test WorkspacePanel.test.tsx
```

## 2. 真实执行结果

```
 ✓ src/components/WorkspacePanel.test.tsx (14 tests) 155ms
   ✓ TASK-064: 拟真地址栏交互输入与路由跳转 (5)
     ✓ 渲染可交互的地址输入框并呈现当前地址 6ms
     ✓ 手动输入相对路由 /dashboard 回车后驱动 iframe 跳转到目标路径 10ms
     ✓ 手动输入无前导斜杠路径 settings 自动规范化为 /settings 并跳转 11ms
     ✓ 按下 Escape 键时恢复原始地址并退出编辑态 6ms
     ✓ 接收沙箱内 buildui:route-changed 消息时自动同步更新地址栏显示 10ms

 Test Files  1 passed (1)
      Tests  14 passed (14)
```

## 3. 验收矩阵

| 验收标准 | 预期表现 | 实际结果 | 状态 |
|---|---|---|:---:|
| `v15.REQ-001-AC-001` | 渲染可聚焦编辑的 input 输入框（data-testid="browser-address-input"） | 成功获取元素并展示当前预览地址 | PASS |
| `v15.REQ-001-AC-002` | 手动输入相对路由（带或不带斜杠）或绝对 URL 回车后驱动 iframe 导航 | iframe.src 成功跳转至目标路径 | PASS |
| `v15.REQ-001-AC-003` | 按下 Escape 键恢复原始地址并失焦 | 输入框文本即时重置还原 | PASS |
| `v15.REQ-001-AC-004` | 前进/后退按钮安全调用 history API | 点击无异常报错，安全调用 | PASS |
| `v15.REQ-002-AC-002` | 接收沙箱内 buildui:route-changed 消息时自动同步地址栏文本 | 地址栏实时更新为最新子路由 | PASS |
