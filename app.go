package main

import (
	"context"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"buildui/internal/agent"
	"buildui/internal/app"
	"buildui/internal/app/runner"
	"buildui/internal/blueprint"
	"buildui/internal/db"
	"buildui/internal/settings"
	"buildui/internal/verification/tsc"
	"buildui/internal/version"
)

// wailsEventEmitter 适配 Wails runtime.EventsEmit
type wailsEventEmitter struct {
	ctx context.Context
}

func (w *wailsEventEmitter) Emit(eventName string, optionalData ...interface{}) {
	if w.ctx != nil {
		runtime.EventsEmit(w.ctx, eventName, optionalData...)
	}
}

// App Wails 应用主结构体
type App struct {
	ctx              context.Context
	db               *db.DB
	appRepo          *db.AppRepository
	chatRepo         *db.ChatRepository
	bpRepo           *db.BlueprintRepository
	appService       *app.AppService
	blueprintService *blueprint.BlueprintService
	chatService      *agent.ChatService
	problemsService  *tsc.ProblemsService
	settingsService  *settings.SettingsService
	versionService   *version.VersionService
}

// NewApp 创建 App 实例
func NewApp() *App {
	return &App{}
}

// startup 在应用启动时调用
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// 确定数据存储目录（默认在用户配置目录下的 buildui 目录）
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "."
	}
	appDataDir := filepath.Join(configDir, "buildui")
	_ = os.MkdirAll(appDataDir, 0755)

	dbPath := filepath.Join(appDataDir, "buildui.db")
	database, err := db.Open(ctx, dbPath)
	if err == nil {
		a.db = database
		a.appRepo = db.NewAppRepository(database)
		a.chatRepo = db.NewChatRepository(database)
		a.bpRepo = db.NewBlueprintRepository(database)
		versionRepo := db.NewVersionRepository(database)

		emitter := &wailsEventEmitter{ctx: ctx}
		a.appService = app.NewAppService(a.appRepo, database)
		a.appService.SetRunner(runner.NewAppRunner(emitter))
		a.blueprintService = blueprint.NewBlueprintService(a.bpRepo, a.appRepo, database)
		a.blueprintService.SetEmitter(emitter)
		a.chatService = agent.NewChatService(a.chatRepo, a.appRepo, a.blueprintService, emitter)
		a.chatService.SetVersionRepo(versionRepo)
		a.problemsService = tsc.NewProblemsService(a.appRepo, nil)
		settingsRepo := db.NewSettingsRepository(database)
		a.settingsService = settings.NewSettingsService(settingsRepo)
		a.versionService = version.NewVersionService(versionRepo, a.appRepo, emitter)
	}
}

// shutdown 在应用退出时调用
func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		_ = a.db.Close()
	}
}

// CreateApp 暴露给前端的 Wails RPC 方法
func (a *App) CreateApp(req app.CreateAppRequest) (*app.CreateAppResponse, error) {
	return a.appService.CreateApp(a.ctx, req)
}

// ListApps 暴露给前端的 Wails RPC 方法
func (a *App) ListApps() ([]app.AppDTO, error) {
	return a.appService.ListApps(a.ctx)
}

// GetBlueprint 暴露给前端的获取蓝图 RPC 方法
func (a *App) GetBlueprint(chatID int64) (*blueprint.BlueprintDTO, error) {
	return a.blueprintService.GetBlueprint(a.ctx, chatID)
}

// ApproveBlueprint 暴露给前端的审批蓝图 RPC 方法
func (a *App) ApproveBlueprint(chatID int64) error {
	return a.blueprintService.ApproveBlueprint(a.ctx, chatID)
}

// StreamChat 暴露给前端的会话流式交互 RPC 方法
func (a *App) StreamChat(req agent.StreamChatRequest) error {
	return a.chatService.StreamChat(a.ctx, req)
}

// CancelChat 暴露给前端的中止流式生成 RPC 方法
func (a *App) CancelChat(chatID int64) error {
	if a.chatService == nil {
		return nil
	}
	return a.chatService.CancelChat(chatID)
}

// CheckTypeScript 暴露给前端的 TypeScript 编译问题诊断 RPC 方法
func (a *App) CheckTypeScript(req tsc.CheckTypeScriptRequest) (*tsc.ProblemsResponse, error) {
	return a.problemsService.CheckTypeScript(a.ctx, req)
}

// RunApp 暴露给前端的启动应用开发服务器 RPC 方法
func (a *App) RunApp(req runner.RunAppRequest) (*runner.RunAppResponse, error) {
	return a.appService.RunApp(a.ctx, req)
}

// StopApp 暴露给前端的停止应用开发服务器 RPC 方法
func (a *App) StopApp(req runner.StopAppRequest) error {
	return a.appService.StopApp(a.ctx, req)
}

// GetSettings 暴露给前端的获取系统配置 RPC 方法
func (a *App) GetSettings() (map[string]string, error) {
	if a.settingsService == nil {
		return map[string]string{}, nil
	}
	return a.settingsService.GetSettings(a.ctx)
}

// SaveSettings 暴露给前端的保存系统配置 RPC 方法
func (a *App) SaveSettings(cfg map[string]string) error {
	if a.settingsService == nil {
		return nil
	}
	return a.settingsService.SaveSettings(a.ctx, cfg)
}

// TestLLMConnection 暴露给前端的测试 LLM 连通性 RPC 方法
func (a *App) TestLLMConnection(baseURL, apiKey, model string) error {
	if a.settingsService == nil {
		return nil
	}
	return a.settingsService.TestConnection(a.ctx, baseURL, apiKey, model)
}

// GetVersions 暴露给前端的获取版本时间线 RPC 方法
func (a *App) GetVersions(appID int64) ([]version.VersionDTO, error) {
	if a.versionService == nil {
		return []version.VersionDTO{}, nil
	}
	return a.versionService.ListVersions(a.ctx, appID)
}

// GetVersionDiff 暴露给前端的获取版本差异 RPC 方法
func (a *App) GetVersionDiff(appID int64, commitHash string) (*version.VersionDiffResult, error) {
	if a.versionService == nil {
		return nil, nil
	}
	return a.versionService.GetVersionDiff(a.ctx, appID, commitHash)
}

// RollbackVersion 暴露给前端的时光机一键回滚 RPC 方法
func (a *App) RollbackVersion(appID int64, commitHash string) error {
	if a.versionService == nil {
		return nil
	}
	return a.versionService.RollbackVersion(a.ctx, appID, commitHash)
}

// SelectDirectory 暴露给前端唤起原生操作系统目录选择器的 RPC 方法
func (a *App) SelectDirectory(title string) (string, error) {
	if a.ctx == nil {
		return "", nil
	}
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
}
