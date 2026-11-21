# AC 验收矩阵（Acceptance Criteria Matrix）· TASK-017

> 文件路径：`docs/spec/versions/v4/ac/TASK-017-AC.md`  
> 规范版本：v4  
> 任务编号：TASK-017  
> 任务名称：智能第三方依赖提取、白名单安全校验与沙箱异步安装服务  
> 执行日期：2026-11-21  
> 执行人：Agent (TDD / SDD 自动化执行)  

---

## 验收结果

| TASK ID | AC ID | QA 类型 | 实际结果摘要 | 状态 | 证据 | 错误详情 |
|:---:|:---:|:---:|:---|:---:|:---|:---:|
| TASK-017 | `v4.REQ-001-AC-001` | Unit | `ValidatePackageName` 与 `SanitizePackages` 严格校验 npm 标准包名及 scope 格式，过滤恶意 shell 注入字符与非法路径 | `PASS` | `internal/agent/dependency_test.go` | — |
| TASK-017 | `v4.REQ-001-AC-002` | Unit / Integration | `DependencyManager.EnsureDependencies` 校验提取缺失依赖，调用 `pnpm add` 执行沙箱安装，避免重复安装已存在包 | `PASS` | `internal/agent/dependency_test.go` | — |
| TASK-017 | `v4.REQ-001-AC-003` | Unit / Desktop | `App.InstallDependencies` Wails RPC 接口实现，支持传递应用 ID 与包名列表，发射生命周期事件与错误处理 | `PASS` | `app_test.go` | — |

---

## 测试命令与真实执行记录

```bash
go test -v -count=1 . ./internal/agent/...
# 输出:
# === RUN   TestApp_SelectDirectory
# --- PASS: TestApp_SelectDirectory (0.00s)
# === RUN   TestApp_InstallDependencies
# --- PASS: TestApp_InstallDependencies (0.00s)
# PASS
# ok      buildui 0.799s
# === RUN   TestDependencyManager_EnsureDependencies
# --- PASS: TestDependencyManager_EnsureDependencies (0.00s)
# === RUN   TestDependencyManager_ValidationAndSanitization
# --- PASS: TestDependencyManager_ValidationAndSanitization (0.00s)
# PASS
# ok      buildui/internal/agent  1.261s
```
