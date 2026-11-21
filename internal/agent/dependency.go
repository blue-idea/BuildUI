package agent

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"buildui/internal/errs"
)

// CommandExecutor 抽象命令行调用接口，支持测试环境 Mock
type CommandExecutor interface {
	Execute(ctx context.Context, dir string, name string, args ...string) error
}

// defaultCommandExecutor 默认系统命令行执行器
type defaultCommandExecutor struct{}

func (d *defaultCommandExecutor) Execute(ctx context.Context, dir string, name string, args ...string) error {
	cmd := exec.CommandContext(ctx, name, args...)
	cmd.Dir = dir
	return cmd.Run()
}

// packageJSON 对应 package.json 的精简结构
type packageJSON struct {
	Dependencies    map[string]string `json:"dependencies"`
	DevDependencies map[string]string `json:"devDependencies"`
}

// DependencyManager 负责检测目标应用的依赖并自动安装
type DependencyManager struct {
	appDir   string
	executor CommandExecutor
}

// NewDependencyManager 创建依赖管理器
func NewDependencyManager(appDir string, executor CommandExecutor) *DependencyManager {
	if executor == nil {
		executor = &defaultCommandExecutor{}
	}
	return &DependencyManager{
		appDir:   appDir,
		executor: executor,
	}
}

// EnsureDependencies 检查依赖是否已存在于 package.json 中，若不存在则调用 pnpm add
func (m *DependencyManager) EnsureDependencies(ctx context.Context, packages []string) error {
	if len(packages) == 0 {
		return nil
	}

	pkgPath := filepath.Join(m.appDir, "package.json")
	data, err := os.ReadFile(pkgPath)
	if err != nil {
		return errs.NewInternalError("failed to read package.json at: "+pkgPath, err)
	}

	var pkg packageJSON
	if err := json.Unmarshal(data, &pkg); err != nil {
		return errs.NewInternalError("failed to parse package.json", err)
	}

	existing := make(map[string]bool)
	for k := range pkg.Dependencies {
		existing[k] = true
	}
	for k := range pkg.DevDependencies {
		existing[k] = true
	}

	var missing []string
	for _, p := range packages {
		trimmed := strings.TrimSpace(p)
		if trimmed == "" {
			continue
		}
		// 如果指定了包版本（如 pkg@latest 或 @org/pkg@1.0.0），提取裸包名进行存在性判定
		bareName := extractBarePackageName(trimmed)
		if !existing[bareName] {
			missing = append(missing, trimmed)
		}
	}

	if len(missing) == 0 {
		return nil
	}

	// 执行 pnpm add <missing...>
	args := append([]string{"add"}, missing...)
	if err := m.executor.Execute(ctx, m.appDir, "pnpm", args...); err != nil {
		return errs.NewExternalError("failed to install dependencies: "+strings.Join(missing, ", "), err)
	}

	return nil
}

// extractBarePackageName 提取 npm 裸包名
func extractBarePackageName(pkgSpec string) string {
	if strings.HasPrefix(pkgSpec, "@") {
		// Scoped package, 如 @base-ui/react 或 @scope/pkg@1.0
		parts := strings.Split(pkgSpec[1:], "@")
		return "@" + parts[0]
	}
	parts := strings.Split(pkgSpec, "@")
	return parts[0]
}
