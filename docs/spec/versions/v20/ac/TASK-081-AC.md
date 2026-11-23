# TASK-081-AC 验收矩阵

> 任务名称：后端 Vision LLM 风格提取核心服务实现 (`internal/theme`)  
> 规范版本：v20 · 日期：2026-11-23  

---

## 验收细则

| 验收标准编号 | 期望行为 | 验证方法 | 判定条件 |
|---|---|---|---|
| `v20.REQ-001-AC-001` | `ThemeService.ExtractStyle` 能够接收包含文本参照物和/或图片 Base64 数据的请求 | `go test -v ./internal/theme -run TestExtractStyle_Success` | 请求结构体字段正确解析且无类型错误 |
| `v20.REQ-001-AC-002` | 当请求包含 `ImageBase64` 时，构造带 `image_url` 的多模态消息 | `go test -v ./internal/theme -run TestExtractStyle_Multimodal` | 抓取构造的 LLM 请求，确认包含 `type: image_url` |
| `v20.REQ-001-AC-003` | System Prompt 要求大模型返回规范的 JSON 格式 | `go test -v ./internal/theme -run TestExtractStyle_Prompt` | 确认 System Prompt 中包含 Design System Tokens 约束 |
| `v20.REQ-001-AC-004` | 容错处理：清洗 Markdown 代码块反序列化 JSON，未配置时返回明确错误 | `go test -v ./internal/theme -run TestExtractStyle_ErrorHandling` | 模拟各种格式与配置缺失，正确捕获并返回错误 |
