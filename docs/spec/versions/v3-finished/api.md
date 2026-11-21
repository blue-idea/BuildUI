# Wails 接口与通信契约说明书（API）· Blot-UI v3

> 文件路径：`docs/spec/versions/v3/api.md`  
> 规范版本：v3 · 日期：2026-11-21  
> 关联设计：[design.md](design.md)  
> 继承规则：`docs/spec/steering/` 与 `docs/spec/versions/v1-finished/api.md`  
> 核心架构：Wails v2 (Go 1.26+) + React 19 + TypeScript

---

## 1. Wails 通信接口演进

v3 在已有应用构建、大模型流式通信与版本时光机方法基础上，新增多应用抽屉切换、组件审查定位和工程一键导出三组核心 RPC 方法：

```
App (Wails Bindings)
├── AppService
│   ├── SwitchApp(appID int64) (*ActiveAppResponse, error)
│   ├── DeleteApp(appID int64) error
│   └── GetActiveApp() (*ActiveAppResponse, error)
├── ExportService
│   ├── ExportAppZip(appID int64, destPath string) (string, error)
│   └── OpenInFileManager(targetPath string) error
└── ComponentInspectorService
    └── ResolveComponent(req ResolveComponentRequest) (*ResolvedComponentResponse, error)
```

---

## 2. 详细方法契约与 DTO 定义

### 2.1 多应用切换与管理接口

#### 1. 切换活动应用 (`SwitchApp`)
- **Go 方法签名**：
  ```go
  func (a *App) SwitchApp(appID int64) (*ActiveAppResponse, error)
  ```
- **请求参数**：`appID int64`
- **响应参数 (`ActiveAppResponse`)**：
  ```go
  type ActiveAppResponse struct {
      AppID             int64  `json:"appId"`
      Name              string `json:"name"`
      Path              string `json:"path"`
      PreviewURL        string `json:"previewUrl"`
      LatestCommitHash  string `json:"latestCommitHash"`
      BlueprintApproved bool   `json:"blueprintApproved"`
  }
  ```
- **行为**：停止当前正在运行的开发服务器，切换活动应用指针，重新加载目标工程对应的蓝图状态与最近会话。

#### 2. 删除非活动应用 (`DeleteApp`)
- **Go 方法签名**：
  ```go
  func (a *App) DeleteApp(appID int64) error
  ```
- **错误场景**：
  - 若 `appID` 为当前活跃应用，返回 `KindPrecondition` 错误；
  - 若应用不存在，返回 `KindNotFound` 错误。

---

### 2.2 可视化组件定位审查接口 (`ComponentInspector`)

#### 1. 解析元素对应源码组件 (`ResolveComponent`)
- **Go 方法签名**：
  ```go
  func (a *App) ResolveComponent(req ResolveComponentRequest) (*ResolvedComponentResponse, error)
  ```
- **请求参数 (`ResolveComponentRequest`)**：
  ```go
  type ResolveComponentRequest struct {
      AppID        int64  `json:"appId"`
      TagName      string `json:"tagName"`
      ClassName    string `json:"className"`
      ElementText  string `json:"elementText"`
      DataPath     string `json:"dataPath"` // 可选 data-component-path
  }
  ```
- **响应参数 (`ResolvedComponentResponse`)**：
  ```go
  type ResolvedComponentResponse struct {
      ComponentPath string `json:"componentPath"` // 如 "src/components/Header.tsx"
      ComponentName string `json:"componentName"` // 如 "Header"
      SuggestedPrompt string `json:"suggestedPrompt"` // 如 "@src/components/Header.tsx: "
  }
  ```

---

### 2.3 工程导出与文件管理器定位接口 (`ExportService`)

#### 1. 导出工程为 Zip 包 (`ExportAppZip`)
- **Go 方法签名**：
  ```go
  func (a *App) ExportAppZip(appID int64, destPath string) (string, error)
  ```
- **行为**：
  - 递归打包目标应用工作区目录；
  - 严格过滤排除 `.git/`, `node_modules/`, `dist/` 与临时构建缓存；
  - 输出为标准的压缩包文件（若 `destPath` 为空，默认写入用户下载目录或系统临时输出目录），返回最终的绝对路径。

#### 2. 唤起系统原生文件管理器 (`OpenInFileManager`)
- **Go 方法签名**：
  ```go
  func (a *App) OpenInFileManager(targetPath string) error
  ```
- **跨平台实现**：
  - Windows: `explorer.exe /select,"<targetPath>"`
  - macOS: `open -R "<targetPath>"`
  - Linux: `xdg-open "<dir>"`
