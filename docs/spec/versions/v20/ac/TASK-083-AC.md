# TASK-083-AC 验收矩阵

> 任务名称：前端风格提取器集成模型选择器与提取加载态  
> 规范版本：v20 · 日期：2026-11-23  

---

## 验收细则

| 验收标准编号 | 期望行为 | 验证方法 | 判定条件 |
|---|---|---|---|
| `v20.REQ-002-AC-001` | `StyleExtractor.tsx` 渲染模型选择下拉组件，支持切换已配置模型 | `pnpm test:run StyleExtractor` | 页面成功渲染 `ModelSelector` 且可触发模型变更 |
| `v20.REQ-002-AC-002` | 点击提取后进入加载态，按钮禁用并显示加载中文本 | `pnpm test:run StyleExtractor` | 点击后按钮显示加载态，提取完成后恢复 |
| `v20.REQ-002-AC-003` | 提取成功后渲染大模型返回的色盘、UI 卡片预览与 Prompt | `pnpm test:run StyleExtractor` | 正确渲染 Primary/Background/Text 等色块与预览卡片 |
| `v20.REQ-002-AC-004` | 提取失败时展示友好错误提示 | `pnpm test:run StyleExtractor` | Mock 错误响应时页面展示包含错误原因的警告条 |
| `v20.REQ-003-AC-001` | 点击“Save as Style Template”后成功保存至模版列表 | `pnpm test:run StyleExtractor` | `onSaveTemplate` 回调被触发且携带完整 DTO 数据 |
| `v20.REQ-003-AC-002` | 首页 `HomeGuideView` 可感知并选中保存的风格模版 | `pnpm test:run HomeGuideView` | 调色板浮层包含新模版并在生成时注入 `stylePrompt` |
