package config

import "time"

const (
	AppVersion        = "0.1.2"
	ReleaseRepository = "blue-idea/BuildUI"
	HTTPTotalTimeout  = 10 * time.Second

	// 项目封面截图集中配置
	ThumbnailDirName     = "thumbnails"
	ScreenshotWidth      = 1280
	ScreenshotHeight     = 800
	ScreenshotTimeout    = 20 * time.Second
	MaxThumbnailBytes    = 5 * 1024 * 1024
	EnvScreenshotBrowser = "BUILDUI_SCREENSHOT_BROWSER"

	EventUpdateAvailable     = "buildui:update-available"
	EventUpdateCheckStarted  = "buildui:update-check-started"
	EventUpdateCheckFinished = "buildui:update-check-finished"
)

// UserAgent 生成标准的 HTTP 请求 User-Agent
func UserAgent() string {
	return "BuildUI/" + AppVersion
}
