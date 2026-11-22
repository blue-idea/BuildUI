# 验收用例（Acceptance Criteria）· TASK-047 & TASK-048

> 关联任务：[TASK-047, TASK-048 · 升级 ComponentInspector 与全链路打通](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v11/tasks.md)  
> 关联需求：`v11.REQ-001`, `v11.REQ-003`

---

## 验收结果

| 验收标准 ID | 验证项描述 | 期望结果 | 实际结果 | 结论 |
|---|---|---|---|:---:|
| `v11.REQ-001-AC-001` | 激活检查模式后在预览区覆盖交互式点选条 | 顶部展示 Inspector Active 状态与元素药丸 | 悬浮条与元素药丸列表渲染正常 | **PASS** |
| `v11.REQ-001-AC-003` | 点选目标元素后锁定并唤起 LocalEditPopover | 锁定元素并居中弹出局部控制器 | 点击即刻唤起局部编辑气泡浮层 | **PASS** |
| `v11.REQ-003-AC-001` | 提交局部修改指令，自动注入 Chat 输入框并切至构建视图 | 组装结构化定向 Prompt 并填入会话流 | 自动格式化 @[path] 指令并对焦输入框 | **PASS** |

---

## 自动化测试用例输出

```bash
✓ src/components/ComponentInspector.test.tsx (4 tests)
  ✓ renders inspector banner when active
  ✓ calls onExit when clicking exit button
  ✓ selects component and triggers callback with component path and suggested prompt
  ✓ locks targeted element upon clicking target element tag and opens LocalEditPopover
✓ src/App.test.tsx (25 tests)
  ✓ selects target element in inspector, fills local edit prompt, and injects into chat
```
