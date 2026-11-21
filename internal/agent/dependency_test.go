package agent

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

type mockCommandExecutor struct {
	executedCommands [][]string
	err              error
}

func (m *mockCommandExecutor) Execute(ctx context.Context, dir string, name string, args ...string) error {
	cmd := append([]string{name}, args...)
	m.executedCommands = append(m.executedCommands, cmd)
	return m.err
}

// v1.REQ-003-AC-002: package.json 依赖检测与自动安装
func TestDependencyManager_EnsureDependencies(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "agent_dep_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// 创建初始 package.json
	pkgJSON := `{
  "name": "test-app",
  "dependencies": {
    "react": "^19.0.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}`
	err = os.WriteFile(filepath.Join(tempDir, "package.json"), []byte(pkgJSON), 0644)
	if err != nil {
		t.Fatalf("failed to write package.json: %v", err)
	}

	mockExec := &mockCommandExecutor{}
	manager := NewDependencyManager(tempDir, mockExec)

	// 场景 1: 请求已存在的依赖（react, lucide-react），应当跳过执行
	err = manager.EnsureDependencies(context.Background(), []string{"react", "lucide-react"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(mockExec.executedCommands) != 0 {
		t.Fatalf("expected 0 commands executed for existing deps, got %d", len(mockExec.executedCommands))
	}

	// 场景 2: 请求未安装的依赖（canvas-confetti, axios），应调用 pnpm add
	err = manager.EnsureDependencies(context.Background(), []string{"canvas-confetti", "react", "axios"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(mockExec.executedCommands) != 1 {
		t.Fatalf("expected 1 command executed, got %d", len(mockExec.executedCommands))
	}

	cmd := mockExec.executedCommands[0]
	// cmd 应形如: [pnpm add canvas-confetti axios]
	if cmd[0] != "pnpm" || cmd[1] != "add" {
		t.Fatalf("expected pnpm add, got %v", cmd)
	}
	if len(cmd) != 4 || cmd[2] != "canvas-confetti" || cmd[3] != "axios" {
		t.Fatalf("expected canvas-confetti and axios to be installed, got %v", cmd)
	}
}

// v4.REQ-001-AC-001: 包名合法性校验与防命令注入测试
func TestDependencyManager_ValidationAndSanitization(t *testing.T) {
	validPackages := []string{
		"react",
		"lucide-react",
		"@types/node",
		"@base-ui/react@^1.0.0",
		"canvas-confetti@~0.2.1",
		"lodash.debounce",
		"framer-motion@11.0.0",
	}

	for _, pkg := range validPackages {
		if !ValidatePackageName(pkg) {
			t.Errorf("expected package %q to be valid, but got false", pkg)
		}
	}

	invalidPackages := []string{
		"react; rm -rf /",
		"foo && whoami",
		"bar | cat /etc/passwd",
		"$(calc.exe)",
		"`id`",
		"pkg name with spaces",
		"../relative/path",
		"",
	}

	for _, pkg := range invalidPackages {
		if ValidatePackageName(pkg) {
			t.Errorf("expected package %q to be rejected as invalid, but got true", pkg)
		}
	}

	// 验证 SanitizePackages 对包含恶意注入的请求报错拦截
	manager := NewDependencyManager("", nil)
	_, err := manager.SanitizePackages([]string{"react", "bad;package"})
	if err == nil {
		t.Fatalf("expected error when sanitizing malicious packages, got nil")
	}
}
