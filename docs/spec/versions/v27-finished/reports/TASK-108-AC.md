# TASK-108 验收标准与测试矩阵

## 任务目标
扩展 `AppItem` 数据模型支持 `platform`，实现 `inferAppPlatform` 智能推断工具，扩充中英文 i18n 词条。

## 验收项清单

- [x] **AC-108-1**: `AppDrawer.tsx` 中 `AppItem` 扩展 `platform?: 'web' | 'desktop' | 'app'`。 (已实现并通过类型检查)
- [x] **AC-108-2**: 实现并导出 `inferAppPlatform` 纯函数，覆盖名称或路径推断与默认 `web` 回退。 (已实现并在 App.tsx / ProjectsCenterView.tsx 统一调用)
- [x] **AC-108-3**: `frontend/src/i18n/` 中 `types.ts`、`en.ts`、`zh.ts` 补充 `tabAll`、`tabWeb`、`tabDesktop`、`tabApp` 等词条。 (已验证中英文支持)
