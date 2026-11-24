# TASK-104 验收标准与测试矩阵

## 任务目标
彻底移除 `styleExtractor.ts` 中所有背景为纯黑或接近黑色的移动端 App 风格模版。

## 验收项清单

- [x] **AC-104-1**: `ios-health` (Apple Health) 模版已被完全移除。
- [x] **AC-104-2**: `threads` (Threads Mobile) 模版已被完全移除。
- [x] **AC-104-3**: `cashapp` (Cash App Mobile) 模版已被完全移除。
- [x] **AC-104-4**: 所有留存与新增的 `appType === 'app'` 模版其背景色均非黑色（`#000000`, `#101010` 等）。

## 验收证据
- `styleExtractor.test.ts` 自动化断言：`expect(iosHealth).toBeUndefined()`, `expect(threads).toBeUndefined()`, `expect(cashapp).toBeUndefined()`。
- 背景非黑校验断言 100% 通过。
