package app_test

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"buildui/internal/app"
)

func TestIsSafeProjectDirectory(t *testing.T) {
	// 1. 空路径与当前相对路径
	if app.IsSafeProjectDirectory("") {
		t.Errorf("expected empty path to be unsafe")
	}
	if app.IsSafeProjectDirectory(".") {
		t.Errorf("expected '.' to be unsafe")
	}
	if app.IsSafeProjectDirectory("..") {
		t.Errorf("expected '..' to be unsafe")
	}

	// 2. 根目录
	if app.IsSafeProjectDirectory("/") {
		t.Errorf("expected '/' to be unsafe")
	}
	if runtime.GOOS == "windows" {
		if app.IsSafeProjectDirectory("C:\\") {
			t.Errorf("expected 'C:\\' to be unsafe")
		}
	}

	// 3. 用户主目录
	if home, err := os.UserHomeDir(); err == nil && home != "" {
		if app.IsSafeProjectDirectory(home) {
			t.Errorf("expected user home dir %q to be unsafe", home)
		}
	}

	// 4. 当前工作目录及父目录
	if cwd, err := os.Getwd(); err == nil && cwd != "" {
		if app.IsSafeProjectDirectory(cwd) {
			t.Errorf("expected cwd %q to be unsafe", cwd)
		}
		parent := filepath.Dir(cwd)
		if app.IsSafeProjectDirectory(parent) {
			t.Errorf("expected cwd parent %q to be unsafe", parent)
		}
	}

	// 5. Unix 根系统目录
	if runtime.GOOS != "windows" {
		unsafeSystemPaths := []string{"/bin", "/usr", "/etc", "/var", "/Applications", "/System", "/Users"}
		for _, p := range unsafeSystemPaths {
			if app.IsSafeProjectDirectory(p) {
				t.Errorf("expected system path %q to be unsafe", p)
			}
		}
	}

	// 6. 安全的正常工程目录
	safeTempDir := filepath.Join(os.TempDir(), "blot-test-projects", "my-cool-app")
	if !app.IsSafeProjectDirectory(safeTempDir) {
		t.Errorf("expected %q to be a safe project directory", safeTempDir)
	}

	if cwd, err := os.Getwd(); err == nil && cwd != "" {
		safeWorkspaceDir := filepath.Join(cwd, "workspace", "my-app")
		if !app.IsSafeProjectDirectory(safeWorkspaceDir) {
			t.Errorf("expected %q to be a safe project directory", safeWorkspaceDir)
		}
	}
}
