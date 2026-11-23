# v20 规格审查报告 (Analysis Report)

> 审查日期：2026-11-23  
> 审查对象：`docs/spec/versions/v20/requirements.md`、`docs/spec/versions/v20/design.md`  
> 审查依据：[docs/spec/versions/v1-finished/constitution.md](file:///e:/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)、[steering/](file:///e:/Nextcloud/coding/desktop/BuildUI/docs/spec/steering/)

---

## 1. 规格一致性审查结论

| 审查维度 | 审查结果 | 详细说明 |
|---|:---:|---|
| **需求覆盖度 (Requirements Completeness)** | ✅ PASS | 需求完整覆盖了多模态 Vision LLM 后端提取（REQ-001）、前端模型选择器与提取交互（REQ-002）、模版保存与首页联动（REQ-003），无未定义行为。 |
| **架构与数据一致性 (Design Consistency)** | ✅ PASS | `ExtractStyleRequest` 与 `ExtractedStyleDTO` 在前端 TypeScript 与后端 Go 之间严格对应，字段命名一致。 |
| **可测试性 (Testability)** | ✅ PASS | 后端可通过 Mock `SettingsRepository` 与 `Provider` 进行 100% 单元测试覆盖；前端可通过 Vitest 与 Mock Wails RPC 测试状态流转与降级分支；E2E 可通过 Playwright 捕获视觉证据。 |
| **无破坏性兼容 (Backward Compatibility)** | ✅ PASS | 离线与单测环境具备自动回退至本地提取规则的机制，保证现有测试不受影响；`ExtractedStyleDTO` 同时兼容旧的 `designPrompt` 字段。 |

---

## 2. 潜在风险与防御措施

1. **大模型输出格式偶发不合规（如输出额外说明性文字或非标准 JSON）**：
   - 防御措施：后端编写鲁棒的 Markdown 代码块清洗函数 `cleanJSONResponse(raw)`，提取首个 `{` 到末个 `}` 之间的内容进行反序列化；若解析失败返回结构化错误。
2. **用户在未配置 API Key 时直接点击提取**：
   - 防御措施：后端提前校验 endpoint / apiKey / model，返回明确的 `PreconditionError`；前端捕获后展示友好的配置提示，并提供直达 Settings 的操作入口。
3. **大图 Base64 导致通信开销过大**：
   - 防御措施：复用已有的标准 DataURL 格式，与 `internal/llm/types.go` 的 `ChatMessage.Images` 无缝对接。

---

## 3. 审查裁决

规格审查通过，允许进入 STEP 5 任务拆分与可追溯性矩阵建立。
