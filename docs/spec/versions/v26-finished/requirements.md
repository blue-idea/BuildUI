# v26 风格与设计中心移动端 App 风格模版重构规格需求

## 1. 业务背景与问题分析

在 BuildUI 的“风格与设计中心”及首页推荐中，移动端 App（`appType: 'app'`）分类下原本预设了若干风格模版。但经过实际使用审查，原有的移动端 App 模版中存在较多纯黑或超暗背景方案：
1. **Apple Health**：背景为纯黑 OLED 曜石黑（`#000000`）。
2. **Threads Mobile**：背景为单色深黑（`#101010`）。
3. **Cash App Mobile**：背景为暗夜纯黑（`#000000`）。

上述黑色背景风格在移动端应用的日常生成与展示中较为局限，对于通用生活服务、生产力、旅行度假、健康冥想、现代金融等主流应用形态并不适用，视觉较为压抑。用户明确提出需求：“风格与设计中心，app的风格模版中删除所有黑色背景的风格。并补充一些经典设计的app 的风格。”

## 2. 需求条目与验收标准 (EARS & AC)

### v26.REQ-001：移除所有黑色背景的移动端 App 风格
- **v26.REQ-001-AC-001 (Purge Dark App Presets)**：从标杆预设库（`BENCHMARK_PRESETS`）中彻底移除所有背景色为纯黑或接近黑色的移动端 App 风格模版，包括 `ios-health`（`#000000`）、`threads`（`#101010`）、`cashapp`（`#000000`）。
- **v26.REQ-001-AC-002 (Non-Black Background Invariant)**：所有标记为 `appType === 'app'` 的风格预设模版，其 `palette.background` 严禁使用深黑或近黑色（如 `#000000`, `#101010`, `#111111` 等），必须为明亮清爽的浅色、暖白或纸感中性背景。

### v26.REQ-002：补充高品质经典移动端 App 浅色风格模版
- **v26.REQ-002-AC-001 (iOS Modern Clean)**：新增经典 Apple HIG 浅色系统风格（`ios-clean`），背景采用 iOS 经典次级浅灰（`#f2f2f7`），表面采用纯白卡片（`#ffffff`），主色采用系统蓝（`#007aff`），大圆角与精致触控边框。
- **v26.REQ-002-AC-002 (Airbnb Mobile)**：新增经典 Airbnb 移动端旅行度假设计风格（`airbnb-mobile`），背景采用纯白（`#ffffff`），表面浅灰（`#f7f7f7`），主色采用 Rausch 珊瑚粉红（`#ff385c`），沉浸式卡片与胶囊导航。
- **v26.REQ-002-AC-003 (Headspace Mindful)**：新增经典正念冥想与心理健康风格（`headspace-mobile`），背景采用温润燕麦米白（`#fcf8f2`），主色采用暖阳橙（`#f47d31`），辅以薄荷青，提供低压舒缓视觉。
- **v26.REQ-002-AC-004 (Revolut NeoBank)**：新增经典现代移动新金融风格（`revolut-mobile`），背景采用极简浅银白（`#f8f9fa`），主色采用高饱和科技蓝（`#1969ff`），纯白卡片与微边框。
- **v26.REQ-002-AC-005 (Notion Mobile)**：新增经典生产力与笔记应用风格（`notion-mobile`），背景采用纯净纸感白（`#ffffff`），表面轻质纸感（`#f7f6f3`），主色采用石墨墨水黑（`#2e3035`），排版优先。
- **v26.REQ-002-AC-006 (Preserve Duolingo)**：保留原有的 Duolingo Mobile（`duolingo`）趣味游戏化浅色风格（背景 `#ffffff`，主色 `#58cc02`）。

### v26.REQ-003：首页设计预设联动与测试保障
- **v26.REQ-003-AC-001 (HomeGuideView Preset Sync)**：同步更新首页向导视图（`HomeGuideView`）中的移动端推荐预设，将原 Apple Health、Threads 替换为全新浅色经典风格（如 iOS Modern Clean、Airbnb Mobile 等）。
- **v26.REQ-003-AC-002 (Test Invariant)**：编写自动化测试，断言当前所有 App 模版均非黑底，且新增的经典风格能正确被筛选与提取。
