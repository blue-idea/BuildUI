package config

import "time"

const (
	AppVersion        = "0.1.1"
	ReleaseRepository = "blue-idea/BuildUI"
	HTTPTotalTimeout  = 10 * time.Second

	EventUpdateAvailable     = "buildui:update-available"
	EventUpdateCheckStarted  = "buildui:update-check-started"
	EventUpdateCheckFinished = "buildui:update-check-finished"
)

// UserAgent 生成标准的 HTTP 请求 User-Agent
func UserAgent() string {
	return "BuildUI/" + AppVersion
}
