package workspace

import (
	"context"
	"os/exec"
	"runtime"
)

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
