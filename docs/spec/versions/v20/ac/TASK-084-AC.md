# TASK-084-AC 验收矩阵

> 任务名称：全栈质量验证与 Playwright 视觉回归验收  
> 规范版本：v20 · 日期：2026-11-23  

---

## 验收细则

| 验收标准编号 | 期望行为 | 验证方法 | 判定条件 |
|---|---|---|---|
| 全量 AC | 后端所有 Go 测试通过 | `go test ./...` | 23 个包全部 PASS，0 FAIL |
| 全量 AC | 前端所有 Vitest 测试通过 | `pnpm test:run` | 36 个测试文件全部通过，0 FAIL |
| 全量 AC | 前端 TypeScript 与 Vite 构建通过 | `pnpm build` | 0 error, 0 warning 编译成功 |
| 全量 AC | Playwright 视觉回归留证 | Playwright MCP 交互与截图 | 生成不少于 2 张高清视觉回归截图 |
