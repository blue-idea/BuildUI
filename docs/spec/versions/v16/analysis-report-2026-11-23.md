# 规格审查分析报告（Analysis Report）· Blot-UI v16

> 文件路径：`docs/spec/versions/v16/analysis-report-2026-11-23.md`  
> 规范版本：v16 · 日期：2026-11-23  
> 审查对象：`requirements.md`、`design.md`  

---

## 1. 需求与设计一致性审查

| 需求项 | 验收标准 | 对应设计方案 | 状态 | 评估说明 |
|---|---|---|:---:|---|
| `v16.REQ-001` | AC-001: CreateApp 动态查询 workspace.dir | `AppService.GetWorkspaceRoot` 动态查询 settings 表 | 通过 | 完全覆盖，解耦硬编码路径 |
| `v16.REQ-001` | AC-002: SaveSettings 实时同步 | `app.go` 在保存设置后同步刷新 `a.appService.SetWorkspaceRoot` | 通过 | 消除无需重启即刻生效的延迟 |
| `v16.REQ-001` | AC-003: 启动恢复持久化偏好 | `app.go` 的 `startup` 从 `settingsRepo` 初始化根路径 | 通过 | 保证跨重启偏好持久化 |
| `v16.REQ-001` | AC-004: CreateAppFromTemplate 路径自动解析 | `DestPath` 缺省时调用 `GetWorkspaceRoot` 拼装 | 通过 | 补齐模版初始化缺省路径逻辑 |
| `v16.REQ-002` | AC-001: 抽屉新建项目接入桌面端真实创建 | `App.tsx` 为 `AppDrawer` 注入 `onCreateNamedApp` | 通过 | 解决抽屉新建项目只走 mock 的问题 |
| `v16.REQ-002` | AC-002: 非桌面模拟路径同步更新 | `onCreateApp` 优先读取 `settings['workspace.dir']` | 通过 | 保持双模一致性 |

---

## 2. 审查结论

规格设计完备，无冲突与未定义行为，准予进入任务拆分与 TDD 开发。
