//go:build !windows

package sysutil

import "os/exec"

// HideWindow 在类 Unix 系统（macOS, Linux 等）上为无操作
func HideWindow(cmd *exec.Cmd) {}
