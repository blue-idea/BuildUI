# TASK-082-AC 验收矩阵

> 任务名称：Wails 主进程 RPC 桥接与端点暴露 (`app.go`)  
> 规范版本：v20 · 日期：2026-11-23  

---

## 验收细则

| 验收标准编号 | 期望行为 | 验证方法 | 判定条件 |
|---|---|---|---|
| `v20.REQ-001-AC-005` | `App` 结构体暴露 `ExtractStyle(req theme.ExtractStyleRequest) (*theme.ExtractedStyleDTO, error)` 并传递上下文调用 `themeService.ExtractStyle` | `go test -v ./... -run TestApp_ExtractStyle` | 成功透传调用并返回 DTO 结果 |
