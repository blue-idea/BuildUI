# 架构与系统设计说明书（Design）· Blot-UI v4

> 文件路径：`docs/spec/versions/v4/design.md`  
> 规范版本：v4 · 日期：2026-11-21  
> 状态：就绪（Ready for Review）  
> 选型基准：Wails v2 + React 19 + TypeScript + Go 1.26 + SQLite + Git CLI  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 架构演进全景

Blot-UI v4 在现有微内核架构上扩展**动态依赖管理服务（DependencyManager）**与**双向 UI 主题预设引擎（ThemeEngine）**：

```mermaid
graph TD
    subgraph Frontend [React 19 + TypeScript 前端架构]
        AppUI[App.tsx 主工作区]
        ThemeSelector[ThemeSelector.tsx 顶部主题下拉切换]
        ChatArea[ChatStream.tsx 依赖安装进度指示]
        PreviewArea[PreviewPanel.tsx 实时 Iframe 容器]
        ThemeInjector[theme-injector.ts 跨沙箱 postMessage]
    end

    subgraph WailsBridge [Wails IPC 桥接层 app.go]
        ThemeMethods[GetThemePresets / SetAppTheme]
        DepMethods[InstallDependencies]
        EventBus[runtime.EventsEmit / EventsOn]
    end

    subgraph BackendCore [Go 后端核心微服务]
        DepService[internal/agent / DependencyManager & Sanitizer]
        RunnerService[internal/app/runner / DevServer & PackageInstaller]
        ThemeService[internal/theme / ThemeService]
        Storage[internal/db / SQLite (blueprints, apps)]
    end

    AppUI --> ThemeSelector
    AppUI --> ChatArea
    AppUI --> PreviewArea
    ThemeSelector --> ThemeInjector
    ThemeInjector -. postMessage: THEME_INJECT .-> PreviewArea
    ThemeSelector --> ThemeMethods

    ChatArea --> DepMethods
    DepMethods --> DepService
    DepService --> RunnerService
    RunnerService -. EventsEmit: dep_install_progress .-> EventBus
    EventBus -. 实时进度 .-> ChatArea

    ThemeMethods --> ThemeService
    ThemeService --> Storage
```

---

## 2. 核心执行时序图

### 2.1 智能第三方依赖提取与沙箱异步安装时序

```mermaid
sequenceDiagram
    autonumber
    participant LLM as LLM Stream
    participant Parser as XMLStreamParser
    participant DepMgr as DependencyManager
    participant Runner as AppRunner (pnpm)
    participant IPC as Wails EventsEmit
    participant UI as React UI (ChatStream)
    participant Preview as Preview Iframe

    LLM->>Parser: 产生 <boltAction type="add_dependency">lucide-react</boltAction>
    Parser->>DepMgr: ExtractAndValidatePackages(["lucide-react"])
    DepMgr->>DepMgr: PackageSanitizer (白名单与防注入正则校验)
    DepMgr->>Runner: InstallDependencies(workspacePath, packages)
    Runner->>IPC: EventsEmit("dep_install_started", "Installing lucide-react...")
    IPC->>UI: 渲染安装动效卡片
    Runner->>Runner: 异步执行 `pnpm add lucide-react`
    Runner->>IPC: EventsEmit("dep_install_success", "lucide-react installed")
    IPC->>UI: 更新状态为“安装成功”
    Runner->>Preview: Vite 热更新机制触发热刷新 (HMR)
```

---

### 2.2 UI 视觉主题预设与沙箱零刷新注入时序

```mermaid
sequenceDiagram
    autonumber
    participant User as 用户
    participant Header as ThemeSelector (UI)
    participant HostDOM as Host Document (:root)
    participant Bridge as app.go (Wails IPC)
    participant Storage as SQLite (blueprints)
    participant Preview as Preview Iframe (:root)

    User->>Header: 点击切换主题为 "cyberpunk-neon"
    Header->>HostDOM: 动态修改宿主 CSS 类与自定义属性
    Header->>Bridge: SetAppTheme(appId, "cyberpunk-neon")
    Bridge->>Storage: UPDATE blueprints SET theme_id = 'cyberpunk-neon'
    Header->>Preview: postMessage({ type: 'THEME_INJECT', tokens: {...} }, '*')
    Preview->>Preview: 更新内部 iframe 的 CSS 变量 (--primary, --bg, etc.)
    Note over Preview: 零白屏、零重新加载完成实时变色
```

---

## 3. 容错与防御策略

1. **依赖包名防命令注入（Sanitization Defense）**：
   - 包名必须符合严格白名单，拒绝任何包含 `&`, `|`, `;`, `$`, `` ` ``, `\`, `/../` 的非法字符；
   - 依赖安装使用 Go 原生 `exec.CommandContext` 传参，严禁字符串拼接传递给 shell。
2. **多线程并发安全与 Vite 冲突保护**：
   - 依赖安装执行期间加互斥锁，避免针对同一个应用同时触发多个并发 `pnpm add` 导致锁文件竞争；
   - 安装失败不污染当前工作区已正常运行的前端进程。
