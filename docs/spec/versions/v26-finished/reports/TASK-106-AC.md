# TASK-106 验收标准与测试矩阵

## 任务目标
首页推荐预设卡片联动更新，消除黑色背景预设，编写 TDD 单元测试断言覆盖所有移动端新风格。

## 验收项清单

- [x] **AC-106-1**: `HomeGuideView.tsx` 中 App 预设卡片同步更新为浅色经典风格（iOS Modern Clean、Airbnb Mobile 等）。
- [x] **AC-106-2**: `styleExtractor.test.ts` 编写针对无黑色背景断言（对所有 `appType === 'app'` 的 preset 进行背景合法性校验）。
- [x] **AC-106-3**: `StyleCenterView.test.tsx` 更新断言新的经典 App 风格卡片渲染与筛选。

## 验收证据
- `npm test` 254 个测试全部通过。
- Playwright 真实运行截图：`02-v26-home-app-presets-sync.png`。
