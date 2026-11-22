# 规格审查分析报告（Analysis Report）· Blot-UI v15

> 文件路径：`docs/spec/versions/v15/analysis-report-2026-11-23.md`  
> 规范版本：v15 · 日期：2026-11-23  
> 审查对象：`requirements.md`、`design.md`  

---

## 1. 需求与设计一致性审查

| 需求项 | 验收标准 | 对应设计方案 | 状态 | 评估说明 |
|---|---|---|:---:|---|
| `v15.REQ-001` | AC-001: 拟真地址栏输入框渲染 | 改造 `WorkspacePanel` 地址栏为带 `data-testid="browser-address-input"` 的可编辑 `<input>` | 通过 | 保留外层样式与 testid，完全兼容现有测试 |
| `v15.REQ-001` | AC-002: 相对/绝对路由解析与导航 | `resolveNavigationUrl` 智能拼接 basePreviewUrl 并触发 iframe.src 刷新 | 通过 | 支持 `/dash`、`dash`、`http://...` 各类输入 |
| `v15.REQ-001` | AC-003: Escape 键取消重置 | 监听 `onKeyDown` Escape 恢复当前 URL 并失焦 | 通过 | 体验贴近真实浏览器 |
| `v15.REQ-001` | AC-004: 前进/后退历史触发 | 绑定 `history.back()` / `forward()` 并作异常安全捕获 | 通过 | 完善浏览器控件交互闭环 |
| `v15.REQ-002` | AC-001: 沙箱路由跳变监听 | `preview-inspector.ts` 包裹 `pushState` / `replaceState` 及监听 popstate | 通过 | 保证 SPA 路由切换时能感知 |
| `v15.REQ-002` | AC-002: 双向同步到地址栏 | `WorkspacePanel` 监听 `buildui:route-changed` 更新展示文本 | 通过 | 保持预览页面与地址栏状态一致 |

---

## 2. 架构风险与边界审查

- **CORS 跨域历史访问风险**：预览沙箱可能位于不同端口（如 Vite 5173，而主窗口在 Wails 或另一端口）。因此对 `iframeRef.current?.contentWindow?.history` 的访问必须采用安全 try-catch 保护，不可因跨域抛错导致页面奔溃。
- **用户编辑中途被覆盖风险**：当用户正在地址栏中聚焦输入文本时，若沙箱正好发生定时刷新或事件触发，不应强行覆盖用户正在输入的草稿（通过 `isInputFocused` 守卫保护）。
- **审查结论**：无未决架构风险，准予拆分任务进入开发。
