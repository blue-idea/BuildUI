package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"buildui/internal/agent"
	"buildui/internal/app"
	"buildui/internal/app/runner"
	"buildui/internal/blueprint"
	"buildui/internal/config"
	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/export"
	"buildui/internal/inspector"
	"buildui/internal/plugins"
	"buildui/internal/settings"
	"buildui/internal/template"
	"buildui/internal/theme"
	"buildui/internal/updater"
	"buildui/internal/verification/tsc"
	"buildui/internal/version"
	"buildui/internal/workspace"
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
	messageRepo      *db.MessageRepository
	bpRepo           *db.BlueprintRepository
	appService       *app.AppService
	blueprintService *blueprint.BlueprintService
	chatService      *agent.ChatService
	problemsService  *tsc.ProblemsService
	settingsService  *settings.SettingsService
	versionService   *version.VersionService
	themeService     *theme.ThemeService
	updaterService   *updater.Service
	pluginService    *plugins.Service
}

// NewApp 创建 App 实例
func NewApp() *App {
	return &App{}
}

// GetAppDataDir 获取应用数据存储目录
func GetAppDataDir() string {
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "."
	}
	appDataDir := filepath.Join(configDir, "buildui")
	if devDataDir := os.Getenv("BLOT_DEV_USER_DATA_DIR"); devDataDir != "" {
		appDataDir = devDataDir
	}
	return appDataDir
}

// GetInitialWindowSize 读取数据库中持久化的启动窗口尺寸
func (a *App) GetInitialWindowSize() (int, int) {
	appDataDir := GetAppDataDir()
	dbPath := filepath.Join(appDataDir, "buildui.db")
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		return config.DefaultWindowWidth, config.DefaultWindowHeight
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	database, err := db.Open(ctx, dbPath)
	if err != nil {
		return config.DefaultWindowWidth, config.DefaultWindowHeight
	}
	defer database.Close()

	settingsRepo := db.NewSettingsRepository(database)
	allSettings, err := settingsRepo.GetAll(ctx)
	if err != nil {
		return config.DefaultWindowWidth, config.DefaultWindowHeight
	}

	size := settings.ResolveStartupWindowSize(allSettings)
	return size.Width, size.Height
}

// SaveWindowSize 保存当前窗口尺寸（当开启记忆时生效）
func (a *App) SaveWindowSize(width, height int) error {
	if a.settingsService == nil {
		return nil
	}
	ctx := a.ctx
	if ctx == nil {
		ctx = context.Background()
	}
	allSettings, err := a.settingsService.GetSettings(ctx)
	if err != nil {
		return err
	}
	if !settings.ShouldRememberWindowSize(allSettings) {
		return nil
	}
	size, valid := settings.ValidateAndNormalizeWindowSize(width, height)
	if !valid {
		return nil
	}
	return a.settingsService.SaveSettings(ctx, map[string]string{
		config.KeyWindowWidth:  strconv.Itoa(size.Width),
		config.KeyWindowHeight: strconv.Itoa(size.Height),
	})
}

// beforeClose 在应用退出或关闭窗口时触发生命周期钩子
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	targetCtx := ctx
	if targetCtx == nil {
		targetCtx = a.ctx
	}
	if targetCtx != nil {
		w, h := runtime.WindowGetSize(targetCtx)
		_ = a.SaveWindowSize(w, h)
	}
	return false
}

