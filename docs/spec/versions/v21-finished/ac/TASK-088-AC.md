# TASK-088-AC 验收矩阵

> 任务名称：全栈质量验证与 Playwright 视觉回归验收  
> 规范版本：v21 · 日期：2026-11-23  

---

## 验收细则

| 验收标准编号 | 期望行为 | 验证方法 | 判定条件 |
|---|---|---|---|
| 全量 AC | 后端 Go 测试 100% PASS | `go test ./...` | 23 个包全部 PASS，0 失败 |
| 全量 AC | 前端 Vitest 测试 100% PASS | `pnpm --filter frontend test` | 所有测试文件全部通过，0 失败 |
| 全量 AC | 前端 TypeScript 构建 0 错误 | `pnpm --filter frontend build` | `tsc && vite build` 0 error 编译成功 |
| 全量 AC | Playwright 视觉回归留证 | Playwright MCP 操作与截图 | 产出应用类型选择、提取结果徽章及分类筛选截图 |
