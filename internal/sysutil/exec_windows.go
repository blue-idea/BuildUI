//go:build windows

package sysutil

import (
	"os/exec"
	"syscall"
)

// createNoWindow 为 Windows API 中的 CREATE_NO_WINDOW 标志位常量 (0x08000000)
const createNoWindow = 0x08000000

// HideWindow 配置命令在 Windows 下不分配、不弹出控制台窗口
func HideWindow(cmd *exec.Cmd) {
	if cmd == nil {
		return
	}
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.HideWindow = true
	cmd.SysProcAttr.CreationFlags |= createNoWindow
}
