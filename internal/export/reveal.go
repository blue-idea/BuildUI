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
	if _, err := os.Stat(cleanPath); err != nil {
		return errs.NewNotFoundError(fmt.Sprintf("target path does not exist: %s", targetPath), err)
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		// Windows: 若为文件则在 explorer 中高亮选中，若为目录则直接打开
		fileInfo, _ := os.Stat(cleanPath)
		if fileInfo != nil && fileInfo.IsDir() {
			cmd = sysutil.Command("explorer.exe", cleanPath)
		} else {
			cmd = sysutil.Command("explorer.exe", fmt.Sprintf("/select,%s", cleanPath))
		}
	case "darwin":
		cmd = sysutil.Command("open", "-R", cleanPath)
	default:
		// Linux 或其他类 Unix
		dir := cleanPath
		if fi, _ := os.Stat(cleanPath); fi != nil && !fi.IsDir() {
			dir = filepath.Dir(cleanPath)
		}
		cmd = sysutil.Command("xdg-open", dir)
	}

	if err := cmd.Start(); err != nil {
		return errs.NewInternalError(fmt.Sprintf("failed to spawn native file manager for: %s", cleanPath), err)
	}

	return nil
}
