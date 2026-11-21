# 任务验收报告（Acceptance Report）· TASK-025

> 任务编号：`TASK-025`  
> 任务名称：macOS 设计令牌库与双模（Light / Dark）主题上下文引擎  
> 规范版本：v6 · 报告日期：2026-11-21  
> 状态：**PASSED**

---

## 1. 验收标准达成情况

| 验收标准编号 | 需求描述 | 验证结果 | 证据 |
| :--- | :--- | :---: | :--- |
| `v6.REQ-002-AC-001` | 导出 light / dark 完整的 macOS 设计令牌与 CSS 自定义变量 | **PASS** | `src/theme/macos.ts`, 注入 `--macos-*` 变量 |
| `v6.REQ-002-AC-002` | 提供 ThemeContext，支持动态切换并在 document 根节点无缝挂载 `.dark` 类，持久化 localStorage | **PASS** | `src/context/ThemeContext.tsx`, 单元测试全绿 |

---

## 2. 测试执行记录

```bash
$ cd frontend; pnpm test -- macos

 RUN  v5.1.1 E:/Nextcloud/coding/desktop/BuildUI/frontend

 ✓ src/theme/macos.test.tsx (5 tests) 111ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  13:31:03
   Duration  1.60s
```

---

## 3. 产物清单

- `frontend/src/theme/macos.ts`
- `frontend/src/context/ThemeContext.tsx`
- `frontend/src/components/ThemeModeToggle.tsx`
- `frontend/src/theme/macos.test.tsx`
