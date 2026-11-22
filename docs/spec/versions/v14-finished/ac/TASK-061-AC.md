# AC 验收单 · TASK-061

> 任务 ID: TASK-061  
> 任务名称: 目录安全防灾校验器 `isSafeProjectDirectory`（TDD）  
> 需求关联: `requirements.md` 中的 `v14.REQ-002` (AC-001)  
> 执行日期: 2026-11-23  

---

## 1. 验收项与测试命令

```bash
go test -v -run TestIsSafeProjectDirectory ./internal/app/...
```

## 2. 真实执行结果

```
=== RUN   TestIsSafeProjectDirectory
--- PASS: TestIsSafeProjectDirectory (0.00s)
PASS
ok  	buildui/internal/app	0.487s
```

## 3. 验收矩阵

| 验收条件 | 预期表现 | 实际结果 | 状态 |
|---|---|---|:---:|
| 空路径 / `.` / `..` 校验 | 判定为不安全，拒绝删除 | 判定返回 false | PASS |
| 系统根目录 `/` / 卷根 `C:\` | 判定为不安全，拒绝删除 | 判定返回 false | PASS |
| 用户主目录 `os.UserHomeDir()` | 判定为不安全，拒绝删除 | 判定返回 false | PASS |
| 当前工作目录 `os.Getwd()` 及父目录 | 判定为不安全，拒绝删除 | 判定返回 false | PASS |
| 系统根直属子目录 `/bin`, `/usr`, `/etc`, `/Users` 等 | 判定为不安全，拒绝删除 | 判定返回 false | PASS |
| 合法工程工作区目录 | 判定为安全，准予删除 | 判定返回 true | PASS |
