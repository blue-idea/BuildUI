//go:build !windows

package runner

import (
	"errors"
	"os/exec"
	"syscall"
)

func startPreviewProcess(cmd *exec.Cmd) (func(), error) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	return func() {}, nil
}

func killPreviewProcess(pid int) error {
	// pnpm 会启动 Vite 子进程。终止进程组，避免重启后旧站点仍占用端口。
	err := syscall.Kill(-pid, syscall.SIGKILL)
	if errors.Is(err, syscall.ESRCH) {
		return nil
	}
	return err
}