// startup 在应用启动时调用
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	appDataDir := GetAppDataDir()
	_ = os.MkdirAll(appDataDir, 0755)

	dbPath := filepath.Join(appDataDir, "buildui.db")
	database, err := db.Open(ctx, dbPath)
	if err == nil {
		a.db = database
		a.appRepo = db.NewAppRepository(database)
		a.chatRepo = db.NewChatRepository(database)
		a.messageRepo = db.NewMessageRepository(database)
		a.bpRepo = db.NewBlueprintRepository(database)
		versionRepo := db.NewVersionRepository(database)

		emitter := &wailsEventEmitter{ctx: ctx}
		settingsRepo := db.NewSettingsRepository(database)
		defaultRoot := filepath.Join(appDataDir, "workspace")
		if savedDir, err := settingsRepo.Get(ctx, "workspace.dir"); err == nil && strings.TrimSpace(savedDir) != "" {
			defaultRoot = strings.TrimSpace(savedDir)
		}

		a.appService = app.NewAppService(a.appRepo, database)
		a.appService.SetTemplateCacheRoot(appDataDir)
		a.appService.SetWorkspaceRoot(defaultRoot)
		a.appService.SetThumbnailDir(filepath.Join(appDataDir, config.ThumbnailDirName))
		a.appService.SetRunner(runner.NewAppRunner(emitter))
		a.blueprintService = blueprint.NewBlueprintService(a.bpRepo, a.appRepo, database)
		a.blueprintService.SetEmitter(emitter)
		a.chatService = agent.NewChatService(a.chatRepo, a.appRepo, a.blueprintService, emitter)
		a.chatService.SetVersionRepo(versionRepo)
		a.problemsService = tsc.NewProblemsService(a.appRepo, nil)
		a.chatService.SetBuildProblems(a.problemsService)
		a.appService.SetPreviewVerifier(a.chatService.PreparePreview)
		a.chatService.SetModelRepositories(settingsRepo, a.messageRepo)
		a.pluginService, _ = plugins.NewService(database, appDataDir)
		a.chatService.SetPlugins(a.pluginService)
		a.settingsService = settings.NewSettingsService(settingsRepo)
		a.versionService = version.NewVersionService(versionRepo, a.appRepo, emitter)
		a.themeService = theme.NewThemeService(a.appRepo)
		a.themeService.SetSettingsRepo(settingsRepo)

		a.updaterService = updater.NewService(updater.Config{
			Emitter: func(ctx context.Context, eventName string, result updater.UpdateCheckResult) {
				emitter.Emit(eventName, result)
			},
		})
		go func() {
			_, _ = a.updaterService.CheckAndNotify(a.ctx)
		}()

		// 若启用了记忆，在 startup 确保窗口尺寸同步
		if allSettings, err := settingsRepo.GetAll(ctx); err == nil {
			size := settings.ResolveStartupWindowSize(allSettings)
			if size.Width != config.DefaultWindowWidth || size.Height != config.DefaultWindowHeight {
				runtime.WindowSetSize(ctx, size.Width, size.Height)
			}
		}
	}
}

// shutdown 在应用退出时调用
func (a *App) shutdown(ctx context.Context) {
	if a.appService != nil {
		if err := a.appService.Shutdown(ctx); err != nil {
			log.Printf("Could not stop all managed previews: %v", err)
		}
	}
	if a.db != nil {
		_ = a.db.Close()
	}
}

