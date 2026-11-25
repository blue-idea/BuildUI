package sysutil

import (
	"context"
	"os/exec"
)

// Command 创建并返回带有静默窗口配置的 exec.Cmd
func Command(name string, arg ...string) *exec.Cmd {
	cmd := exec.Command(name, arg...)
	HideWindow(cmd)
	return cmd
}

// CommandContext 创建并返回带有静默窗口配置的 exec.Cmd（支持 Context 撤销与超时）
func CommandContext(ctx context.Context, name string, arg ...string) *exec.Cmd {
	cmd := exec.CommandContext(ctx, name, arg...)
	HideWindow(cmd)
	return cmd
}
