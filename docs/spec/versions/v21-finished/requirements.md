# v21 需求规格说明书 (Requirements)

> 规范版本：v21 · 创建日期：2026-11-23  
> 目标模块：风格提取引擎（`internal/theme/style.go`、`frontend/src/utils/styleExtractor.ts`）、风格提取器（`StyleExtractor.tsx`）、风格中心（`StyleCenterView.tsx`）、类型定义（`frontend/src/types/style.ts`）

---

## 1. 业务背景与问题陈述

当前 BuildUI 已经实现了基于 Vision LLM 与模型选择的智能风格提取，但在实际应用场景中仍存在重要盲区：
1. **单一通用的设计规范，缺乏针对端形态的定制**：现有的提取 Prompt 未区分目标应用形态（Web 网页、移动端 App、桌面客户端 Desktop）。不同的应用形态在界面尺寸、交互范式（鼠标悬停 vs 触控手势）、导航架构（顶部 Header vs 移动端底部 TabBar vs 桌面三栏式 Sidebar）、圆角与字阶体系上存在本质差异。
2. **模版库无法识别端形态归属**：保存至风格模版库的模版缺乏应用类型元数据标注，用户无法快速分辨某个设计系统是专为移动端 App 打造、专为桌面客户端量身定制，还是适合 Web SaaS 网站，无法进行精准筛选与应用。

---

## 2. 需求列表

### v21.REQ-001: 多应用类型（Web / App / Desktop）定制风格提取服务
- **EARS 描述**: When invoking `ExtractStyle` with a specified `appType` ('web' | 'app' | 'desktop'), the system shall apply tailored system directives and output design tokens optimized for that platform target, defaulting to 'web'.
- **验收标准 (AC)**:
  - **`v21.REQ-001-AC-001`**: 在 `internal/theme/style.go` 中，`ExtractStyleRequest` 与 `ExtractedStyleDTO` 增加 `AppType` 字段（取值 `"web"`、`"app"`、`"desktop"`，若为空则默认 `"web"`）。
  - **`v21.REQ-001-AC-002`**: 后端根据 `AppType` 构建领域专属的 System Prompt 与设计规则约束：
    - `web`: 聚焦浏览器响应式 SaaS / 网站，注重 Header/Nav 导航、栅格响应式断点、Tailwind Web 类目及可扩展信息层级；
    - `app`: 聚焦 iOS / Android 移动端触控体验，强调触控目标（$\ge 44\text{px}$）、大圆角（`rounded-2xl`）、底部 TabBar 导航、安全区/状态栏适配及移动端排版；
    - `desktop`: 聚焦 macOS / Windows 原生桌面系统质感，强调三栏式侧边栏 Dock、标题栏嵌入式控制器/Traffic Lights、极细微边框与磨砂毛玻璃（`backdrop-blur`）、键盘快捷键提示与高密度面板布局。
  - **`v21.REQ-001-AC-003`**: 前端 `extractStyleFromReference` 支持可选入参 `appType?: 'web' | 'app' | 'desktop'`，在离线与回退模式下同样注入平台专属标签与定制 Prompt。

### v21.REQ-002: 前端风格提取器提供应用类型选择交互
- **EARS 描述**: While in the Style Extractor view, the user shall be able to toggle the target application type (Web, App, Desktop) via a pill selector, which defaults to 'web' and dynamically guides the extraction.
- **验收标准 (AC)**:
  - **`v21.REQ-002-AC-001`**: 在 `StyleExtractor.tsx` 的参照物输入卡片中增加应用类型单选切换组件（Web、App、Desktop 三合一胶囊），默认为 `web`。
  - **`v21.REQ-002-AC-002`**: 用户点击不同应用类型时，状态即时响应并作为 `appType` 传递至提取请求中。
  - **`v21.REQ-002-AC-003`**: 提取结果卡片头部醒目标注当前风格的应用类型徽章（Badge），分色呈现（Web: 浅蓝, App: 浅紫, Desktop: 浅绿）。

### v21.REQ-003: 风格模版库标注应用类型与类型筛选
- **EARS 描述**: In the Style Templates view, each template card shall display its assigned application type badge, and users can filter templates by type ('all' | 'web' | 'app' | 'desktop').
- **验收标准 (AC)**:
  - **`v21.REQ-003-AC-001`**: `ExtractedStyle`、`ThemePreset`、`StyleTemplate` 扩展 `appType?: 'web' | 'app' | 'desktop'` 属性；保存提取结果时持久化保存该字段；历史模版默认按 `web` 显示。
  - **`v21.REQ-003-AC-002`**: `StyleCenterView.tsx` 模版库的每个卡片上均渲染该风格的应用类型徽章（Badge），直观展示平台形态。
  - **`v21.REQ-003-AC-003`**: `StyleCenterView.tsx` 模版库顶部提供应用类型筛选胶囊（全部 / Web / App / Desktop），支持一键过滤视图列表。