// CheckForUpdates 暴露给前端手动检查更新的 RPC 方法
func (a *App) CheckForUpdates() (*updater.UpdateCheckResult, error) {
	if a.updaterService == nil {
		return &updater.UpdateCheckResult{Available: false}, nil
	}
	res, err := a.updaterService.CheckForUpdates(a.ctx)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

// CreateApp 暴露给前端的 Wails RPC 方法
func (a *App) CreateApp(req app.CreateAppRequest) (*app.CreateAppResponse, error) {
	return a.appService.CreateApp(a.ctx, req)
}

// ListApps 暴露给前端的 Wails RPC 方法
func (a *App) ListApps() ([]app.AppDTO, error) {
	return a.appService.ListApps(a.ctx)
}

// CaptureAppScreenshot 暴露给前端的实时项目截图 RPC 方法
func (a *App) CaptureAppScreenshot(appID int64, targetURL string) (string, error) {
	if a.appService == nil {
		return "", errors.New("the project service is unavailable")
	}
	return a.appService.CaptureAppScreenshot(a.ctx, appID, targetURL)
}

// SaveAppThumbnail 暴露给前端的项目封面持久化 RPC 方法（供前端降级截图保存）
func (a *App) SaveAppThumbnail(appID int64, dataURL string) (string, error) {
	if a.appService == nil {
		return "", errors.New("the project service is unavailable")
	}
	return a.appService.SaveAppThumbnail(a.ctx, appID, dataURL)
}

// GetBlueprint 暴露给前端的获取蓝图 RPC 方法
func (a *App) GetBlueprint(chatID int64) (*blueprint.BlueprintDTO, error) {
	return a.blueprintService.GetBlueprint(a.ctx, chatID)
}

type ProjectChat struct {
	ChatID        int64                    `json:"chatId"`
	Blueprint     *blueprint.BlueprintDTO  `json:"blueprint"`
	Clarification *blueprint.Questionnaire `json:"clarification,omitempty"`
	Messages      []*db.MessageEntity      `json:"messages"`
	BuildProgress *agent.BuildProgress     `json:"buildProgress,omitempty"`
}

// GetProjectChat 加载项目最近的会话，或创建首次会话。
func (a *App) GetProjectChat(appID int64) (*ProjectChat, error) {
	chats, err := a.chatRepo.ListByAppID(a.ctx, appID)
	if err != nil {
		return nil, err
	}
	if len(chats) == 0 {
		return a.CreateProjectChat(appID)
	}
	id := chats[0].ID
	bp, err := a.GetBlueprint(id)
	var missing *errs.BlotError
	if err != nil && !(errors.As(err, &missing) && missing.Kind == errs.KindNotFound) {
		return nil, err
	}
	var clarification *blueprint.Questionnaire
	if bp == nil && a.messageRepo != nil {
		if raw, err := a.messageRepo.GetClarification(a.ctx, id); err == nil && raw != "" {
			var q blueprint.Questionnaire
			if json.Unmarshal([]byte(raw), &q) == nil && len(q.Questions) > 0 {
				q.ChatID = id
				clarification = &q
			}
		}
	}
	messages, err := a.messageRepo.ListByChatID(a.ctx, id)
	if err != nil {
		return nil, err
	}
	progress, err := a.chatService.GetBuildProgress(a.ctx, id)
	if err != nil {
		return nil, err
	}
	return &ProjectChat{ChatID: id, Blueprint: bp, Clarification: clarification, Messages: messages, BuildProgress: progress}, nil
}

// CreateProjectChat 创建会话并继承已审批的项目蓝图。
func (a *App) CreateProjectChat(appID int64) (*ProjectChat, error) {
	project, err := a.appRepo.GetByID(a.ctx, appID)
	if err != nil {
		return nil, err
	}
	var approved *blueprint.BlueprintDTO
	if !project.NeedsAppBlueprint {
		chats, err := a.chatRepo.ListByAppID(a.ctx, appID)
		if err != nil {
			return nil, err
		}
		for _, chat := range chats {
			if bp, err := a.GetBlueprint(chat.ID); err == nil && bp.Approved {
				approved = bp
				break
			}
		}
	}
	id, err := a.chatRepo.Create(a.ctx, &db.ChatEntity{AppID: appID, Title: project.Name})
	if err != nil {
		return nil, err
	}
	if approved != nil {
		approved.ChatID = id
		if err := a.blueprintService.SaveBlueprint(a.ctx, *approved); err != nil {
			return nil, err
		}
	}
	return &ProjectChat{ChatID: id, Blueprint: approved, Messages: []*db.MessageEntity{}}, nil
}

// ListProjectFiles 返回代码检视所用的项目文件路径。
func (a *App) ListProjectFiles(appID int64) ([]string, error) {
	project, err := a.appRepo.GetByID(a.ctx, appID)
	if err != nil {
		return nil, err
	}
	return workspace.ListSources(project.Path)
}

// ReadProjectFile 读取工作区中的源码。
func (a *App) ReadProjectFile(appID int64, path string) (string, error) {
	project, err := a.appRepo.GetByID(a.ctx, appID)
	if err != nil {
		return "", err
	}
	return workspace.ReadSource(project.Path, path)
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
	err := a.settingsService.SaveSettings(a.ctx, cfg)
	if err == nil && a.appService != nil {
		if dir, ok := cfg["workspace.dir"]; ok && strings.TrimSpace(dir) != "" {
			a.appService.SetWorkspaceRoot(strings.TrimSpace(dir))
		}
	}
	return err
}

// TestLLMConnection 暴露给前端的测试 LLM 连通性 RPC 方法
func (a *App) TestLLMConnection(baseURL, apiKey, model string) error {
	if a.settingsService == nil {
		return nil
	}
	return a.settingsService.TestConnection(a.ctx, baseURL, apiKey, model)
}

// ListProviderModels 暴露给前端的动态拉取提供商模型 RPC 方法
func (a *App) ListProviderModels(provider, baseURL, apiKey string) ([]string, error) {
	if a.settingsService == nil {
		if list, ok := settings.ProviderPresets[provider]; ok {
			return list, nil
		}
		return []string{"gpt-4o", "deepseek-chat"}, nil
	}
	ctx := a.ctx
	if ctx == nil {
		ctx = context.Background()
	}
	return a.settingsService.ListProviderModels(ctx, provider, baseURL, apiKey)
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

// SwitchApp 暴露给前端的切换活跃应用 RPC 方法
func (a *App) SwitchApp(appID int64) (*app.ActiveAppResponse, error) {
	if a.appService == nil {
		return nil, nil
	}
	return a.appService.SwitchApp(a.ctx, appID)
}

// DeleteApp 暴露给前端的删除非活跃应用 RPC 方法
func (a *App) DeleteApp(appID int64) error {
	if a.appService == nil {
		return nil
	}
	return a.appService.DeleteApp(a.ctx, appID)
}

// GetActiveApp 暴露给前端的获取活跃应用 RPC 方法
func (a *App) GetActiveApp() (*app.ActiveAppResponse, error) {
	if a.appService == nil {
		return nil, nil
	}
	return a.appService.GetActiveApp(a.ctx)
}

// ResolveComponent 暴露给前端的逆向组件解析 RPC 方法
func (a *App) ResolveComponent(req inspector.ResolveComponentRequest) (*inspector.ResolvedComponentResponse, error) {
	svc := inspector.NewInspectorService()
	return svc.ResolveComponent(a.ctx, req)
}

// ExportAppZip 暴露给前端的导出工程 Zip 压缩包 RPC 方法
func (a *App) ExportAppZip(appID int64, destPath string) (string, error) {
	if a.appService == nil {
		return "", nil
	}
	appInfo, err := a.appService.SwitchApp(a.ctx, appID)
	if err != nil {
		return "", err
	}
	svc := export.NewExportService()
	return svc.ExportAppZip(a.ctx, appInfo.Path, destPath)
}

// OpenInFileManager 暴露给前端的唤起系统原生文件管理器 RPC 方法
func (a *App) OpenInFileManager(targetPath string) error {
	svc := export.NewExportService()
	return svc.OpenInFileManager(targetPath)
}

// InstallDependencies 暴露给前端的动态依赖安全校验与异步安装 RPC 方法
func (a *App) InstallDependencies(appID int64, packages []string) error {
	if a.appRepo == nil {
		return nil
	}
	appEntity, err := a.appRepo.GetByID(a.ctx, appID)
	if err != nil {
		return err
	}
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "dep_install_started", packages)
	}
	depMgr := agent.NewDependencyManager(appEntity.Path, nil)
	err = depMgr.EnsureDependencies(a.ctx, packages)
	if err != nil {
		if a.ctx != nil {
			runtime.EventsEmit(a.ctx, "dep_install_error", err.Error())
		}
		return err
	}
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "dep_install_success", packages)
	}
	return nil
}

