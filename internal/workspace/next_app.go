package workspace

import (
	"os"
	"path/filepath"

	"buildui/internal/config"
)

// UsesNext 识别 Next.js 项目，以便选择正确的预览参数和 App Router 入口。
func UsesNext(root string) bool {
	for _, name := range []string{config.NextTemplateConfig, "next.config.mjs", "next.config.js"} {
		if info, err := os.Stat(filepath.Join(root, name)); err == nil && info.Mode().IsRegular() {
			return true
		}
	}
	return false
}
