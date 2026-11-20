package app

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

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

// AppService 负责应用管理与脚手架初始化
type AppService struct {
	appRepo *db.AppRepository
	db      *db.DB
}

// NewAppService 创建 AppService 实例
func NewAppService(appRepo *db.AppRepository, database *db.DB) *AppService {
	return &AppService{
		appRepo: appRepo,
		db:      database,
	}
}

// CreateApp 展开内置脚手架并初始化 Git 仓库与 SQLite 记录
func (s *AppService) CreateApp(ctx context.Context, req CreateAppRequest) (*CreateAppResponse, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, errs.NewValidationError("app name cannot be empty", nil)
	}

	targetPath := req.CustomPath
	if targetPath == "" {
		cwd, err := os.Getwd()
		if err != nil {
			return nil, errs.NewInternalError("failed to get current working directory", err)
		}
		slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
		targetPath = filepath.Join(cwd, "workspace", slug)
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
