package plugins

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func stdioCommand(ctx context.Context, endpoint string, args []string) *exec.Cmd {
	command := exec.CommandContext(ctx, endpoint, args...)
	if runtime.GOOS != "windows" || command.Err != nil || !strings.EqualFold(filepath.Base(command.Path), "npx.cmd") {
		return command
	}
	// Windows 的 npx 是批处理脚本。直接运行 npm 的 Node 入口，保留原始参数边界。
	directory := filepath.Dir(command.Path)
	script := filepath.Join(directory, "node_modules", "npm", "bin", "npx-cli.js")
	if info, err := os.Stat(script); err != nil || !info.Mode().IsRegular() {
		return command
	}
	node := filepath.Join(directory, "node.exe")
	if info, err := os.Stat(node); err != nil || !info.Mode().IsRegular() {
		node = "node"
	}
	return exec.CommandContext(ctx, node, append([]string{script}, args...)...)
}
