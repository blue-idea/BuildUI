package export

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"buildui/internal/errs"
)

// ExportService 负责工程打包导出与文件系统定位
type ExportService struct{}

func NewExportService() *ExportService {
	return &ExportService{}
}

// ExportAppZip 递归打包应用目录为 Zip 文件，自动过滤 .git, node_modules, dist 并防御 Zip Slip
func (s *ExportService) ExportAppZip(ctx context.Context, appPath string, outputPath string) (string, error) {
	cleanAppPath := filepath.Clean(appPath)
	info, err := os.Stat(cleanAppPath)
	if err != nil {
		return "", errs.NewNotFoundError(fmt.Sprintf("app path does not exist: %s", appPath), err)
	}
	if !info.IsDir() {
		return "", errs.NewValidationError("app path must be a directory", nil)
	}

	dest := strings.TrimSpace(outputPath)
	if dest == "" {
		appName := filepath.Base(cleanAppPath)
		dest = filepath.Join(os.TempDir(), fmt.Sprintf("%s-export.zip", appName))
	}
	_ = os.MkdirAll(filepath.Dir(dest), 0755)

	outFile, err := os.Create(dest)
	if err != nil {
		return "", errs.NewInternalError(fmt.Sprintf("failed to create zip file: %s", dest), err)
	}
	defer outFile.Close()

	zipWriter := zip.NewWriter(outFile)
	defer zipWriter.Close()

	err = filepath.Walk(cleanAppPath, func(path string, fileInfo os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		relPath, err := filepath.Rel(cleanAppPath, path)
		if err != nil {
			return err
		}

		if relPath == "." {
			return nil
		}

		// 防御 Zip Slip 路径遍历攻击
		if strings.HasPrefix(relPath, "..") || filepath.IsAbs(relPath) {
			return errs.NewValidationError("path traversal attempt detected in export", nil)
		}

		slashRel := filepath.ToSlash(relPath)

		// 检查过滤排除目录
		baseName := filepath.Base(path)
		if fileInfo.IsDir() {
			if baseName == ".git" || baseName == "node_modules" || baseName == "dist" {
				return filepath.SkipDir
			}
			return nil
		}

		// 忽略处于排除目录下的文件（双重保险）
		if strings.HasPrefix(slashRel, ".git/") || strings.HasPrefix(slashRel, "node_modules/") || strings.HasPrefix(slashRel, "dist/") {
			return nil
		}

		zipEntry, err := zipWriter.Create(slashRel)
		if err != nil {
			return err
		}

		srcFile, err := os.Open(path)
		if err != nil {
			return err
		}
		defer srcFile.Close()

		_, err = io.Copy(zipEntry, srcFile)
		return err
	})

	if err != nil {
		return "", errs.NewInternalError("failed to archive application directory", err)
	}

	return dest, nil
}
