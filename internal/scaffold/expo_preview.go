package scaffold

import (
	"embed"
	"os"
	"path/filepath"
)

//go:embed expo-preview/*.cjs
var expoPreviewFS embed.FS

// PrepareExpoPreview 将临时配置放入 Expo 缓存，确保 Metro 在 Windows 上从同一盘符读取脚本。
func PrepareExpoPreview(project string) (string, func(), error) {
	cache, err := filepath.Abs(filepath.Join(project, ".expo"))
	if err != nil {
		return "", nil, err
	}
	if err := os.MkdirAll(cache, 0755); err != nil {
		return "", nil, err
	}
	dir, err := os.MkdirTemp(cache, "buildui-preview-")
	if err != nil {
		return "", nil, err
	}
	cleanup := func() { _ = os.RemoveAll(dir) }
	for _, name := range []string{"metro.config.cjs", "transformer.cjs", "preview-inspector.js"} {
		var data []byte
		if name == "preview-inspector.js" {
			data, err = templateFS.ReadFile("template/src/" + name)
		} else {
			data, err = expoPreviewFS.ReadFile("expo-preview/" + name)
		}
		if err == nil {
			err = os.WriteFile(filepath.Join(dir, name), data, 0600)
		}
		if err != nil {
			cleanup()
			return "", nil, err
		}
	}
	return filepath.Join(dir, "metro.config.cjs"), cleanup, nil
}
