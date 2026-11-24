package workspace

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"buildui/internal/config"
)

// UsesExpo 使用脚手架标记识别路线，依赖变更不影响项目类型。
func UsesExpo(root string) bool {
	data, err := os.ReadFile(filepath.Join(root, config.NativeAppMarker))
	return err == nil && strings.TrimSpace(string(data)) == config.NativeAppTemplate
}

// NativeEntry 返回生成项目的根页面或路由布局，兼容旧入口。
func NativeEntry(root string) string {
	var manifest struct {
		Main string `json:"main"`
	}
	data, err := os.ReadFile(filepath.Join(root, "package.json"))
	if err == nil && json.Unmarshal(data, &manifest) == nil && manifest.Main == config.NativeRouterEntry {
		return config.NativeRouterLayout
	}
	return config.NativeAppEntry
}

// ExpoCommand 以离线模式执行项目自带的 Expo CLI。
func ExpoCommand(ctx context.Context, root string, args ...string) *exec.Cmd {
	cmd := PnpmCommand(ctx, root, append([]string{"exec", "expo"}, args...)...)
	cmd.Env = append(cmd.Environ(), config.NativeExpoOfflineEnv)
	return cmd
}
