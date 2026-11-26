package scaffold

import (
	"embed"
	"os"
	"path/filepath"
	"strings"
)

//go:embed expo-preview/*.cjs
var expoPreviewFS embed.FS

// AutoHealNativeRouterEntry 检查项目根路由与 (tabs) 组的冲突，当使用 (tabs) 但根路由仍为脚手架初始占位时，自动重定向至 (tabs)。
func AutoHealNativeRouterEntry(project string) error {
	indexPath := filepath.Join(project, "src", "app", "index.tsx")
	tabsDir := filepath.Join(project, "src", "app", "(tabs)")

	// 检查是否存在 (tabs) 目录
	info, err := os.Stat(tabsDir)
	if err != nil || !info.IsDir() {
		return nil
	}

	// 检查 src/app/index.tsx 是否存在
	data, err := os.ReadFile(indexPath)
	if err != nil {
		return nil
	}

	content := string(data)
	// 检查是否包含脚手架初始模版特征
	if strings.Contains(content, "Your app is ready to build.") || strings.Contains(content, "export default function HomeScreen()") {
		redirectContent := `import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}
`
		return os.WriteFile(indexPath, []byte(redirectContent), 0644)
	}

	return nil
}

// PrepareExpoPreview 将临时配置放入 Expo 缓存，确保 Metro 在 Windows 上从同一盘符读取脚本。
func PrepareExpoPreview(project string) (string, func(), error) {
	_ = AutoHealNativeRouterEntry(project)
	return preparePreviewAssets(project, ".expo", expoPreviewFS, "expo-preview/metro.config.cjs", "expo-preview/transformer.cjs")
}
