# 验收用例（Acceptance Criteria）· TASK-042

> 关联任务：[TASK-042 · 定义风格数据模型与开发 StyleExtractor 提取引擎及组件](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v10/tasks.md)  
> 关联需求：`v10.REQ-002`, `v10.REQ-003`, `v10.REQ-004`

---

## 验收结果

| 验收标准 ID | 验证项描述 | 期望结果 | 实际结果 | 结论 |
|---|---|---|---|:---:|
| `v10.REQ-002-AC-001` | 渲染图片上传区与参照物名称文本输入框 | 界面完整提供图片选择与品牌文本输入 | 完整呈现输入框与上传占位区 | **PASS** |
| `v10.REQ-002-AC-002` | 点击提取生成调色盘、设计标签与结构化 Prompt | 自动计算色彩矩阵与系统提示词 | 准确生成 Primary, Background, Surface, Text, Border 矩阵与 Prompt | **PASS** |
| `v10.REQ-003-AC-001` | 实时 UI 模拟效果展示 | 动态将提取出的色彩注入实时渲染卡片 | 卡片、按钮、徽章高保真模拟渲染 | **PASS** |
| `v10.REQ-004-AC-002` | 点击 Copy Prompt 复制到剪贴板并提示 Copied | 文本写入系统剪贴板并改变按钮状态 | 提示 Copied 并完成复制 | **PASS** |

---

## 自动化测试用例输出

```bash
✓ src/components/StyleExtractor.test.tsx (3 tests)
  ✓ renders input area for reference brand/product and image upload trigger
  ✓ extracts style and displays color palette and generated design prompt when extracting
  ✓ calls onSaveTemplate callback when clicking Save as Style Template button
```
