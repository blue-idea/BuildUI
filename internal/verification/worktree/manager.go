package worktree

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"

	"buildui/internal/errs"
	"buildui/internal/sysutil"
)

// GitCommandRunner 抽象 Git 命令执行接口
type GitCommandRunner interface {
	RunGit(ctx context.Context, dir string, args ...string) (string, error)
}

// defaultGitRunner 默认基于本地 git CLI 执行
type defaultGitRunner struct{}

func (d *defaultGitRunner) RunGit(ctx context.Context, dir string, args ...string) (string, error) {
	cmd := sysutil.CommandContext(ctx, "git", args...)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	return string(out), err
}

// BuildCommandRunner 抽象生产打包构建命令执行接口
type BuildCommandRunner interface {
	RunBuild(ctx context.Context, dir string) (string, int, error)
}

// defaultBuildRunner 默认基于 pnpm run build 执行
type defaultBuildRunner struct{}

func (d *defaultBuildRunner) RunBuild(ctx context.Context, dir string) (string, int, error) {
	cmd := sysutil.CommandContext(ctx, "pnpm", "run", "build")
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			exitCode = 1
		}
	}
	return string(out), exitCode, err
}

// WorktreeManager 负责管理临时 Git Worktree 沙箱并在隔离环境中执行验证
type WorktreeManager struct {
	gitRunner   GitCommandRunner
	buildRunner BuildCommandRunner
}

// NewWorktreeManager 创建 Worktree 管理器实例
func NewWorktreeManager(gitRunner GitCommandRunner, buildRunner BuildCommandRunner) *WorktreeManager {
	if gitRunner == nil {
		gitRunner = &defaultGitRunner{}
	}
	if buildRunner == nil {
		buildRunner = &defaultBuildRunner{}
	}
	return &WorktreeManager{
		gitRunner:   gitRunner,
		buildRunner: buildRunner,
	}
}

// ExecuteIsolatedBuild 在临时隔离 Worktree 中执行生产构建并捕获诊断日志，自动清理工作区
func (m *WorktreeManager) ExecuteIsolatedBuild(ctx context.Context, repoPath string) (*BuildResult, error) {
	worktreeName := GenerateWorktreeName()
	worktreePath := filepath.Join(repoPath, worktreeName)

	// 1. 创建 detached worktree
	_, err := m.gitRunner.RunGit(ctx, repoPath, "worktree", "add", "--detach", worktreePath, "HEAD")
	if err != nil {
		return nil, errs.NewInternalError("failed to create git worktree: "+worktreeName, err)
	}

	// 确保无论构建成功或失败，都在 defer 中清理 worktree
	defer func() {
		_, _ = m.gitRunner.RunGit(context.Background(), repoPath, "worktree", "remove", "--force", worktreePath)
		_, _ = m.gitRunner.RunGit(context.Background(), repoPath, "worktree", "prune")
		_ = os.RemoveAll(worktreePath)
	}()

	// 2. 复制工作区文件覆盖到 worktree（排除 node_modules 等）
	if err := CopyOverlay(repoPath, worktreePath); err != nil {
		return nil, errs.NewInternalError("failed to overlay workspace state to worktree", err)
	}

	// 3. 在隔离 Worktree 中执行生产构建测试
	output, exitCode, _ := m.buildRunner.RunBuild(ctx, worktreePath)

	return &BuildResult{
		Success:      exitCode == 0,
		ExitCode:     exitCode,
		Output:       output,
		WorktreeName: worktreeName,
		WorktreePath: worktreePath,
	}, nil
}
