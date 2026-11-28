package scaffold

import (
	"bytes"
	"crypto/sha256"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"slices"

	"buildui/internal/config"
)

// RefreshVitePreviewInspector 更新旧工程中未经修改的脚手架检查脚本。
func RefreshVitePreviewInspector(project string) error {
	current, err := templateFS.ReadFile(config.ReactPreviewInspectorAsset)
	if err != nil {
		return err
	}
	filename := filepath.Join(project, config.ReactPreviewInspectorPath)
	return refreshVitePreviewInspector(filename, current, config.LegacyReactPreviewInspectorHashes)
}

func refreshVitePreviewInspector(filename string, current []byte, legacyHashes []string) error {
	info, err := os.Lstat(filename)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() {
		return nil
	}
	previous, err := os.ReadFile(filename)
	if err != nil {
		return err
	}
	normalized := bytes.ReplaceAll(previous, []byte("\r\n"), []byte("\n"))
	hash := fmt.Sprintf("%x", sha256.Sum256(normalized))
	if !slices.Contains(legacyHashes, hash) {
		return nil
	}

	// 在同目录完成写入后再替换，避免中途失败留下不完整的脚本。
	replacement, err := os.CreateTemp(filepath.Dir(filename), ".preview-inspector-*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(replacement.Name())
	_, writeErr := replacement.Write(current)
	if err := errors.Join(writeErr, replacement.Close()); err != nil {
		return err
	}
	if err := os.Chmod(replacement.Name(), info.Mode().Perm()); err != nil {
		return err
	}
	return os.Rename(replacement.Name(), filename)
}
