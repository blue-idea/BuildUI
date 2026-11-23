# TASK-086-AC 验收矩阵

> 任务名称：前端风格提取器应用类型选择交互与本地算法改造  
> 规范版本：v21 · 日期：2026-11-23  

---

## 验收细则

| 验收标准编号 | 期望行为 | 验证方法 | 判定条件 |
|---|---|---|---|
| `v21.REQ-001-AC-003` | 本地提取算法 `extractStyleFromReference` 支持 `appType` 入参并定制输出 | `pnpm --filter frontend test styleExtractor.test.ts` | 返回结果标签与 Prompt 包含对应平台特征 |
| `v21.REQ-002-AC-001` | `StyleExtractor.tsx` 渲染应用类型切换胶囊，默认选中 Web | `pnpm --filter frontend test StyleExtractor.test.tsx` | 页面包含 Web/App/Desktop 选项，Web 为初始选中态 |
| `v21.REQ-002-AC-002` | 点击切换应用类型，提取时将 `appType` 正确透传至后端 RPC | `pnpm --filter frontend test StyleExtractor.test.tsx` | 捕获调用入参，确认包含所选 `appType` |
| `v21.REQ-002-AC-003` | 提取结果卡片直观呈现所选应用类型徽章 | `pnpm --filter frontend test StyleExtractor.test.tsx` | 结果区域展示包含对应端形态标签的 Badge |
