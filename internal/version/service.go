package version

import (
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"buildui/internal/db"
	"buildui/internal/errs"
)

// VersionService 版本时光机核心服务
type VersionService struct {
	versionRepo *db.VersionRepository
	appRepo     *db.AppRepository
	emitter     EventEmitter
}

// NewVersionService 实例化版本服务
func NewVersionService(versionRepo *db.VersionRepository, appRepo *db.AppRepository, emitter EventEmitter) *VersionService {
	return &VersionService{
		versionRepo: versionRepo,
		appRepo:     appRepo,
		emitter:     emitter,
	}
}

// SetEmitter 设置事件发送器
func (s *VersionService) SetEmitter(e EventEmitter) {
	s.emitter = e
}

// ListVersions 获取指定应用的所有历史提交版本
func (s *VersionService) ListVersions(ctx context.Context, appID int64) ([]VersionDTO, error) {
	entities, err := s.versionRepo.ListByAppID(ctx, appID)
	if err != nil {
		return nil, err
	}

	dtos := make([]VersionDTO, 0, len(entities))
	for _, e := range entities {
		dtos = append(dtos, VersionDTO{
			ID:         e.ID,
			AppID:      e.AppID,
			ChatID:     e.ChatID,
			CommitHash: e.CommitHash,
			Message:    e.Message,
			CreatedAt:  e.CreatedAt,
		})
	}
	return dtos, nil
}

// GetVersionDiff 提取指定版本的代码改动差异
func (s *VersionService) GetVersionDiff(ctx context.Context, appID int64, commitHash string) (*VersionDiffResult, error) {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return nil, err
	}

	// 提取该 commit 的提交信息
	msgCmd := exec.CommandContext(ctx, "git", "log", "-1", "--format=%s", commitHash)
	msgCmd.Dir = app.Path
	msgOut, err := msgCmd.Output()
	msg := ""
	if err == nil {
		msg = strings.TrimSpace(string(msgOut))
	}

	// 提取统一 patch diff
	diffCmd := exec.CommandContext(ctx, "git", "show", "--patch", "--format=", commitHash)
	diffCmd.Dir = app.Path
	diffOut, err := diffCmd.Output()
	if err != nil {
		return nil, errs.NewInternalError(fmt.Sprintf("failed to get git diff for commit: %s", commitHash), err)
	}

	files := ParseGitDiff(string(diffOut))

	return &VersionDiffResult{
		CommitHash: commitHash,
		Message:    msg,
		Files:      files,
	}, nil
}

// RollbackVersion 安全回滚工作区到指定的历史 Commit
func (s *VersionService) RollbackVersion(ctx context.Context, appID int64, commitHash string) error {
	app, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return err
	}

	// 执行 git checkout 将工作区所有文件还原至 target commit
	checkoutCmd := exec.CommandContext(ctx, "git", "checkout", commitHash, "--", ".")
	checkoutCmd.Dir = app.Path
	if out, err := checkoutCmd.CombinedOutput(); err != nil {
		return errs.NewInternalError(fmt.Sprintf("failed to checkout files to %s: %s", commitHash, string(out)), err)
	}

	// 暂存所有还原改动并生成 Rollback 提交
	addCmd := exec.CommandContext(ctx, "git", "add", "-A")
	addCmd.Dir = app.Path
	if out, err := addCmd.CombinedOutput(); err != nil {
		return errs.NewInternalError(fmt.Sprintf("git add failed during rollback: %s", string(out)), err)
	}

	shortHash := commitHash
	if len(shortHash) > 7 {
		shortHash = shortHash[:7]
	}
	rollbackMsg := fmt.Sprintf("Rollback to version %s", shortHash)

	commitCmd := exec.CommandContext(ctx, "git", "commit", "-m", rollbackMsg)
	commitCmd.Dir = app.Path
	if out, err := commitCmd.CombinedOutput(); err != nil {
		// 如果内容与 HEAD 刚好一致没有改动，无需报错
		if !strings.Contains(string(out), "nothing to commit") {
			return errs.NewInternalError(fmt.Sprintf("git commit failed during rollback: %s", string(out)), err)
		}
	}

	// 提取最新的 HEAD commit
	revCmd := exec.CommandContext(ctx, "git", "rev-parse", "HEAD")
	revCmd.Dir = app.Path
	newHeadBytes, err := revCmd.Output()
	newHead := strings.TrimSpace(string(newHeadBytes))

	// 记录到 versions 表
	if newHead != "" {
		if _, err := s.versionRepo.Create(ctx, &db.VersionEntity{
			AppID:      appID,
			CommitHash: newHead,
			Message:    rollbackMsg,
			CreatedAt:  time.Now(),
		}); err != nil {
			var bErr *errs.BlotError
			cause := err.Error()
			if errors.As(err, &bErr) && bErr.Cause != nil {
				cause = bErr.Cause.Error()
			}
			return errs.NewInternalError(fmt.Sprintf("failed to create rollback version record: %s", cause), err)
		}
	}

	if s.emitter != nil {
		s.emitter.Emit("version:rollback", map[string]interface{}{
			"appId":      appID,
			"targetHash": commitHash,
			"newHead":    newHead,
		})
	}

	return nil
}
