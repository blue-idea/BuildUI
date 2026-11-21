package runner

import (
	"regexp"
	"strings"
)

var (
	// ansiRegex 剥除 ANSI 控制符与颜色代码
	ansiRegex = regexp.MustCompile(`\x1b\[[0-9;]*[a-zA-Z]`)

	// urlRegex 匹配类似 http://localhost:5173 或 http://127.0.0.1:3000
	urlRegex = regexp.MustCompile(`https?://(?:localhost|127\.0\.0\.1):\d+`)
)

// ExtractPreviewURL 从 Vite 输出日志中动态捕获监听端口的 URL
func ExtractPreviewURL(logText string) string {
	clean := ansiRegex.ReplaceAllString(logText, "")
	match := urlRegex.FindString(clean)
	return strings.TrimSuffix(match, "/")
}
