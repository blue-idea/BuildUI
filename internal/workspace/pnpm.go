package workspace

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
)

var projectInstalls sync.Map

// EnsureProjectDependencies 为编译检查和预览复用同一次依赖安装。
func EnsureProjectDependencies(ctx context.Context, dir string, commands ...string) error {
	root, err := filepath.Abs(dir)
	if err != nil {
		return err
	}
	for {
		done := make(chan struct{})
		if active, busy := projectInstalls.LoadOrStore(root, done); busy {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-active.(chan struct{}):
				continue
			}
		}
		defer close(done)
		defer projectInstalls.Delete(root)

		// 等待同一项目的安装结束后再检查，避免使用尚未链接完成的依赖。
		needed, err := needsProjectDependencies(root, commands)
		if err != nil || !needed {
			return err
		}
		if out, err := PnpmCommand(ctx, root, "install", "--no-prod", "--prefer-offline").CombinedOutput(); err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			return fmt.Errorf("Failed to install project dependencies: %w: %s", err, out)
		}
		if len(commands) == 0 {
			return nil
		}
		needed, err = needsProjectDependencies(root, commands)
		if err != nil {
			return err
		}
		if needed {
			return fmt.Errorf("The required project commands are unavailable after installation (%s). Check that package.json declares their development dependencies.", strings.Join(commands, ", "))
		}
		return nil
	}
}

func needsProjectDependencies(dir string, commands []string) (bool, error) {
	modules := filepath.Join(dir, "node_modules")
	info, err := os.Stat(modules)
	if err != nil {
		if os.IsNotExist(err) {
			return true, nil
		}
		return false, err
	}
	if !info.IsDir() {
		return false, fmt.Errorf("Project dependency path is not a directory: %s", modules)
	}

	// pnpm 会先创建虚拟存储，安装完成后才写入模块布局信息。
	if _, err := os.Stat(filepath.Join(modules, ".pnpm")); err == nil {
		if _, err := os.Stat(filepath.Join(modules, ".modules.yaml")); err != nil {
			if os.IsNotExist(err) {
				return true, nil
			}
			return false, err
		}
	} else if !os.IsNotExist(err) {
		return false, err
	}
	for _, name := range commands {
		if runtime.GOOS == "windows" {
			name += ".cmd"
		}
		info, err := os.Stat(filepath.Join(modules, ".bin", name))
		if os.IsNotExist(err) {
			return true, nil
		}
		if err != nil {
			return false, err
		}
		if !info.Mode().IsRegular() || (runtime.GOOS != "windows" && info.Mode().Perm()&0111 == 0) {
			return true, nil
		}
	}
	return false, nil
}

// PnpmCommand 统一处理 Windows 上的 pnpm 命令脚本。
func PnpmCommand(ctx context.Context, dir string, args ...string) *exec.Cmd {
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.CommandContext(ctx, "cmd.exe", append([]string{"/d", "/c", "pnpm"}, args...)...)
	} else {
		cmd = exec.CommandContext(ctx, "pnpm", args...)
	}
	cmd.Dir = dir
	return cmd
}
