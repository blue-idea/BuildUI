# IPC 与服务接口契约（API Contract）· Blot-UI v5

> 文件路径：`docs/spec/versions/v5/api.md`  
> 规范版本：v5 · 日期：2026-11-21  
> 状态：就绪（Ready for Review）  
> 选型基准：Wails v2 IPC / Go Methods  

---

## 1. Wails RPC 接口声明

### 1.1 获取内置应用模版清单 `GetAppTemplates`

```go
type AppTemplate struct {
    ID          string   `json:"id"`
    Name        string   `json:"name"`
    Description string   `json:"description"`
    Category    string   `json:"category"`
    Tags        []string `json:"tags"`
    Icon        string   `json:"icon"`
    ThemeID     string   `json:"themeId"`
}

// GetAppTemplates 返回全部系统支持的预置模版定义
func (a *App) GetAppTemplates() []template.AppTemplate
```

### 1.2 从模版一键新建应用 `CreateAppFromTemplate`

```go
type CreateFromTemplateRequest struct {
    TemplateID string `json:"templateId"`
    AppName    string `json:"appName"`
    DestPath   string `json:"destPath"`
}

// CreateAppFromTemplate 根据指定模版初始化文件目录、注册应用并返回应用元数据
func (a *App) CreateAppFromTemplate(req template.CreateFromTemplateRequest) (*app.CreateAppResponse, error)
```

---

## 2. 前端 Command Palette 接口定义

```typescript
export interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Theme' | 'App' | 'Action';
  shortcut?: string;
  run: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}
```
