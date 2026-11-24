# TASK-100 验收标准与测试矩阵

## 任务目标
在风格页模版列表中的每一项添加删除功能按钮，支持阻止冒泡、平滑顺移当前激活主题、空状态保护及多语言文案。

## 验收项清单

- [x] **AC-100-1**: 风格页列表所有卡片（内置项、基准项、自定义项）均渲染删除按钮，并具备 `data-testid="delete-template-btn-{preset.id}"`。
- [x] **AC-100-2**: 点击任意卡片的删除按钮时，不触发该卡片的点击选择主题逻辑（`e.stopPropagation()` 生效）。
- [x] **AC-100-3**: 删除当前处于激活状态的模版时，自动将激活主题切换到下一个可用主题；当全部删除时安全置空。
- [x] **AC-100-4**: 当模版被全部移除后，呈现语义化空状态提示与“恢复默认风格”入口，无界面破坏或 JavaScript 报错。

## 验收证据
- `src/components/StyleCenterView.test.tsx` 单元测试 10/10 全部通过。
- Playwright 截图：`01-v25-style-center-universal-delete-buttons.png` 与 `02-v25-style-item-deleted-state.png`。
