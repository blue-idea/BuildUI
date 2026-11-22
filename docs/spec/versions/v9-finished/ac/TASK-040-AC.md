# 验收用例（Acceptance Criteria）· TASK-040 & TASK-041

> 关联任务：[TASK-040, TASK-041 · LeftDock 导航联动与视觉留证](file:///Volumes/data/Nextcloud/coding/desktop/BuildUI/docs/spec/versions/v9/tasks.md)  
> 关联需求：`v9.REQ-001` 及全量规范

---

## 验收结果

| 验收标准 ID | 验证项描述 | 期望结果 | 实际结果 | 结论 |
|---|---|---|---|:---:|
| `v9.REQ-001-AC-001` | 点击 LeftDock 组件库图标直达组件/插件管理页 | 切换 activeDockTab 为 components | 点击即进入 ComponentCenterView | **PASS** |
| `v9.REQ-001-AC-003` | 点击 Go Back 准确返回上一个主界面 | 返回 builder 或 home | 成功回到先前工作区 | **PASS** |
| 全量视觉验收 | 截取浅色、深色、安装状态、搜索与弹窗真实截图 | 生成并持久化截图证据 | 5 份真实截图存储在 reports/screenshots/ 目录 | **PASS** |

---

## 视觉回归截图证据清单

1. `01-v9-plugins-catalog-light.png`: 浅色模式下组件与插件中心全景
2. `02-v9-plugins-installed-state.png`: 一键安装 Stripe 与 Hugging Face 后的统计与已安装卡片
3. `03-v9-plugins-search.png`: 搜索框输入 "robo" 实时模糊过滤结果
4. `04-v9-plugins-add-modal.png`: 自定义添加外部 MCP 插件模态框
5. `05-v9-plugins-dark-mode.png`: 深色模式（Dark Mode）下的组件库视觉效果
