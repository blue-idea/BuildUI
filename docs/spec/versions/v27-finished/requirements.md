# v27 工程管理页按 Web、Desktop、App 分类显示规格需求

## 1. 业务背景与问题分析

在 BuildUI 的多端应用开发体系中，应用模版库与风格设计中心已经全面建立了 Web、Desktop、App 三大多端形态分类体系。

但在“工程管理页（ProjectsCenterView）”中，所有不同形态的本地工程目前混排在一个单一网格中：
1. **缺少分类筛选**：用户无法仅查看已创建的桌面端（Desktop / Wails）工程或移动端（App / Expo React Native）工程；
2. **缺少形态视觉指引**：工程卡片上缺少明确的平台形态 Badge 徽章，用户无法快速辨识某个工程是属于 Web 网站、移动 App 还是桌面应用；
3. **新建工程形态未标记**：新建工程表单未提供形态选择，默认属性不明确。

用户明确提出需求：“工程管理页，也需要按照web、desktop、app进行分类显示”。

## 2. 需求条目与验收标准 (EARS & AC)

### v27.REQ-001：工程管理页多形态分类筛选与计数
- **v27.REQ-001-AC-001 (Platform Filter Tabs)**：工程管理页提供清晰的平台分类切换栏，支持 4 个选项卡：全部（`all`）、Web 应用（`web`）、桌面端应用（`desktop`）、移动端 App（`app`）。
- **v27.REQ-001-AC-002 (Real-time Filtering)**：切换不同分类选项卡时，工程卡片列表仅呈现符合当前平台形态的工程；当处于 `all` 时展示全部工程。
- **v27.REQ-001-AC-003 (Platform Counts)**：每个分类选项卡旁显示该分类下当前工程的数量角标，支持与搜索框关键字联动或独立展示。
- **v27.REQ-001-AC-004 (Combined Filtering)**：平台形态分类筛选必须与关键字搜索输入框协同工作（即在当前分类下进行模糊匹配过滤）。

### v27.REQ-002：工程卡片平台形态 Badge 渲染与智能推断
- **v27.REQ-002-AC-001 (Card Platform Badge)**：每个工程卡片必须渲染与其所属平台对应的形态 Badge：
  - Web：蓝色 Globe 图标及 "Web" 徽章；
  - Desktop：紫色 Monitor 图标及 "Desktop" 徽章；
  - App：绿色 Smartphone 图标及 "App" 徽章；
  - 具备 `data-testid="project-platform-badge-{app.id}"`。
- **v27.REQ-002-AC-002 (Platform Invariant & Fallback)**：工程数据结构（`AppItem`）扩展 `platform?: 'web' | 'desktop' | 'app'`。若历史旧工程未显式指定 `platform`，系统通过 `inferAppPlatform` 根据其名称或路径进行智能回退判断，默认安全 fallback 到 `web`，严禁出现 `undefined` 导致布局崩溃。

### v27.REQ-003：新建工程形态归属与分类空状态
- **v27.REQ-003-AC-001 (Creation Platform Selection)**：新建项目卡片表单支持选择工程形态（Web / Desktop / App 单选胶囊），新建成功后工程将具备所选形态标识。
- **v27.REQ-003-AC-002 (Category Empty State)**：当某一分类下暂无工程时，优雅展示该分类的专属空状态提示，包含形态图标及新建/从模版创建快捷入口。
- **v27.REQ-003-AC-003 (Internationalization & Accessibility)**：所有选项卡与卡片 Badge 均具备完整的中英文双语 i18n 字典，包含无障碍语义属性（`role="tab"`、`aria-selected` 等）。
