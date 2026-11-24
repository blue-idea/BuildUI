# TASK-101 验收标准与测试矩阵

## 任务目标
实现全局状态中的预设删除持久化，并支持默认预设的恢复。

## 验收项清单

- [x] **AC-101-1**: 在 `App.tsx` 中，用户删除内置或基准预设时，其 ID 被持久化记录在 `localStorage`（键名 `blot_deleted_preset_ids`）。
- [x] **AC-101-2**: 页面刷新或重新挂载时，被删除的预设不会重新被内置列表还原。
- [x] **AC-101-3**: 支持一键恢复默认预设功能，清空已删除记录并还原全部内置预设。

## 验收证据
- `src/App.tsx` 联动测试通过，Playwright 真实点击恢复默认按钮还原成功。
- Playwright 截图：`03-v25-empty-state-and-restore.png` 与 `04-v25-restored-default-styles.png`。
