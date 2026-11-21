# 架构与系统设计说明书（Design）· Blot-UI v6

> 文件路径：`docs/spec/versions/v6/design.md`  
> 规范版本：v6 · 日期：2026-11-21  
> 状态：就绪（Ready for Review）  
> 选型基准：Wails v2 + React 19 + TypeScript + Tailwind CSS  
> 官方源码参考：[https://github.com/dyad-sh/dyad](https://github.com/dyad-sh/dyad)

---

## 1. 架构演进全景

Blot-UI v6 在前端工程中引入 **macOS 主题引擎（ThemeContext）** 与 **轻量国际化体系（I18nContext）**：

```mermaid
graph TD
    subgraph HostFrontend [React 19 宿主桌面应用]
        ThemeContext[ThemeContext: light / dark / system]
        I18nContext[I18nContext: en / zh 字典管理]
        TitleBar[TitleBar.tsx: macOS 红黄绿交通灯 + 统揽栏]
        CommandPalette[CommandPalette.tsx: 命令面板]
        AppUI[App.tsx 主分栏工作区]
        PreviewContainer[PreviewPanel.tsx 实时沙箱]
    end

    subgraph DesignTokens [macOS 视觉令牌库]
        LightTokens[Light: #f5f5f7 / #ffffff / #0071e3]
        DarkTokens[Dark: #1c1c1e / #2c2c2e / #0a84ff]
    end

    subgraph Locales [双语本地化资源库]
        LocEN[en.ts: 完整英文词条]
        LocZH[zh.ts: 完整中文词条]
    end

    ThemeContext --> LightTokens
    ThemeContext --> DarkTokens
    I18nContext --> LocEN
    I18nContext --> LocZH

    ThemeContext --> AppUI
    I18nContext --> AppUI
    AppUI --> TitleBar
    AppUI --> CommandPalette
    AppUI --> PreviewContainer
```

---

## 2. macOS 视觉规范与 Token 映射

| 语义分类 | macOS 浅色 (Light Mode) | macOS 深色 (Dark Mode) | 说明 |
|:---|:---|:---|:---|
| **Window Background** | `#f5f5f7` (macOS 系统浅灰) | `#1c1c1e` (macOS Space Gray) | 窗口最底层背景 |
| **Surface / Card** | `rgba(255, 255, 255, 0.85)` | `rgba(44, 44, 46, 0.8)` | 半透明卡片表面 |
| **Header Toolbar** | `rgba(255, 255, 255, 0.7)` | `rgba(28, 28, 30, 0.75)` | 磨砂毛玻璃高斯模糊 (`backdrop-blur-xl`) |
| **Border / Divider** | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.12)` | 超细柔和微边框 |
| **Text Primary** | `#1d1d1f` (SF Pro Black) | `#f5f5f7` (SF Pro White) | 主标题与核心内容 |
| **Text Muted** | `#86868b` (SF Pro Gray) | `#98989d` (SF Pro Dark Gray) | 辅助描述与标签 |
| **System Accent** | `#0071e3` (Apple Royal Blue) | `#0a84ff` (Apple Neon Blue) | 重点按键与活跃高亮 |
| **Traffic Lights** | Close `#ff5f56`, Min `#ffbd2e`, Max `#27c93f` | Close `#ff5f56`, Min `#ffbd2e`, Max `#27c93f` | 经典三色交通灯点 |

---

## 3. 国际化与双模切换执行时序

```mermaid
sequenceDiagram
    autonumber
    participant User as 用户
    participant Toolbar as TitleBar (Controls)
    participant ThemeCtx as ThemeContext
    participant I18nCtx as I18nContext
    participant DOM as Document Root (HTML/Body)
    participant Preview as Preview Iframe

    User->>Toolbar: 点击切换深浅主题
    Toolbar->>ThemeCtx: setThemeMode("light" | "dark")
    ThemeCtx->>DOM: 切换 'dark' class & CSS 变量
    ThemeCtx->>Preview: postMessage({ type: 'THEME_INJECT', mode })

    User->>Toolbar: 点击切换语言 (EN ↔ 中文)
    Toolbar->>I18nCtx: setLocale("zh" | "en")
    I18nCtx->>I18nCtx: 触发响应式重绘，各组件即时渲染对应字典词条
```
