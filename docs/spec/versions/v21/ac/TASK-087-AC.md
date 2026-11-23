# TASK-087-AC 验收矩阵

> 任务名称：风格模版库应用类型徽章标注与分类筛选  
> 规范版本：v21 · 日期：2026-11-23  

---

## 验收细则

| 验收标准编号 | 期望行为 | 验证方法 | 判定条件 |
|---|---|---|---|
| `v21.REQ-003-AC-001` | 模版保存与持久化保留 `appType` 字段，缺失时默认为 `web` | `pnpm --filter frontend test StyleCenterView.test.tsx` | 模版对象持久化包含 `appType` 属性 |
| `v21.REQ-003-AC-002` | `StyleCenterView.tsx` 模版卡片展示平台类型徽章 | `pnpm --filter frontend test StyleCenterView.test.tsx` | 卡片上渲染 Web / App / Desktop 徽章 |
| `v21.REQ-003-AC-003` | 模版库顶部支持按应用类型筛选过滤 | `pnpm --filter frontend test StyleCenterView.test.tsx` | 点击 App 仅展示 App 模版，点击 All 展示全部 |
