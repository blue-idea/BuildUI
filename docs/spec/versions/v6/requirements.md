# 需求规格说明书（Requirements）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/requirements.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：已定稿（Approved）  
> 核心目标：macOS 极致美学应用程序界面（浅色/深色双模主题）、中英双语国际化系统（i18n）  
> 架构基准：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)  
> 继承规则：`docs/spec/steering/` 与 `docs/spec/versions/v1-finished/constitution.md`

---

## 1. 业务背景与演进目标

在完成 v1 至 v5 的基础闭环与极客功能建设后，Blot-UI 已经拥有强大的本地 AI 前端生成能力、多项目管理、代码自愈及模板生态。  
**v6 版本的核心演进目标**是**全面升级桌面端视觉体验与跨语种国际化能力**，将整体 UI 提升至符合 **Apple macOS 极致现代审美**的工业级水准：

1. **macOS 工业级美学界面与深浅双模主题（macOS Aesthetic UI & Dual-Mode Theme）**：
   - 顶部提供标志性 macOS 红黄绿交通灯三色窗口控制微组件；
   - 采用精致的高质感磨砂亚克力玻璃背景（`backdrop-blur-xl`）、精细微边框（`border-black/5` 与 `border-white/10`）、系统级 Apple 字体渲染（`-apple-system, "SF Pro Text", "PingFang SC"`）与平滑圆角（`rounded-2xl`, `rounded-xl`）；
   - 完备支持 **macOS 浅色主题（Light Mode）** 与 **macOS 深色主题（Dark Mode）**，包括面板底色、卡片高光、文字层次与阴影层级的细致调校。
2. **中英双语国际化系统（Bilingual Localization: EN & ZH）**：
   - 提供轻量、强类型、零依赖的全局 i18n 国际化引擎；
   - 全局界面元素（顶部工具栏、交通灯、应用抽屉、模版中心、命令面板、设置面板、导出面板、聊天流与预览控制）完整支持英文（English）与简体中文（Chinese）无刷新瞬时切换；
   - 语言偏好自动本地持久化。

---

## 2. 需求列表与 EARS 验收标准

---

### 需求 v6.REQ-001 · macOS 风格设计语言与双模（Light / Dark）主题系统

**用户故事：** 作为 追求极致审美与操作质感的开发者，我希望 桌面端拥有原汁原味的 macOS 视觉体验（红绿灯窗口控制、细腻磨砂质感与明暗双色），以便 在任何环境光线和操作系统偏好下都能享受沉浸愉悦的工作流。

#### 验收标准

```yaml
- id: v6.REQ-001-AC-001
  ears: >
    The system shall define semantic macOS design tokens for both 'light' and 'dark' modes,
    specifying exact background canvas (#f5f5f7 / #1c1c1e), elevated surface glass,
    subtle border separators, text hierarchies (#1d1d1f vs #f5f5f7), and vibrant Apple blue accents (#0071e3 / #0a84ff).
  test_type: Unit
  expected:
    return_value: "MacOSThemeConfig, valid=true"
    throws: null
    side_effects: []

- id: v6.REQ-001-AC-002
  ears: >
    While on the desktop dashboard,
    the top titlebar shall render macOS style traffic light window controls (close, minimize, zoom)
    along with integrated frosted glass navigation and unified control buttons.
  test_type: UI / E2E
  expected:
    ui_state: "Traffic light circles (red, yellow, green) are rendered at top-left of header"
    side_effects: []

- id: v6.REQ-001-AC-003
  ears: >
    When the user clicks the Theme Mode toggle button in the header or runs the switch command in Command Palette,
    the UI shall seamlessly transition the entire application between Light Mode and Dark Mode without layout shifts.
  test_type: UI / E2E
  expected:
    ui_state: "Root and component classes toggle between light and dark backgrounds and typography"
    side_effects:
      - "Active theme mode persisted in localStorage"
```

---

### 需求 v6.REQ-002 · 中英双语国际化与即时语言切换系统

**用户故事：** 作为 国内外不同语言偏好的用户，我希望 能在中英双语间无缝切换，以便 无论母语是中文还是英文都能清晰流畅地理解每一个功能与引导说明。

#### 验收标准

```yaml
- id: v6.REQ-002-AC-001
  ears: >
    The system shall provide a strongly-typed i18n localization engine
    with complete language dictionaries for English ('en') and Simplified Chinese ('zh'),
    covering all navigation labels, modal dialogues, action buttons, hints, and system messages.
  test_type: Unit
  expected:
    return_value: "Translations, 100% key parity between en and zh"
    throws: null
    side_effects: []

- id: v6.REQ-002-AC-002
  ears: >
    When the user clicks the Language Switcher in the top navigation or triggers it via Command Palette,
    the application shall immediately re-render all visible text in the chosen language (English or 中文)
    without reloading the page or losing current chat / preview session state.
  test_type: UI / E2E
  expected:
    ui_state: "All header, drawer, template, command, and modal texts update instantly"
    side_effects:
      - "Active locale persisted"
```

---

## 3. 非功能性需求（NFR）

1. **视觉一致性（Visual Pixel Perfection）**：严格遵循 Apple Human Interface Guidelines (HIG)，文字抗锯齿、边框半透明柔和度、圆角尺寸与层级阴影均符合原生 macOS 桌面水准。
2. **零闪烁与零刷新（Zero Flash & Zero Reload）**：主题深浅切换与中英语言切换全在内存响应，响应延迟 < 20ms，不得触发任何路由刷新或 iframe 重新加载。
3. **类型安全与字典完整性（i18n Type Parity）**：中英语言包键名通过 TypeScript 类型契约严格约束，缺少翻译键时产生编译期报错。
