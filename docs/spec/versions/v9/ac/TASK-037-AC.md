# 验收用例（Acceptance Criteria）· TASK-037

> 关联任务：[TASK-037 · 定义数据模型与开发 PluginCard 插件卡片组件](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v9/tasks.md)  
> 关联需求：`v9.REQ-002`, `v9.REQ-003`

---

## 验收结果

| 验收标准 ID | 验证项描述 | 期望结果 | 实际结果 | 结论 |
|---|---|---|---|:---:|
| `v9.REQ-002-AC-002` | 卡片展示品牌图标、标题、Badge、描述、域名与 Add 按钮 | 字段与操作完整且布局规整 | 与设计图一致，包含品牌首字母/图标与紫色 Add 按钮 | **PASS** |
| `v9.REQ-003-AC-002` | 点击 Add 按钮触发回调，已添加状态呈现 Added 徽标 | 正确回调父级并显示 Added 状态 | 测试用例与实际运行均表现符合期望 | **PASS** |

---

## 自动化测试用例输出

```bash
✓ src/components/PluginCard.test.tsx (3 tests)
  ✓ renders plugin details including name, badge, description, and domain
  ✓ calls onAdd callback when clicking the Add button for uninstalled plugin
  ✓ renders Added/Installed state when plugin is already installed
```
