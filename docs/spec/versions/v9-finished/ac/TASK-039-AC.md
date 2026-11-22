# 验收用例（Acceptance Criteria）· TASK-039

> 关联任务：[TASK-039 · 开发 ComponentCenterView 主视图与目录搜索过滤](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v9/tasks.md)  
> 关联需求：`v9.REQ-001`, `v9.REQ-002`, `v9.REQ-003`

---

## 验收结果

| 验收标准 ID | 验证项描述 | 期望结果 | 实际结果 | 结论 |
|---|---|---|---|:---:|
| `v9.REQ-001-AC-002` | 视图顶部呈现 Go Back 按钮、Plugins 标题、说明文案与 + Add Plugin | 顶栏结构与设计图一致 | 完整包含返回按钮、标题、副标题与紫色添加主按钮 | **PASS** |
| `v9.REQ-002-AC-001` | 呈现 Add from catalog 区域，包含 Featured 与 AI & Media 分组 | 正确渲染精选与 AI/多媒体分类网格 | 包含 Stripe, Vercel, Hugging Face, HeyGen 等插件卡片 | **PASS** |
| `v9.REQ-002-AC-003` | Search catalog 输入框模糊搜索过滤 | 实时过滤分类与卡片 | 大小写不敏感过滤生效，无结果时友好提示 | **PASS** |
| `v9.REQ-003-AC-001` | 统计栏展示插件数与工具数，空状态提示 No plugins added yet. | 初始提示 0 plugins · 0 tools enabled | 空状态准确展示 | **PASS** |

---

## 自动化测试用例输出

```bash
✓ src/components/ComponentCenterView.test.tsx (6 tests)
  ✓ renders top navigation with Go Back, Plugins title, subtitle, and + Add Plugin button
  ✓ renders initial summary "0 plugins · 0 tools enabled" and empty state "No plugins added yet."
  ✓ renders catalog categories including Featured and AI & Media
  ✓ filters catalog plugins according to search input query
  ✓ installs a plugin when clicking Add on a card, updating counts and installed section
  ✓ opens AddPluginModal when clicking + Add Plugin and allows creating custom plugin
```
