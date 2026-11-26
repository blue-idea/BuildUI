package export

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"buildui/internal/errs"
	"buildui/internal/sysutil"
)

// OpenInFileManager 跨平台唤起操作系统原生资源管理器定位指定路径
func (s *ExportService) OpenInFileManager(targetPath string) error {
	cleanPath := filepath.Clean(targetPath)
	info, err := os.Stat(cleanPath)
	if err != nil {
		return errs.NewNotFoundError(fmt.Sprintf("target path does not exist: %s", targetPath), err)
	}

	cmd := fileManagerCommand(cleanPath, info.IsDir())
	if err := cmd.Start(); err != nil {
		return errs.NewInternalError(fmt.Sprintf("failed to spawn native file manager for: %s", cleanPath), err)
	}
	go func() { _ = cmd.Wait() }()
	return nil
}

func fileManagerCommand(path string, isDir bool) *exec.Cmd {
	switch runtime.GOOS {
	case "windows":
		// Explorer 需要可见窗口，避免使用隐藏窗口的命令构造器。
		if isDir {
			return exec.Command("explorer.exe", path)
		}
		// 将路径作为单独参数，让 Go 仅为路径添加引号。
		return exec.Command("explorer.exe", "/select,", path)
	case "darwin":
		return sysutil.Command("open", "-R", path)
	default:
		if !isDir {
			path = filepath.Dir(path)
		}
		return sysutil.Command("xdg-open", path)
	}
}
