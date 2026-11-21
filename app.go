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
	"buildui/internal/verification/tsc"
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
