package scaffold

import (
	"embed"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"buildui/internal/config"
	"buildui/internal/errs"
)

//go:embed all:template all:native-template
var templateFS embed.FS

// Extract 将嵌入的脚手架模板解压写入目标目录
func Extract(targetDir string, appName string) error {
	return extract(targetDir, appName, "template", "vite_react_shadcn_ts")
}

// ExtractForTemplate 根据创建请求选择脚手架，保留旧请求的默认行为。
func ExtractForTemplate(targetDir, appName, templateID string) error {
	if templateID == config.NativeAppTemplate {
		return extract(targetDir, appName, "native-template", config.NativeAppPackageName)
	}
	return Extract(targetDir, appName)
}

func extract(targetDir, appName, templateDir, originalName string) error {
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return errs.NewInternalError(fmt.Sprintf("failed to create target directory: %s", targetDir), err)
	}

	err := fs.WalkDir(templateFS, templateDir, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		// 计算相对路径
		relPath, err := filepath.Rel(templateDir, path)
		if err != nil {
			return err
		}
		if relPath == "." {
			return nil
		}

		destPath := filepath.Join(targetDir, relPath)

		if d.IsDir() {
			return os.MkdirAll(destPath, 0755)
		}

		data, err := templateFS.ReadFile(path)
		if err != nil {
			return err
		}

		// 如果是 package.json，动态替换应用名
		if filepath.Base(path) == "package.json" && appName != "" {
			slug := toSlug(appName)
			content := string(data)
			content = strings.Replace(content, fmt.Sprintf(`"name": "%s"`, originalName), fmt.Sprintf(`"name": "%s"`, slug), 1)
			data = []byte(content)
		}

		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			return err
		}

		return os.WriteFile(destPath, data, 0644)
	})

	if err != nil {
		return errs.NewInternalError(fmt.Sprintf("failed to extract scaffold to %s", targetDir), err)
	}

	return nil
}

func toSlug(name string) string {
	lower := strings.ToLower(name)
	var b strings.Builder
	for _, r := range lower {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			b.WriteRune(r)
		} else if r == ' ' || r == '_' {
			b.WriteRune('-')
		}
	}
	res := strings.Trim(b.String(), "-")
	if res == "" {
		return "my-ai-app"
	}
	return res
}
