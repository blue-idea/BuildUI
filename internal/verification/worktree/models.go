package worktree

import "regexp"

const (
	// WorktreePrefix 临时隔离构建工作区前缀
	WorktreePrefix = ".dyad-build-"
)

var (
	// WorktreePattern 严格匹配 .dyad-build-[6位字母数字]
	WorktreePattern = regexp.MustCompile(`^\.dyad-build-[A-Za-z0-9]{6}$`)
)

// BuildResult 隔离生产构建结果
type BuildResult struct {
	Success      bool   `json:"success"`
	ExitCode     int    `json:"exitCode"`
	Output       string `json:"output"`
	WorktreeName string `json:"worktreeName"`
	WorktreePath string `json:"worktreePath"`
}
