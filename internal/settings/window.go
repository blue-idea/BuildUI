package settings

import (
	"strconv"
	"strings"

	"buildui/internal/config"
)

// WindowSize 表示窗口的宽高尺寸
type WindowSize struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// ShouldRememberWindowSize 判断是否开启了记忆窗口大小功能（默认开启）
func ShouldRememberWindowSize(settings map[string]string) bool {
	if settings == nil {
		return config.DefaultRememberWindowSize
	}
	val, ok := settings[config.KeyRememberWindowSize]
	if !ok {
		return config.DefaultRememberWindowSize
	}
	trimmed := strings.ToLower(strings.TrimSpace(val))
	if trimmed == "false" || trimmed == "0" {
		return false
	}
	return true
}

// ValidateAndNormalizeWindowSize 校验窗口尺寸是否有效并做安全标准化
func ValidateAndNormalizeWindowSize(width, height int) (WindowSize, bool) {
	if width < config.MinWindowWidth || height < config.MinWindowHeight {
		return WindowSize{
			Width:  config.DefaultWindowWidth,
			Height: config.DefaultWindowHeight,
		}, false
	}
	return WindowSize{
		Width:  width,
		Height: height,
	}, true
}

// ResolveStartupWindowSize 计算应用启动时应当采用的窗口尺寸
func ResolveStartupWindowSize(settings map[string]string) WindowSize {
	defaultSize := WindowSize{
		Width:  config.DefaultWindowWidth,
		Height: config.DefaultWindowHeight,
	}

	if !ShouldRememberWindowSize(settings) {
		return defaultSize
	}

	widthStr := strings.TrimSpace(settings[config.KeyWindowWidth])
	heightStr := strings.TrimSpace(settings[config.KeyWindowHeight])
	if widthStr == "" || heightStr == "" {
		return defaultSize
	}

	width, errW := strconv.Atoi(widthStr)
	height, errH := strconv.Atoi(heightStr)
	if errW != nil || errH != nil {
		return defaultSize
	}

	normalized, ok := ValidateAndNormalizeWindowSize(width, height)
	if !ok {
		return defaultSize
	}

	return normalized
}
