# TASK-085-AC 验收矩阵

> 任务名称：后端多应用类型参数接收、定制化领域 Prompt 构建与 DTO 增强 (`internal/theme`)  
> 规范版本：v21 · 日期：2026-11-23  

---

## 验收细则

| 验收标准编号 | 期望行为 | 验证方法 | 判定条件 |
|---|---|---|---|
| `v21.REQ-001-AC-001` | `ExtractStyleRequest` 与 `ExtractedStyleDTO` 包含 `AppType` 字段，缺省或空值自动回退为 `"web"` | `go test -v ./internal/theme -run TestExtractStyle_AppType` | DTO 返回的 AppType 为 "web"，传入 "app" 时返回 "app" |
| `v21.REQ-001-AC-002` | 根据 `AppType` 注入专属设计规约到 System Prompt 中 | `go test -v ./internal/theme -run TestExtractStyle_AppTypePrompt` | App 模式包含触控与 TabBar 规约，Desktop 模式包含桌面 Dock 与窗口微质感规约，Web 模式包含响应式 SaaS 规约 |
