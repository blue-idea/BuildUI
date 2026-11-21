package worktree

import (
	"crypto/rand"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// GenerateWorktreeName 生成符合 ^.dyad-build-[A-Za-z0-9]{6}$ 规范的随机工作区名称
func GenerateWorktreeName() string {
	b := make([]byte, 6)
	_, _ = rand.Read(b)
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return WorktreePrefix + string(b)
}

// defaultExcludedNames 严禁复制到临时隔离 Worktree 的目录或文件
var defaultExcludedNames = map[string]bool{
	"node_modules": true,
	".git":         true,
	"dist":         true,
	".next":        true,
	".vite":        true,
	"coverage":     true,
	"out":          true,
	".turbo":       true,
}

// CopyOverlay 将工作区修改与未提交文件复制覆盖到目标 Worktree，严格排除依赖与构建产物
func CopyOverlay(sourceDir, destDir string) error {
	absSource, err := filepath.Abs(sourceDir)
	if err != nil {
		return err
	}
	absDest, err := filepath.Abs(destDir)
	if err != nil {
		return err
	}

	return filepath.Walk(absSource, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		rel, err := filepath.Rel(absSource, path)
		if err != nil {
			return err
		}

		if rel == "." {
			return nil
		}

		// 检查路径中的每一个 segment 是否匹配排除列表
		parts := strings.Split(filepath.ToSlash(rel), "/")
		for _, part := range parts {
			if defaultExcludedNames[part] || strings.HasPrefix(part, WorktreePrefix) {
				if info.IsDir() {
					return filepath.SkipDir
				}
				return nil
			}
		}

		targetPath := filepath.Join(absDest, rel)

		if info.IsDir() {
			return os.MkdirAll(targetPath, info.Mode())
		}

		// 如果是常规文件，执行覆盖写入
		if info.Mode().IsRegular() {
			if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
				return err
			}
			return copyFile(path, targetPath, info.Mode())
		}

		return nil
	})
}

func copyFile(src, dst string, mode os.FileMode) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, mode)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}
