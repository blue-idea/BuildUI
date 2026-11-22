# AC 验收单 · TASK-063

> 任务 ID: TASK-063  
> 任务名称: 预览沙箱路由监听与双向消息分发（`preview-inspector.ts`，TDD）  
> 需求关联: `requirements.md` 中的 `v15.REQ-002` (AC-001)  
> 执行日期: 2026-11-23  

---

## 1. 验收项与测试命令

```bash
pnpm --filter frontend test preview-inspector.test.ts
```

## 2. 真实执行结果

```
 ✓ src/preview-inspector.test.ts (4 tests) 22ms
   ✓ 激活检查模式时设置光标，悬停时显示高亮浮层及标签徽章 18ms
   ✓ 点击元素时拦截默认行为并向父级发送 buildui:element-selected 完整元数据 2ms
   ✓ 关闭审查模式时移除高亮并恢复光标 1ms
   ✓ 监听路由变化并在 pushState / popstate / hashchange 时向父级分发 buildui:route-changed 消息 1ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

## 3. 验收矩阵

| 验收标准 | 预期表现 | 实际结果 | 状态 |
|---|---|---|:---:|
| `v15.REQ-002-AC-001` | pushState / replaceState / popstate / hashchange 时分发 `buildui:route-changed` 消息 | 捕获到包含目标 pathname 与完整 url 的消息 | PASS |
