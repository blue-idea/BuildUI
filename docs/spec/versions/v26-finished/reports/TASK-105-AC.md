# TASK-105 验收标准与测试矩阵

## 任务目标
补充 5 款经典高品质浅色移动端 App 设计系统模版，保留 Duolingo，满足多样化移动应用开发设计需求。

## 验收项清单

- [x] **AC-105-1**: 成功配置 `ios-clean` (iOS Modern Clean)，主色 `#007aff`，背景 `#f2f2f7`，表面 `#ffffff`。
- [x] **AC-105-2**: 成功配置 `airbnb-mobile` (Airbnb Mobile)，主色 `#ff385c`，背景 `#ffffff`，表面 `#f7f7f7`。
- [x] **AC-105-3**: 成功配置 `headspace-mobile` (Headspace Mindful)，主色 `#f47d31`，背景 `#fcf8f2`，表面 `#ffffff`。
- [x] **AC-105-4**: 成功配置 `revolut-mobile` (Revolut NeoBank)，主色 `#1969ff`，背景 `#f8f9fa`，表面 `#ffffff`。
- [x] **AC-105-5**: 成功配置 `notion-mobile` (Notion Mobile)，主色 `#2e3035`，背景 `#ffffff`，表面 `#f7f6f3`。
- [x] **AC-105-6**: 保留 `duolingo` (Duolingo Mobile)，主色 `#58cc02`，背景 `#ffffff`。

## 验收证据
- `styleExtractor.test.ts` 与 `StyleCenterView.test.tsx` 单元测试通过。
- Playwright 真实运行截图：`01-v26-app-classic-light-styles.png`。
