package app

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"buildui/internal/app/runner"
	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/sysutil"
	"buildui/internal/template"
	"buildui/internal/verification/tsc"
	"buildui/internal/workspace"
)

// CreateAppRequest 创建新应用请求
type CreateAppRequest struct {
	Name       string `json:"name"`       // 应用名称 (非空)
	TemplateID string `json:"templateId"` // 未指定时使用 React，移动端入口显式传入 Expo
	CustomPath string `json:"customPath"` // 用户自定义路径 (可选)
}

// CreateAppResponse 创建新应用响应
type CreateAppResponse struct {
	AppID             int64  `json:"appId"`
	Name              string `json:"name"`
	Path              string `json:"path"`
	InitialCommitHash string `json:"initialCommitHash"`
}

// AppDTO 前端应用传输对象
type AppDTO struct {
	ID                int64  `json:"id"`
	Name              string `json:"name"`
	Path              string `json:"path"`
	NeedsAppBlueprint bool   `json:"needsAppBlueprint"`
	Platform          string `json:"platform,omitempty"`
}

// ActiveAppResponse 活跃应用状态响应
type ActiveAppResponse struct {
	AppID             int64  `json:"appId"`
	Name              string `json:"name"`
	Path              string `json:"path"`
	PreviewURL        string `json:"previewUrl"`
	LatestCommitHash  string `json:"latestCommitHash"`
	BlueprintApproved bool   `json:"blueprintApproved"`
	NativeApp         bool   `json:"nativeApp"`
}

// AppService 负责应用管理与脚手架初始化
type AppService struct {
	appRepo        *db.AppRepository
	db             *db.DB
	runner         *runner.AppRunner
	workspaceRoot  string
	verifyPreview  func(context.Context, *db.AppEntity) (*tsc.RemediationResult, error)
	activePreviews sync.Map
	templates      *template.TemplateService
	createMu       sync.Mutex
}

// SetWorkspaceRoot 定位新建项目的默认目录。
func (s *AppService) SetWorkspaceRoot(root string) {
	s.workspaceRoot = root
}

// GetWorkspaceRoot 获取新建项目的默认根目录（优先使用 settings 中的 workspace.dir，其次使用 workspaceRoot，兜底当前目录下的 workspace）
func (s *AppService) GetWorkspaceRoot(ctx context.Context) string {
	if s.db != nil {
		var customDir string
		row := s.db.SQLDB().QueryRowContext(ctx, "SELECT value FROM settings WHERE key = 'workspace.dir';")
		if err := row.Scan(&customDir); err == nil && strings.TrimSpace(customDir) != "" {
			return filepath.Clean(strings.TrimSpace(customDir))
		}
	}
	if s.workspaceRoot != "" {
		return filepath.Clean(s.workspaceRoot)
	}
	cwd, err := os.Getwd()
	if err != nil {
		return "workspace"
	}
	return filepath.Join(cwd, "workspace")
}

// NewAppService 创建 AppService 实例
func NewAppService(appRepo *db.AppRepository, database *db.DB) *AppService {
	return &AppService{
		appRepo:   appRepo,
		db:        database,
		runner:    runner.NewAppRunner(nil),
		templates: template.NewTemplateService(),
	}
}

func (s *AppService) SetTemplateCacheRoot(root string) { s.templates.SetCacheRoot(root) }

func (s *AppService) ListTemplates(ctx context.Context) []template.AppTemplate {
	return s.templates.List(ctx)
}

// SelectTemplate 同一次设置写入同时记录授权和选择，避免保存半完成状态。
func (s *AppService) SelectTemplate(ctx context.Context, id string, acceptCommunity bool) error {
	settings := db.NewSettingsRepository(s.db)
	if template.IsCommunityID(id) && !acceptCommunity {
		if err := requireCommunityConsent(ctx, settings); err != nil {
			return err
		}
	}
	entry, err := s.templates.Lookup(ctx, id)
	if err != nil {
		return err
	}
	changes := map[string]string{template.SelectionKey(): entry.ID}
	if entry.Source == template.SourceCommunity && acceptCommunity {
		changes[template.ConsentKey()] = "true"
	}
	return settings.SetMany(ctx, changes)
}

func requireCommunityConsent(ctx context.Context, settings *db.SettingsRepository) error {
	consent, err := settings.Get(ctx, template.ConsentKey())
	if err != nil {
		return err
	}
	if consent != "true" {
		return errs.NewPreconditionError("Accept the community code notice before using this template.", nil)
	}
	return nil
}

