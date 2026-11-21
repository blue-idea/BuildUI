package agent

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"buildui/internal/errs"
	"buildui/internal/workspace"
)

// npmPackageRegex 匹配合法标准与 scope 包名 (带可选语义化版本)
var npmPackageRegex = regexp.MustCompile(`^(?i)(?:@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*(?:@[a-z0-9-._~^><=]+)?$`)

// ValidatePackageName 校验 npm 包名是否合法，防止命令注入与特殊字符风险
func ValidatePackageName(pkg string) bool {
	trimmed := strings.TrimSpace(pkg)
	if trimmed == "" {
		return false
	}
	if strings.ContainsAny(trimmed, ";&|`$<> \t\r\n\\") || strings.Contains(trimmed, "..") {
		return false
	}
	return npmPackageRegex.MatchString(trimmed)
}

// CommandExecutor 抽象命令行调用接口，支持测试环境 Mock
type CommandExecutor interface {
	Execute(ctx context.Context, dir string, name string, args ...string) error
}

// defaultCommandExecutor 默认系统命令行执行器
type defaultCommandExecutor struct{}

func (d *defaultCommandExecutor) Execute(ctx context.Context, dir string, name string, args ...string) error {
	return workspace.PnpmCommand(ctx, dir, args...).Run()
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

// SanitizePackages 校验并过滤传入的一组依赖包，若有非法包名则返回 ValidationError
func (m *DependencyManager) SanitizePackages(packages []string) ([]string, error) {
	var valid []string
	for _, p := range packages {
		trimmed := strings.TrimSpace(p)
		if trimmed == "" {
			continue
		}
		if !ValidatePackageName(trimmed) {
			return nil, errs.NewValidationError("invalid or unsafe npm package name: "+trimmed, nil)
		}
		valid = append(valid, trimmed)
	}
	return valid, nil
}

// EnsureDependencies 检查依赖是否已存在于 package.json 中，若不存在则调用 pnpm add
func (m *DependencyManager) EnsureDependencies(ctx context.Context, packages []string) error {
	if len(packages) == 0 {
		return nil
	}

	sanitized, err := m.SanitizePackages(packages)
	if err != nil {
		return err
	}
	if len(sanitized) == 0 {
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
	for _, p := range sanitized {
		bareName := extractBarePackageName(p)
		if !existing[bareName] {
			missing = append(missing, p)
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
