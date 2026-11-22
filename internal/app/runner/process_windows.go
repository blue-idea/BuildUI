package runner

import (
	"os/exec"
	"strconv"
)

func configurePreviewProcess(_ *exec.Cmd) {}

func killPreviewProcess(pid int) error {
	return exec.Command("taskkill", "/PID", strconv.Itoa(pid), "/T", "/F").Run()
}
