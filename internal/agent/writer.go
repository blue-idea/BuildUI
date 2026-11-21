package agent

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"buildui/internal/errs"
)

var (
	// placeholderRegex 检测各种形式的占位符注释
	placeholderRegex = regexp.MustCompile(`(?i)(//\s*todo\b|/\*\s*todo\b|//\s*fixme\b|/\*\s*implement\b|//\s*\.\.\.\s*existing code|//\s*\.\.\.\s*implement|//\s*rest of code)`)
)

// FileWriter 处理工作区内的文件写入与安全校验
type FileWriter struct {
	workspaceRoot string
}

// NewFileWriter 创建文件写入器
func NewFileWriter(workspaceRoot string) *FileWriter {
	return &FileWriter{
		workspaceRoot: workspaceRoot,
	}
}

// ValidateContent 验证源码是否含有非法占位符
func (w *FileWriter) ValidateContent(content string) error {
	if match := placeholderRegex.FindString(content); match != "" {
		return errs.NewValidationError("placeholder comments detected: code must be fully implemented without placeholders (found '"+match+"')", nil)
	}
	return nil
}

// WriteFile 安全落盘文件到工作区
func (w *FileWriter) WriteFile(relPath string, content string) error {
	// 1. 验证零占位符铁律
	if err := w.ValidateContent(content); err != nil {
		return err
	}

	// 2. 路径穿越防护
	cleanRel := filepath.Clean(relPath)
	if filepath.IsAbs(relPath) || strings.HasPrefix(cleanRel, "..") {
		return errs.NewValidationError("invalid file path: path traversal detected ("+relPath+")", nil)
	}

	fullPath := filepath.Join(w.workspaceRoot, cleanRel)

	// 双重保险：确保解析后的完整绝对路径仍在工作区根目录下
	absRoot, err := filepath.Abs(w.workspaceRoot)
	if err != nil {
		return errs.NewInternalError("failed to resolve workspace root path", err)
	}
	absTarget, err := filepath.Abs(fullPath)
	if err != nil {
		return errs.NewInternalError("failed to resolve target file path", err)
	}
	if !strings.HasPrefix(absTarget, absRoot) {
		return errs.NewValidationError("target file path is outside workspace root", nil)
	}

	// 3. 自动递归创建父目录
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return errs.NewInternalError("failed to create directory structure: "+dir, err)
	}

	// 4. 写入文件
	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		return errs.NewInternalError("failed to write file: "+fullPath, err)
	}

	return nil
}
