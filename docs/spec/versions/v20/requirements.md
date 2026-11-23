# v20 需求规格说明书 (Requirements)

> 规范版本：v20 · 创建日期：2026-11-23  
> 目标模块：风格中心与提取器（`StyleCenterView` / `StyleExtractor`）、后端主题与风格提取服务（`internal/theme`）、Wails RPC（`app.go`）、模型选择器集成（`ModelSelector`）

---

## 1. 业务背景与问题陈述

当前 BuildUI 提供了风格页（Style Center）与参照物提取器（Style Extractor），但在实际使用中存在显著局限：
1. **完全没有使用 LLM 模型，提取结果很不准确**：现有的提取算法仅依赖纯前端写死的 9 个知名标杆网站字典与 3 条简陋的英文正则表达式；一旦用户输入其他真实网站或中文描述（如“高科技深色仪表盘”、“暖色美食社区”），一律返回写死的默认蓝色兜底色盘。
2. **图片上传缺少视觉解析能力**：上传截图时未进行任何图像像素分析或多模态 Vision 模型理解，仅仅充当本地预览图，无法从设计截图提取真实的主题色调与布局质感。
3. **无法在提取时自主选择已配置的模型**：用户在系统设置中配置了多个 LLM 服务商（如 OpenAI, Anthropic, Gemini, DeepSeek, Local/Ollama 等），但风格提取页面无法自主指定调用哪个模型，无法利用具备强大视觉理解能力（Vision LLM）的模型进行高保真设计系统提炼。

---

## 2. 需求列表

### v20.REQ-001: 后端多模态 Vision LLM 风格提取服务与 RPC (Backend Vision LLM Style Extraction Service & RPC)
- **EARS 描述**: When a client invokes `ExtractStyle` with text reference and/or base64 image data, the system shall resolve the configured provider & model from settings, invoke the Vision/LLM endpoint with a structured JSON output instruction, parse and return the `ExtractedStyleDTO` (name, palette, borderRadius, typography, tags, stylePrompt).
- **验收标准 (AC)**:
  - **`v20.REQ-001-AC-001`**: 在 `internal/theme` 中定义 `ExtractStyleRequest` 与 `ExtractedStyleDTO`，`ThemeService` 提供 `ExtractStyle(ctx, req)` 方法。
  - **`v20.REQ-001-AC-002`**: 支持多模态输入：当 `imageBase64` 存在时，通过 `llm.ChatMessage` 多模态结构构建带有 `image_url` 的消息发往支持 Vision 的模型；无图片时发往常规对话补全。
  - **`v20.REQ-001-AC-003`**: System Prompt 严格要求大模型输出纯 JSON 格式设计系统规范（色板 7 色 Tokens：primary, accent, background, surface, text, textMuted, border；圆角 borderRadius；字体 typography；标签 tags；完整的 Tailwind 结构化 stylePrompt）。
  - **`v20.REQ-001-AC-004`**: 健壮的 JSON 解析器：自动清洗模型可能输出的 Markdown 代码块（````json ... ````），提取合法 JSON 并校验必要字段；若服务未配置或调用失败，返回结构化友好英文错误。
  - **`v20.REQ-001-AC-005`**: `app.go` 暴露 `ExtractStyle(req theme.ExtractStyleRequest)` 方法供前端 Wails RPC 调用。

### v20.REQ-002: 风格提取器集成模型选择器与提取加载态 (Style Extractor Model Selector Integration & Loading UX)
- **EARS 描述**: While in the Style Extractor view, the user shall be able to select any configured model/provider from the model dropdown, and when extracting, the system shall show a loading state and communicate with the backend LLM service.
- **验收标准 (AC)**:
  - **`v20.REQ-002-AC-001`**: 在 `StyleExtractor.tsx` 的参照物输入卡片中集成 `ModelSelector`，用户可选择 `Auto` 或任意已在设置中配置的服务商模型（如 `provider:openai`, `provider:gemini`, `provider:anthropic` 等）。
  - **`v20.REQ-002-AC-002`**: 点击“Extract Style & Prompt”时，按钮与界面进入 loading 禁用态，显示高质感提取加载动画与文字提示（如 "Extracting design system with Vision LLM..."）。
  - **`v20.REQ-002-AC-003`**: 提取成功后，界面呈现由大模型生成的真实色盘矩阵（5~7色块）、实时 UI 卡片微预览、设计标签与完整的工业级 `stylePrompt`。
  - **`v20.REQ-002-AC-004`**: 若提取失败（例如未配置 API Key 或网络超时），展示明确友好的错误提示，并提供前往“设置”配置服务商的快捷按钮。

### v20.REQ-003: 提取结果模版保存与首页设计系统联动验证 (Template Persistence & Home Guide Build Prompt Verification)
- **EARS 描述**: When the user saves an LLM-extracted style template, the system shall persist it with the full `stylePrompt` and make it immediately selectable in the home guide popover for project generation.
- **验收标准 (AC)**:
  - **`v20.REQ-003-AC-001`**: 点击“Save as Style Template”后，生成的模版包含真实 LLM 输出的全部字段（含 `stylePrompt`）并保存到 `blot_style_templates`（localStorage）中。
  - **`v20.REQ-003-AC-002`**: 风格中心与首页 `HomeGuideView` 调色板浮层动态显示该模版，并在项目生成时将真实的 `stylePrompt` 深度注入至初始生成提示词。
