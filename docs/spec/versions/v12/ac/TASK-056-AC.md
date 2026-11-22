# TASK-056 博客首页订阅入口编辑验收

- `v12.REQ-004-AC-001` 构建规划收到非 JSON 时自动重试一次。重试成功后仅向执行步骤提供计划指定的源码。连续两次收到无效计划时返回错误，工作区、对话记录和检查点均无变更。
- `v2.REQ-002-AC-001` 在已建博客里提交「删除首页订阅按钮」，桌面页头、移动菜单和侧栏的订阅入口移除。首页订阅表单及登录、注册入口仍可用。

## 复现与验证

- 修复前在博客副本的 Wails 构建区发送原指令，真实模型在规划请求里只回复 `Completed 1 build step.`。构建器因响应缺少计划 JSON 而退出，首页订阅入口仍可见。[构建错误](../../../../../test-results/blog-build-edit/reproduced-build-error-2026-11-22T14-21-57-897Z.png)
- 回归测试以该原始响应启动构建。修复前只发出一次规划请求，两个子用例失败。修复后有效计划能修改页头，持续无效计划在第二次请求后结束。现有分步构建和跨服务重启恢复用例通过。
- 修复后使用备用真实模型从 Wails 构建区执行同一条指令，提交记录包含该轮修改，检查点清零。Playwright 验证桌面页面和移动菜单，实际博客副本通过 TypeScript 检查和 Vite 生产构建。[构建成功](../../../../../test-results/blog-build-edit/build-success-2026-11-22T14-35-03-370Z.png) · [基线](../../../../../test-results/blog-build-edit/blog-baseline-2026-11-22T14-28-03-278Z.png) · [修复后](../../../../../test-results/blog-build-edit/blog-after-2026-11-22T14-35-21-138Z.png) · [截图差异](../../../../../test-results/blog-build-edit/blog-diff.png) · [移动菜单](../../../../../test-results/blog-build-edit/blog-mobile-menu-2026-11-22T14-36-11-029Z.png)

## 执行结果

- 通过 `go test -cover -coverprofile test-results/blog-build-edit/go-coverage.out ./...` 和 `go vet ./...`。Go 语句覆盖率 71.7%，Agent 包 81.6%。
- 通过 `pnpm --dir frontend test --coverage`、`pnpm run lint` 和 `pnpm run typecheck`。Vitest 通过 191 项测试，语句覆盖率 76.64%。
- BLOCKED 原模型服务商在修复后复验时返回 HTTP 503，备用真实模型端到端通过。
- BLOCKED 当前 Windows 环境没有可用的 cgo C 编译器，`go test -race` 无法启动。
