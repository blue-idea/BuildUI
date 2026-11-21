package workspace

import (
	"errors"
	"io"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"strings"

	"buildui/internal/errs"
)

const maxSourceBytes = 256 * 1024

func isSource(name string) bool {
	clean := filepath.ToSlash(name)
	if !fs.ValidPath(clean) || strings.ContainsAny(clean, "\\:") {
		return false
	}
	for _, part := range strings.Split(clean, "/") {
		switch part {
		case "node_modules", "vendor", "dist", "build", "coverage":
			return false
		}
		if strings.HasPrefix(part, ".") {
			return false
		}
	}
	switch path.Ext(clean) {
	case ".tsx", ".jsx", ".ts", ".js", ".cjs", ".mjs", ".css", ".html", ".json":
		return !strings.HasSuffix(clean, "lock.json")
	default:
		return false
	}
}

// ListSources 枚举工作区源码，跳过依赖、构建产物和符号链接。
func ListSources(dir string) ([]string, error) {
	files := []string{}
	err := filepath.WalkDir(dir, func(name string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if name == dir {
			return nil
		}
		rel, err := filepath.Rel(dir, name)
		if err != nil {
			return err
		}
		if entry.IsDir() {
			if !isSource(filepath.ToSlash(rel) + "/index.ts") {
				return fs.SkipDir
			}
			return nil
		}
		if entry.Type().IsRegular() && isSource(filepath.ToSlash(rel)) {
			files = append(files, filepath.ToSlash(rel))
		}
		return nil
	})
	return files, err
}

// ReadSource 把读取限制在项目根目录内，并限制单个文件大小。
func ReadSource(dir, name string) (string, error) {
	if !isSource(name) {
		return "", errs.NewValidationError("Select a source file inside the project.", nil)
	}
	root, err := os.OpenRoot(dir)
	if err != nil {
		return "", err
	}
	defer root.Close()
	info, err := root.Stat(name)
	if err != nil {
		return "", err
	}
	if !info.Mode().IsRegular() || info.Size() > maxSourceBytes {
		return "", errors.New("The source file is not readable or is too large.")
	}
	file, err := root.Open(name)
	if err != nil {
		return "", err
	}
	defer file.Close()
	content, err := io.ReadAll(io.LimitReader(file, maxSourceBytes+1))
	if len(content) > maxSourceBytes {
		return "", errors.New("The source file is too large.")
	}
	return string(content), err
}