// SetRunner 设置自定义 AppRunner 实例
func (s *AppService) SetRunner(r *runner.AppRunner) {
	s.runner = r
}

func (s *AppService) SetPreviewVerifier(verify func(context.Context, *db.AppEntity) (*tsc.RemediationResult, error)) {
	s.verifyPreview = verify
}

// CreateApp 展开内置脚手架并初始化 Git 仓库与 SQLite 记录
func (s *AppService) CreateApp(ctx context.Context, req CreateAppRequest) (*CreateAppResponse, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, errs.NewValidationError("app name cannot be empty", nil)
	}
	templateID := req.TemplateID
	if templateID == "" {
		// 普通创建沿用 React；模板中心的选择由其创建入口显式传入。
		templateID = template.DefaultID()
	}
	if template.IsCommunityID(templateID) {
		if err := requireCommunityConsent(ctx, db.NewSettingsRepository(s.db)); err != nil {
			return nil, err
		}
	}
	s.createMu.Lock()
	defer s.createMu.Unlock()

	targetPath := req.CustomPath
	if targetPath == "" {
		root := s.GetWorkspaceRoot(ctx)
		slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
		if slug == "." || !filepath.IsLocal(slug) || strings.ContainsAny(slug, "\\/:*?\"<>|") {
			return nil, errs.NewValidationError("Choose a valid project name or directory.", nil)
		}
		targetPath = filepath.Join(root, slug)
	}

	// 只回收本次成功取得的目录，保留用户原有目录。
	entries, readErr := os.ReadDir(targetPath)
	if readErr == nil && len(entries) > 0 {
		return nil, errs.NewPreconditionError(fmt.Sprintf("target path %s is not empty", targetPath), nil)
	}
	createdDir := os.IsNotExist(readErr)
	if createdDir {
		if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
			return nil, err
		}
		if err := os.Mkdir(targetPath, 0755); err != nil {
			return nil, err
		}
	} else if readErr != nil {
		return nil, readErr
	}
	registered := false
	defer func() {
		if createdDir && !registered {
			_ = os.RemoveAll(targetPath)
		}
	}()

	// 1. 一次展开模板。
	instance, err := s.templates.InstantiateTemplate(ctx, template.CreateFromTemplateRequest{
		TemplateID: templateID, AppName: name, DestPath: targetPath,
	})
	if err != nil {
		return nil, err
	}

	// 2. 初始化 Git 仓库并执行首个提交
	commitHash, err := s.initGitRepository(targetPath)
	if err != nil {
		return nil, errs.NewInternalError("failed to initialize git repository for app", err)
	}

	// 3. 在 SQLite 数据库中持久化应用信息
	now := time.Now()
	appEntity := &db.AppEntity{
		Name:              name,
		Path:              targetPath,
		ThemeID:           instance.ThemeID,
		NeedsAppBlueprint: true,
		TestingEnabled:    false,
		InstallCommand:    "pnpm install",
		StartCommand:      "pnpm run dev",
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	appID, err := s.appRepo.Create(ctx, appEntity)
	if err != nil {
		return nil, err
	}
	registered = true
	if _, err := db.NewVersionRepository(s.db).Create(ctx, &db.VersionEntity{
		AppID: appID, CommitHash: commitHash, Message: "Initial commit from Blot scaffold", CreatedAt: now,
	}); err != nil {
		return nil, err
	}

	// 同步初始化应用的首个 Chat 会话，避免后续并发加载时出现写锁争用
	if _, err := db.NewChatRepository(s.db).Create(ctx, &db.ChatEntity{
		AppID:    appID,
		Title:    name,
		ChatMode: "agent",
	}); err != nil {
		return nil, err
	}

	return &CreateAppResponse{
		AppID:             appID,
		Name:              name,
		Path:              targetPath,
		InitialCommitHash: commitHash,
	}, nil
}

// ListApps 列出所有本地应用
func (s *AppService) ListApps(ctx context.Context) ([]AppDTO, error) {
	apps, err := s.appRepo.List(ctx)
	if err != nil {
		return nil, err
	}

	dtos := make([]AppDTO, 0, len(apps))
	for _, a := range apps {
		platform := ""
		if workspace.UsesExpo(a.Path) {
			platform = "app"
		}
		dtos = append(dtos, AppDTO{
			ID:                a.ID,
			Name:              a.Name,
			Path:              a.Path,
			NeedsAppBlueprint: a.NeedsAppBlueprint,
			Platform:          platform,
		})
	}

	return dtos, nil
}

