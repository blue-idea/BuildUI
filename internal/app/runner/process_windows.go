package runner

import (
	"os/exec"
	"strconv"

	"buildui/internal/sysutil"
)

func configurePreviewProcess(cmd *exec.Cmd) {
	sysutil.HideWindow(cmd)
}

func killPreviewProcess(pid int) error {
	cmd := sysutil.Command("taskkill", "/PID", strconv.Itoa(pid), "/T", "/F")
	return cmd.Run()
}
