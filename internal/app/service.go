package app

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"buildui/internal/app/runner"
	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/scaffold"
)

// CreateAppRequest 创建新应用请求
type CreateAppRequest struct {
	Name       string `json:"name"`       // 应用名称 (非空)
	TemplateID string `json:"templateId"` // 模板标识，默认 "react"
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
}

// ActiveAppResponse 活跃应用状态响应
type ActiveAppResponse struct {
	AppID             int64  `json:"appId"`
	Name              string `json:"name"`
	Path              string `json:"path"`
	PreviewURL        string `json:"previewUrl"`
	LatestCommitHash  string `json:"latestCommitHash"`
	BlueprintApproved bool   `json:"blueprintApproved"`
}

// AppService 负责应用管理与脚手架初始化
type AppService struct {
	appRepo       *db.AppRepository
	db            *db.DB
	runner        *runner.AppRunner
	workspaceRoot string
}

// SetWorkspaceRoot 定位新建项目的默认目录。
func (s *AppService) SetWorkspaceRoot(root string) {
	s.workspaceRoot = root
}

// NewAppService 创建 AppService 实例
func NewAppService(appRepo *db.AppRepository, database *db.DB) *AppService {
	return &AppService{
		appRepo: appRepo,
		db:      database,
		runner:  runner.NewAppRunner(nil),
	}
}

// SetRunner 设置自定义 AppRunner 实例
func (s *AppService) SetRunner(r *runner.AppRunner) {
	s.runner = r
}

// CreateApp 展开内置脚手架并初始化 Git 仓库与 SQLite 记录
func (s *AppService) CreateApp(ctx context.Context, req CreateAppRequest) (*CreateAppResponse, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, errs.NewValidationError("app name cannot be empty", nil)
	}

	targetPath := req.CustomPath
	if targetPath == "" {
		root := s.workspaceRoot
		if root == "" {
			cwd, err := os.Getwd()
			if err != nil {
				return nil, errs.NewInternalError("failed to get current working directory", err)
			}
			root = filepath.Join(cwd, "workspace")
		}
		slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
		if slug == "." || !filepath.IsLocal(slug) || strings.ContainsAny(slug, "\\/:*?\"<>|") {
			return nil, errs.NewValidationError("Choose a valid project name or directory.", nil)
		}
		targetPath = filepath.Join(root, slug)
	}

	// 检查目标路径是否已被非空占用
	if entries, err := os.ReadDir(targetPath); err == nil && len(entries) > 0 {
		return nil, errs.NewPreconditionError(fmt.Sprintf("target path %s is not empty", targetPath), nil)
	}

	// 1. 展开脚手架模板
	if err := scaffold.Extract(targetPath, name); err != nil {
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
		ThemeID:           "default",
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
	if _, err := db.NewVersionRepository(s.db).Create(ctx, &db.VersionEntity{
		AppID: appID, CommitHash: commitHash, Message: "Initial commit from Blot scaffold", CreatedAt: now,
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
		dtos = append(dtos, AppDTO{
			ID:                a.ID,
			Name:              a.Name,
			Path:              a.Path,
			NeedsAppBlueprint: a.NeedsAppBlueprint,
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

	return s.runner.StartApp(ctx, req.AppID, app.Path)
}

// StopApp 停止应用的开发服务器
func (s *AppService) StopApp(ctx context.Context, req runner.StopAppRequest) error {
	if req.AppID <= 0 {
		return errs.NewValidationError("app id must be positive", nil)
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
			_ = s.runner.StopApp(ctx, currentActiveID)
		}
	}

	// 读取当前工程最新 Commit Hash
	commitHash := ""
	if entries, err := os.ReadDir(filepath.Join(appEntity.Path, ".git")); err == nil && len(entries) > 0 {
		cmd := exec.Command("git", "rev-parse", "HEAD")
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
	}, nil
}

// DeleteApp 删除非活跃应用及其关联数据
func (s *AppService) DeleteApp(ctx context.Context, appID int64) error {
	if appID <= 0 {
		return errs.NewValidationError("app id must be positive", nil)
	}

	activeID, _ := s.appRepo.GetActiveAppID(ctx)
	if activeID == appID {
		return errs.NewPreconditionError("cannot delete currently active application", nil)
	}

	return s.appRepo.Delete(ctx, appID)
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
	initCmd := exec.Command("git", "init")
	initCmd.Dir = targetDir
	if err := initCmd.Run(); err != nil {
		return "", fmt.Errorf("git init failed: %w", err)
	}

	// 配置本地 user.name / user.email 防御全局未配置 Git 的环境
	_ = exec.Command("git", "-C", targetDir, "config", "user.name", "Blot-UI").Run()
	_ = exec.Command("git", "-C", targetDir, "config", "user.email", "blot@local").Run()

	// git add -A
	addCmd := exec.Command("git", "add", "-A")
	addCmd.Dir = targetDir
	if err := addCmd.Run(); err != nil {
		return "", fmt.Errorf("git add failed: %w", err)
	}

	// git commit -m "Initial commit from Blot scaffold"
	commitCmd := exec.Command("git", "commit", "-m", "Initial commit from Blot scaffold")
	commitCmd.Dir = targetDir
	if out, err := commitCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("git commit failed: %w (%s)", err, strings.TrimSpace(string(out)))
	}

	// git rev-parse HEAD
	revCmd := exec.Command("git", "rev-parse", "HEAD")
	revCmd.Dir = targetDir
	hashBytes, err := revCmd.Output()
	if err != nil {
		return "", fmt.Errorf("git rev-parse HEAD failed: %w", err)
	}

	return strings.TrimSpace(string(hashBytes)), nil
}
