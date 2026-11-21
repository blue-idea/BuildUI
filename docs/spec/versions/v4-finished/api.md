# IPC 与服务接口契约（API Contract）· Blot-UI v4

> 文件路径：`docs/spec/versions/v4/api.md`  
> 规范版本：v4 · 日期：2026-11-21  
> 状态：就绪（Ready for Review）  
> 选型基准：Wails v2 IPC / Go Methods & Event Emitter  

---

## 1. Wails RPC 接口声明

### 1.1 依赖安装服务 `InstallDependencies`

```go
// InstallDependencies 安全校验待安装依赖包并在指定应用工作区异步执行安装
// appId: 应用唯一标识
// packages: 待安装包名列表 (支持带语义化版本号，如 ["lucide-react@^1.0.0", "canvas-confetti"])
func (a *App) InstallDependencies(appId int64, packages []string) error
```

### 1.2 主题预设获取 `GetThemePresets`

```go
type ThemePreset struct {
    ID          string `json:"id"`
    Name        string `json:"name"`
    Description string `json:"description"`
    Primary     string `json:"primary"`
    Background  string `json:"background"`
    Surface     string `json:"surface"`
    Text        string `json:"text"`
    Border      string `json:"border"`
}

// GetThemePresets 返回系统支持的全部内置主题配置
func (a *App) GetThemePresets() []ThemePreset
```

### 1.3 应用主题更新与持久化 `SetAppTheme`

```go
// SetAppTheme 更新指定应用当前选用的主题并持久化到 SQLite blueprints
func (a *App) SetAppTheme(appId int64, themeId string) error
```

---

## 2. 跨沙箱 postMessage 事件契约

```typescript
// 主界面向预览 Iframe 发送动态主题注入消息
interface ThemeInjectMessage {
  type: 'THEME_INJECT';
  themeId: string;
  tokens: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
}
```
