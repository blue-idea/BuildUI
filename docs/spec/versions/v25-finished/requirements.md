# v25 风格页模版列表全项删除功能规格需求

## 1. 业务背景与问题分析

在 BuildUI 的“风格与设计中心（Style Center）”中，系统预置了若干经典内置风格模版（如 Midnight Slate、Minimalist Light 等）与多应用标杆模版（Linear、Apple Health、Windows Fluent 等），同时支持用户自定义提取并保存风格模版。

在现有实现中，模版卡片的删除按钮仅针对以 `style-` 开头的自定义提取模版可见（受限于 `isCustom` 条件），而所有内置或标杆风格模版均没有删除按钮。这导致用户在定制界面风格库时无法移除不需要的预设项，选项列表拥挤，缺乏统一的卡片管理控制权。

因此，用户要求：“风格页的列表选项，每一项添加删除的功能按钮”。

## 2. 需求条目与验收标准 (EARS & AC)

### v25.REQ-001：模版列表全选项删除按钮覆盖与交互保障
- **v25.REQ-001-AC-001 (Universal Delete Button)**：在风格模版列表卡片中，对所有模版项（包括内置预设、基准标杆预设以及自定义提取预设）统一挂载删除功能按钮，不再受 `isCustom` 条件限制。
- **v25.REQ-001-AC-002 (Event Propagation Stop)**：点击卡片上的删除按钮时，必须显式调用 `e.stopPropagation()`，严禁触发卡片本身的点击选中主题事件。
- **v25.REQ-001-AC-003 (Semantic & Accessibility)**：删除按钮必须包含清晰的无障碍与测试属性，具有 `data-testid="delete-template-btn-{preset.id}"`、`title`（对应多语言国际化文案）及 `aria-label`。

### v25.REQ-002：删除联动与活动主题平滑顺延
- **v25.REQ-002-AC-001 (Active Theme Fallback)**：当用户删除的风格项恰好是当前处于激活状态的主题（`activeThemeId === id`）时，系统应平滑将激活主题顺延切换至列表中下一个可用风格项；若列表已无剩余风格项，则安全置空，避免任何空指针异常。
- **v25.REQ-002-AC-002 (Callback Notification)**：触发删除时，必须调用上层通知回调 `onDeletePreset` / `onDeleteCustomPreset`，确保应用全局状态与本地模版列表同步移除。
- **v25.REQ-002-AC-003 (Empty State Resilience)**：当某一应用类型分类或全部模版被用户全部删除导致列表为空时，卡片网格区域必须优雅渲染空状态提示（展示 Empty 图标、提示文案与“恢复默认风格”操作入口），严禁出现空白布局破坏或渲染崩溃。

### v25.REQ-003：持久化同步与默认恢复机制
- **v25.REQ-003-AC-001 (Persistent Exclusion)**：在应用顶层（`App.tsx`）持久化维护被删除的模版 ID 集合，避免页面刷新后已被用户删除的内置风格被重新注入。
- **v25.REQ-003-AC-002 (Restore Capability)**：提供快速恢复默认风格预设的机制，当用户误删或清空时可一键重置恢复全部内置预设。