// RunApp 启动应用的开发服务器并返回预览地址
func (s *AppService) RunApp(ctx context.Context, req runner.RunAppRequest) (*runner.RunAppResponse, error) {
	if req.AppID <= 0 {
		return nil, errs.NewValidationError("app id must be positive", nil)
	}

	app, err := s.appRepo.GetByID(ctx, req.AppID)
	if err != nil {
		return nil, err
	}

	if s.runner == nil {
		s.runner = runner.NewAppRunner(nil)
	}

	previewCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	if _, busy := s.activePreviews.LoadOrStore(req.AppID, cancel); busy {
		return nil, errs.NewPreconditionError("A preview request is already running for this project.", nil)
	}
	defer s.activePreviews.Delete(req.AppID)
	var verification *tsc.RemediationResult
	if s.verifyPreview != nil {
		verification, err = s.verifyPreview(previewCtx, app)
		if err != nil {
			return nil, err
		}
	}
	if err := previewCtx.Err(); err != nil {
		return nil, err
	}
	// 先验证源码，再停止旧进程。验证失败时保留当前开发服务器。
	if req.Restart {
		if err := s.runner.StopApp(previewCtx, req.AppID); err != nil {
			return nil, err
		}
	}
	response, err := s.runner.StartApp(previewCtx, req.AppID, app.Path)
	if err != nil {
		return nil, err
	}
	if verification != nil {
		response.TypeScriptChecked = true
		response.RepairAttempts = verification.Attempts
	}
	return response, nil
}

// StopApp 停止应用的开发服务器
func (s *AppService) StopApp(ctx context.Context, req runner.StopAppRequest) error {
	if req.AppID <= 0 {
		return errs.NewValidationError("app id must be positive", nil)
	}

	// 停止或切换工程时，从启动请求中取消尚未完成的检查及模型修复。
	if cancel, ok := s.activePreviews.Load(req.AppID); ok {
		cancel.(context.CancelFunc)()
	}
	if s.runner == nil {
		return nil
	}

	return s.runner.StopApp(ctx, req.AppID)
}

// SwitchApp 切换当前活跃工程，并停止旧开发服务
func (s *AppService) SwitchApp(ctx context.Context, targetAppID int64) (*ActiveAppResponse, error) {
	if targetAppID <= 0 {
		return nil, errs.NewValidationError("target app id must be positive", nil)
	}

	appEntity, err := s.appRepo.GetByID(ctx, targetAppID)
	if err != nil {
		return nil, err
	}

	// 停止之前正在运行的开发服务器
	currentActiveID, err := s.appRepo.GetActiveAppID(ctx)
	if err != nil {
		return nil, err
	}
	if currentActiveID != targetAppID {
		if err := s.appRepo.SetActiveAppID(ctx, targetAppID); err != nil {
			return nil, err
		}
		if currentActiveID > 0 && s.runner != nil {
			_ = s.StopApp(ctx, runner.StopAppRequest{AppID: currentActiveID})
		}
	}

	// 读取当前工程最新 Commit Hash
	commitHash := ""
	if entries, err := os.ReadDir(filepath.Join(appEntity.Path, ".git")); err == nil && len(entries) > 0 {
		cmd := sysutil.Command("git", "rev-parse", "HEAD")
		cmd.Dir = appEntity.Path
		if out, err := cmd.Output(); err == nil {
			commitHash = strings.TrimSpace(string(out))
		}
	}

	return &ActiveAppResponse{
		AppID:             appEntity.ID,
		Name:              appEntity.Name,
		Path:              appEntity.Path,
		PreviewURL:        s.runner.PreviewURL(targetAppID),
		LatestCommitHash:  commitHash,
		BlueprintApproved: !appEntity.NeedsAppBlueprint,
		NativeApp:         workspace.UsesExpo(appEntity.Path),
	}, nil
}

