# v24 任务拆分与执行规划

## 1. 任务清单

| 任务 ID | 对应需求 / AC | 任务名称 | 适用工具 / 测试 | 状态 |
|---------|---------------|----------|----------------|:----:|
| **TASK-096** | `v24.REQ-001-AC-002` / `AC-003` | Go 后端 Native 路由自愈逻辑实现与单元测试 (TDD) | `go test -v ./internal/scaffold` | done |
| **TASK-097** | `v24.REQ-001-AC-001` | 强化 Native Expo Router 路由重定向与覆写提示词 | `go test -v ./internal/agent` | done |
| **TASK-098** | `v24.REQ-002-AC-001` / `AC-002` / `AC-003` | 前端工作区预览区蓝图待审批视觉引导层及测试 | Vitest / RTL | done |
| **TASK-099** | 全量回归与验收 | 运行全量测试套件、生成验收矩阵与报告 | `go test`, `npm test` | done |
