# 需求规格说明书 · Blot-UI v18

> 文件路径：`docs/spec/versions/v18/requirements.md`  
> 规范版本：v18 · 日期：2026-11-23  
> 状态：草稿 / 待确认  
> 依据规则：[docs/spec/steering/](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/steering/) · [docs/spec/versions/v1-finished/constitution.md](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v1-finished/constitution.md)

---

## 1. 业务背景与问题分析

Blot-UI 当前具备初步的风格提取与风格中心功能，但存在以下显著不足：
1. **提取效果较弱且粗糙**：原有的风格提取仅支持少量硬编码名称映射，未匹配时仅生成极为简陋的默认单一色板，生成的 `designPrompt` 只有寥寥数行，缺乏真实网站（如 Linear、Stripe、Vercel、Supabase 等）标杆级别的色阶体系（Primary, Secondary, Accent, Canvas Background, Surface Card, Text, Border）、排版梯度、圆角阴影体系与 Tailwind CSS 工具类指导。
2. **提取模版未能完整流转**：在提取器（`StyleExtractor`）中提取出的风格虽然支持保存，但在风格中心（`StyleCenterView`）中仅转换为简易的配色预设，丢弃了完整的 `stylePrompt` 与丰富的设计规范。
3. **首页与风格模版割裂**：首页引导区（`HomeGuideView`）中的“设计系统预设”采用硬编码静态数组（`STYLE_PRESETS`），无法动态展示风格页中的可用模版（包括内置预设与用户提取保存的自定义模版）。选定风格后，首页仅在提示词中追加了单行模版名称，未将结构化的 `style prompt` 注入到初始生成提示词中，导致代码生成模型无法忠实复现目标风格。

---

## 2. 需求列表

### 需求 v18.REQ-001：标杆级真实网站风格提取引擎优化

- **需求描述**: 优化 `styleExtractor` 工具函数，以业界真实顶尖网站（如 Linear、Stripe、Vercel、Supabase、Apple、Airbnb、GitHub、Raycast 等）为标杆，支持根据 URL、品牌名称、自然语言风格描述或截图，高保真提取色彩体系、设计语言、排版与微质感规范，并生成工业级可执行的 `stylePrompt`。
- **验收标准 (AC)**:
  - **`v18.REQ-001-AC-001`**: 输入已知标杆网站（如 "linear", "https://linear.app", "stripe", "supabase" 等）时，准确提取该网站的特征色板（主色、辅助色、背景色、卡片表面色、文字色、边框色）、圆角级别、字体栈与视觉标签。
  - **`v18.REQ-001-AC-002`**: 输入任意自然语言（如 "clean modern fintech saas" 或 "warm coffee shop editorial"）或未知品牌/URL 时，算法基于语义与哈希智能推导出高对比度、符合视觉美学的和谐色盘与规范。
  - **`v18.REQ-001-AC-003`**: 生成的 `stylePrompt` 包含结构化的设计系统指令（包含角色视觉基调、Design Tokens、组件卡片/按钮/边框圆角规范、Tailwind CSS 工具类落地指南与禁忌提示），可直接供大模型构建高质量代码。

### 需求 v18.REQ-002：风格提取结果直观呈现与模版保存

- **需求描述**: 在风格提取器界面（`StyleExtractor.tsx`）与风格中心（`StyleCenterView.tsx`）中，直观展示提取出的多维色板、设计规范标签、组件示例预览以及完整的 Style Prompt，并支持将提取结果一键保存为模版持久化。
- **验收标准 (AC)**:
  - **`v18.REQ-002-AC-001`**: `StyleExtractor` 结果区展示色块矩阵（Primary, Accent, Background, Surface, Border）、圆角排版标签，以及格式化代码块形式的 Style Prompt，并提供一键复制功能。
  - **`v18.REQ-002-AC-002`**: 点击“保存为模版（Save as Template）”按钮，将完整包含 `stylePrompt`、色盘及元数据的风格模版持久化至风格中心列表，并弹出已保存状态反馈。
  - **`v18.REQ-002-AC-003`**: 风格中心（`StyleCenterView`）模版列表支持展示内置预设与用户自定义提取模版，卡片展示双色/多色色盘预览，支持点击直接应用为当前主题，并支持自定义模版删除。

### 需求 v18.REQ-003：首页设计系统预设动态联动与 Style Prompt 深度注入

- **需求描述**: 首页（`HomeGuideView`）中的设计系统预设（调色板 Popover）改由风格页的可用模版列表动态驱动，并在开始构建项目时，将所选风格的完整 `stylePrompt` 深度注入到项目生成提示词中。
- **验收标准 (AC)**:
  - **`v18.REQ-003-AC-001`**: 首页调色板浮层中的设计系统预设动态加载风格页的所有可用模版（含用户刚刚提取保存的模版），展示动态渲染的色盘预览徽章、模版名称与描述。
  - **`v18.REQ-003-AC-002`**: 用户在首页选择某个设计系统模版时，右上角高亮展示当前激活风格名称；若选择默认 Auto 则按常规生成。
  - **`v18.REQ-003-AC-003`**: 点击“开始生成”或在输入框按回车提交时，组装生成的初始 Prompt（`assembledPrompt`）必须显式内嵌该风格模版的完整 `stylePrompt`（或核心设计规约指令），确保后端与 AI 代码生成流水线能准确接收设计规范。