// DeleteApp 删除非活跃应用及其关联数据并递归清理物理工作区目录
func (s *AppService) DeleteApp(ctx context.Context, appID int64) error {
	if appID <= 0 {
		return errs.NewValidationError("app id must be positive", nil)
	}

	activeID, _ := s.appRepo.GetActiveAppID(ctx)
	if activeID == appID {
		return errs.NewPreconditionError("cannot delete currently active application", nil)
	}

	// 1. 查询应用实体以获取物理工程路径
	appEntity, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return err
	}

	// 2. 检查并平稳停止关联的运行态 Runner
	if s.runner != nil {
		_ = s.runner.StopApp(ctx, appID)
	}

	// 3. 从数据库中级联删除应用记录
	if err := s.appRepo.Delete(ctx, appID); err != nil {
		return err
	}

	// 4. 执行目录防灾安全校验并递归物理删除工程工作区
	if appEntity.Path != "" && IsSafeProjectDirectory(appEntity.Path) {
		_ = os.RemoveAll(appEntity.Path)
	}

	return nil
}

// GetActiveApp 获取当前活跃应用状态
func (s *AppService) GetActiveApp(ctx context.Context) (*ActiveAppResponse, error) {
	activeID, err := s.appRepo.GetActiveAppID(ctx)
	if err != nil {
		return nil, err
	}

	if activeID == 0 {
		apps, err := s.appRepo.List(ctx)
		if err != nil || len(apps) == 0 {
			return nil, errs.NewNotFoundError("no applications found", nil)
		}
		activeID = apps[0].ID
	}

	return s.SwitchApp(ctx, activeID)
}

// initGitRepository 初始化 Git 仓库、安全配置临时身份并提交初始状态
func (s *AppService) initGitRepository(targetDir string) (string, error) {
	// git init
	initCmd := sysutil.Command("git", "init")
	initCmd.Dir = targetDir
	if err := initCmd.Run(); err != nil {
		return "", fmt.Errorf("git init failed: %w", err)
	}

	// 配置本地 user.name / user.email 防御全局未配置 Git 的环境
	_ = sysutil.Command("git", "-C", targetDir, "config", "user.name", "Blot-UI").Run()
	_ = sysutil.Command("git", "-C", targetDir, "config", "user.email", "blot@local").Run()

	// git add -A
	addCmd := sysutil.Command("git", "add", "-A")
	addCmd.Dir = targetDir
	if err := addCmd.Run(); err != nil {
		return "", fmt.Errorf("git add failed: %w", err)
	}

	// git commit -m "Initial commit from Blot scaffold"
	commitCmd := sysutil.Command("git", "commit", "-m", "Initial commit from Blot scaffold")
	commitCmd.Dir = targetDir
	if out, err := commitCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("git commit failed: %w (%s)", err, strings.TrimSpace(string(out)))
	}

	// git rev-parse HEAD
	revCmd := sysutil.Command("git", "rev-parse", "HEAD")
	revCmd.Dir = targetDir
	hashBytes, err := revCmd.Output()
	if err != nil {
		return "", fmt.Errorf("git rev-parse HEAD failed: %w", err)
	}

	return strings.TrimSpace(string(hashBytes)), nil
}

// IsSafeProjectDirectory 检查路径是否允许作为项目目录被递归物理删除，防御误删根目录或系统重要目录
func IsSafeProjectDirectory(dir string) bool {
	if strings.TrimSpace(dir) == "" {
		return false
	}
	cleaned := filepath.Clean(dir)
	if cleaned == "" || cleaned == "." || cleaned == ".." {
		return false
	}

	// 根目录检测
	if cleaned == "/" {
		return false
	}
	if vol := filepath.VolumeName(cleaned); vol != "" {
		if cleaned == vol+"\\" || cleaned == vol+"/" || cleaned == vol {
			return false
		}
	}

	// 转为绝对路径以统一评估层级
	if abs, err := filepath.Abs(cleaned); err == nil {
		cleaned = abs
	}

	// 用户主目录防护
	if home, err := os.UserHomeDir(); err == nil && home != "" {
		if cleaned == filepath.Clean(home) {
			return false
		}
	}

	// 当前工作目录及其父目录防护
	if cwd, err := os.Getwd(); err == nil && cwd != "" {
		cleanCwd := filepath.Clean(cwd)
		if cleaned == cleanCwd || cleaned == filepath.Dir(cleanCwd) {
			return false
		}
	}

	// Unix 根直接子目录防护（如 /bin, /usr, /etc, /Users, /Applications, /var, /System）
	parent := filepath.Dir(cleaned)
	if parent == "/" {
		return false
	}
	if vol := filepath.VolumeName(parent); vol != "" {
		if parent == vol+"\\" || parent == vol+"/" || parent == vol {
			return false
		}
	}

	return true
}
