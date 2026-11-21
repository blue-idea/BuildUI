# 架构与系统设计说明书（Design）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/design.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：就绪（Ready for Review）  
> 选型基准：Wails v2 + React 19 + TypeScript + Tailwind CSS  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 架构演进全景

Blot-UI v6 重构前端视图层为 macOS 工业级三栏式容器架构，并引入双模主题引擎与双语 i18n 响应式上下文：

```mermaid
graph TD
    subgraph AppRoot [App.tsx 根容器]
        I18nProvider[I18n Context / zh-CN & en-US]
        ThemeProvider[Theme Context / light & dark]
        WindowFrame[macOS 窗口容器 / Traffic Lights]
    end

    subgraph WindowHeader [顶部窗口与全局栏]
        TrafficLights[红黄绿交通灯]
        AppTabs[项目标签页 + Manage App]
        HeaderRight[语言切换 EN/中 + 主题切换 ☀/☾ + Pro 徽章]
    end

    subgraph MainWorkbench [主工作台三栏布局]
        LeftDock[左侧微坞 LeftDock.tsx / 7个操作图标]
        ChatColumn[会话与任务列 ChatColumn.tsx]
        PreviewColumn[工作区容器 WorkspacePanel.tsx]
    end

    subgraph ChatColumnSub [ChatColumn 内部结构]
        ChatHeader[New Chat + Version 1 下拉]
        ChatFeed[消息流 + FileChangeCard 进度卡片]
        ChatInput[多模态富输入框 / Build·Plan + Model + 附件 + 发送]
    end

    subgraph PreviewColumnSub [WorkspacePanel 内部结构]
        SegmentedTabs[👁 Preview / <> Code / 🌐 Publish]
        BrowserBar[拟真浏览器地址栏 ← → ⎋ / ↻]
        CanvasArea[预览 Iframe / 代码高亮 / 发布导出]
        SystemDrawer[底部可折叠 System Messages 抽屉]
    end

    AppRoot --> WindowFrame
    WindowFrame --> WindowHeader
    WindowFrame --> MainWorkbench

    MainWorkbench --> LeftDock
    MainWorkbench --> ChatColumn
    MainWorkbench --> PreviewColumn

    ChatColumn --> ChatHeader
    ChatColumn --> ChatFeed
    ChatColumn --> ChatInput

    PreviewColumn --> SegmentedTabs
    PreviewColumn --> BrowserBar
    PreviewColumn --> CanvasArea
    PreviewColumn --> SystemDrawer
```

---

## 2. 配色系统与 macOS 设计规范 (Design Tokens)

### 2.1 浅色模式 (macOS Light Mode)
- **Window Surface**: `#ffffff` / `bg-white`
- **Window Chrome / Titlebar**: `#f5f5f7` (macOS 系统浅灰)
- **Border / Dividers**: `#e5e5ea` / `border-slate-200`
- **Left Dock Background**: `#f8f9fa`
- **User Message Bubble**: `#e8e5ff` (淡紫色优雅气泡), 文本 `#2c246b`
- **Assistant Message Card**: `#ffffff` 纯白卡片，带 `#e2e8f0` 细微边框与 `shadow-sm`
- **File Card Hover**: `hover:border-blue-400 hover:shadow-md`
- **Accent Purple Active**: `#7c3aed` / `bg-purple-600/10 text-purple-600`

### 2.2 深色模式 (macOS Dark Mode)
- **Window Surface**: `#18181b` (Zinc 900)
- **Window Chrome / Titlebar**: `#121215` (Zinc 950 极深灰)
- **Border / Dividers**: `#27272a` / `border-zinc-800`
- **Left Dock Background**: `#111114`
- **User Message Bubble**: `#312e81/70` (深紫外光感气泡), 文本 `#e0e7ff`
- **Assistant Message Card**: `#1e1e24` 磨砂暗色，带 `#3f3f46/40` 微描边
- **File Card Hover**: `hover:border-purple-500/50 hover:bg-zinc-900`
- **Accent Purple Active**: `#a78bfa` / `bg-purple-500/20 text-purple-300`

---

## 3. 核心时序图：多语言与主题联动

```mermaid
sequenceDiagram
    autonumber
    participant User as 用户
    participant Header as WindowHeader
    participant I18n as I18n Context
    participant Theme as Theme Context
    participant Views as Workbench Views

    User->>Header: 点击 "中 / EN"
    Header->>I18n: setLocale(locale === 'en' ? 'zh' : 'en')
    I18n-->>Views: 触发全局词条即时替换 (t('...'))
    User->>Header: 点击 "☀ / ☾"
    Header->>Theme: setTheme(theme === 'dark' ? 'light' : 'dark')
    Theme-->>Views: 动态切换根 DOM class ('dark' <-> 'light')
    Note over Views: 零页面重载、零输入丢失完成全套视觉刷新
```
