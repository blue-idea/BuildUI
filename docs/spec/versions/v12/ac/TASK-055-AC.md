# TASK-055 · 验收矩阵

| AC | 测试类型 | 实际结果 | 状态 | 证据 |
|---|---|---|---|---|
| v12.REQ-004-AC-001 | Go 集成、Wails E2E | 三步 SaaS 先规划再分次请求。定价请求携带首页源码，首页完成后保存 1/3。 | PASS | [规划截图](../reports/screenshots/staged-build/planning-baseline.png) |
| v12.REQ-004-AC-002 | Go 集成、React 组件、Wails E2E | 定价首次返回 503。重启后显示 1/3，点击续建直接发起定价请求。规划与首页各调用一次。 | PASS | [重启截图](../reports/screenshots/staged-build/restart-resume.png) · [差异](../reports/screenshots/staged-build/resume-diff.png) |
| v12.REQ-004-AC-003 | Go 集成、Wails E2E | 试用步骤内补齐未闭合的写入工具。检查点清除，初始版本后新增一次构建提交，定价和试用交互可用。 | PASS | [SaaS 交互截图](../reports/screenshots/staged-build/saas-interaction.png) |

Go 集成测试入口为 `TestStagedSaaSBuildResumesAfterAServiceRestart`。React 组件测试覆盖已保存进度和 `resume: true` 请求。完整记录见 [测试报告](../reports/TASK-055-report.md)。
