# 验收用例（Acceptance Criteria）· TASK-038

> 关联任务：[TASK-038 · 开发 AddPluginModal 自定义添加插件模态框](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v9/tasks.md)  
> 关联需求：`v9.REQ-004`

---

## 验收结果

| 验收标准 ID | 验证项描述 | 期望结果 | 实际结果 | 结论 |
|---|---|---|---|:---:|
| `v9.REQ-004-AC-001` | 点击 + Add Plugin 唤起模态框并展示输入项 | 弹出对话框包含 Name, Endpoint/Command, Description 等 | 居中弹出圆角模态框，字段健全 | **PASS** |
| `v9.REQ-004-AC-002` | 提交有效插件信息触发添加回调并关闭弹窗 | 表单校验通过，新增插件生效并关闭 | 表单校验防空有效，回调数据结构完整 | **PASS** |

---

## 自动化测试用例输出

```bash
✓ src/components/AddPluginModal.test.tsx (4 tests)
  ✓ renders dialog with inputs for name, endpoint/command, and description when open
  ✓ does not render when isOpen is false
  ✓ validates required fields before submitting
  ✓ submits valid plugin information and triggers callback
```