// GetThemePresets 暴露给前端的获取系统预设主题集 RPC 方法
func (a *App) GetThemePresets() []theme.ThemePreset {
	if a.themeService == nil {
		return theme.GetDefaultThemePresets()
	}
	return a.themeService.GetThemePresets()
}

// SetAppTheme 暴露给前端的更新应用主题 RPC 方法
func (a *App) SetAppTheme(appID int64, themeID string) error {
	if a.themeService == nil {
		return nil
	}
	return a.themeService.SetAppTheme(a.ctx, appID, themeID)
}

// ExtractStyle 暴露给前端的基于 Vision LLM 风格提取 RPC 方法
func (a *App) ExtractStyle(req theme.ExtractStyleRequest) (*theme.ExtractedStyleDTO, error) {
	if a.themeService == nil {
		return nil, errors.New("theme service is not initialized")
	}
	return a.themeService.ExtractStyle(a.ctx, req)
}

// GetAppTemplates 返回内置模板及可用的社区目录。
func (a *App) GetAppTemplates() []template.AppTemplate {
	if a.appService == nil {
		return template.GetDefaultTemplates()
	}
	return a.appService.ListTemplates(a.ctx)
}

// SelectProjectTemplate 保存模板中心的选中项与可选的社区代码授权。
func (a *App) SelectProjectTemplate(id string, acceptCommunity bool) error {
	if a.appService == nil {
		return errors.New("The project service is unavailable.")
	}
	return a.appService.SelectTemplate(a.ctx, id, acceptCommunity)
}

// CreateAppFromTemplate 保留旧调用入口，共用一次项目创建流程。
func (a *App) CreateAppFromTemplate(req template.CreateFromTemplateRequest) (*app.CreateAppResponse, error) {
	if a.appService == nil {
		return nil, errors.New("The project service is unavailable.")
	}
	return a.CreateApp(app.CreateAppRequest{
		Name:       req.AppName,
		TemplateID: req.TemplateID,
		CustomPath: req.DestPath,
	})
}
