package updater

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"runtime"
	"strconv"
	"strings"

	"buildui/internal/config"
)

const defaultReleaseAPIBaseURL = "https://api.github.com"

// Config 更新服务配置结构体
type Config struct {
	CurrentVersion    string
	ReleaseAPIBaseURL string
	ReleaseRepository string
	GOOS              string
	GOARCH            string
	HTTPClient        *http.Client
	Emitter           EventEmitter
}

// EventEmitter 事件通知回调函数
type EventEmitter func(ctx context.Context, eventName string, result UpdateCheckResult)

// ReleaseInfo GitHub Release API 返回模型
type ReleaseInfo struct {
	TagName string         `json:"tag_name"`
	HTMLURL string         `json:"html_url"`
	Assets  []ReleaseAsset `json:"assets"`
}

// ReleaseAsset 发布资产项
type ReleaseAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

// UpdateCheckResult 更新检测结果
type UpdateCheckResult struct {
	Available   bool   `json:"available"`
	Version     string `json:"version,omitempty"`
	ReleaseURL  string `json:"releaseUrl,omitempty"`
	DownloadURL string `json:"downloadUrl,omitempty"`
	Error       string `json:"error,omitempty"`
}

// Service 版本更新检测服务
type Service struct {
	config Config
}

// NewService 创建更新检测服务实例
func NewService(configs ...Config) *Service {
	cfg := defaultConfig()
	if len(configs) > 0 {
		cfg = mergeConfig(cfg, configs[0])
	}
	return &Service{config: cfg}
}

func defaultConfig() Config {
	return Config{
		CurrentVersion:    config.AppVersion,
		ReleaseAPIBaseURL: defaultReleaseAPIBaseURL,
		ReleaseRepository: config.ReleaseRepository,
		GOOS:              runtime.GOOS,
		GOARCH:            runtime.GOARCH,
		HTTPClient:        &http.Client{Timeout: config.HTTPTotalTimeout},
	}
}

func mergeConfig(base Config, override Config) Config {
	if override.CurrentVersion != "" {
		base.CurrentVersion = override.CurrentVersion
	}
	if override.ReleaseAPIBaseURL != "" {
		base.ReleaseAPIBaseURL = override.ReleaseAPIBaseURL
	}
	if override.ReleaseRepository != "" {
		base.ReleaseRepository = override.ReleaseRepository
	}
	if override.GOOS != "" {
		base.GOOS = override.GOOS
	}
	if override.GOARCH != "" {
		base.GOARCH = override.GOARCH
	}
	if override.HTTPClient != nil {
		base.HTTPClient = override.HTTPClient
	}
	if override.Emitter != nil {
		base.Emitter = override.Emitter
	}
	return base
}

// CheckForUpdates 查询公开 Release 并比对本地版本
func (s *Service) CheckForUpdates(ctx context.Context) (UpdateCheckResult, error) {
	info, err := s.fetchLatestRelease(ctx)
	if err != nil {
		return UpdateCheckResult{}, err
	}
	if !IsNewerVersion(info.TagName, s.config.CurrentVersion) {
		return UpdateCheckResult{Available: false}, nil
	}

	result := UpdateCheckResult{
		Available:   true,
		Version:     normalizeVersion(info.TagName),
		ReleaseURL:  info.HTMLURL,
		DownloadURL: info.HTMLURL,
	}
	if asset, ok := SelectAssetForPlatform(info.Assets, s.config.GOOS, s.config.GOARCH); ok {
		result.DownloadURL = asset.BrowserDownloadURL
	}
	return result, nil
}

// CheckForUpdatesNow 供 Wails 前端手动触发更新检查
func (s *Service) CheckForUpdatesNow() (UpdateCheckResult, error) {
	return s.CheckForUpdates(context.Background())
}

// CheckAndNotify 检测到新版本时通过注入的事件发送器通知 UI
func (s *Service) CheckAndNotify(ctx context.Context) (UpdateCheckResult, error) {
	result, err := s.CheckForUpdates(ctx)
	if err != nil {
		return UpdateCheckResult{}, err
	}
	if result.Available && s.config.Emitter != nil {
		s.config.Emitter(ctx, config.EventUpdateAvailable, result)
	}
	return result, nil
}

func (s *Service) fetchLatestRelease(ctx context.Context) (ReleaseInfo, error) {
	client := s.config.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}

	endpoint := strings.TrimRight(s.config.ReleaseAPIBaseURL, "/") +
		"/repos/" + strings.Trim(url.PathEscape(s.config.ReleaseRepository), "/") + "/releases/latest"
	endpoint = strings.ReplaceAll(endpoint, "%2F", "/")

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return ReleaseInfo{}, fmt.Errorf("create release request: %w", err)
	}
	request.Header.Set("Accept", "application/vnd.github+json")
	request.Header.Set("User-Agent", config.UserAgent())

	response, err := client.Do(request)
	if err != nil {
		return ReleaseInfo{}, fmt.Errorf("fetch latest release: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return ReleaseInfo{}, fmt.Errorf("fetch latest release: unexpected status %d", response.StatusCode)
	}

	var info ReleaseInfo
	if err := json.NewDecoder(response.Body).Decode(&info); err != nil {
		return ReleaseInfo{}, fmt.Errorf("decode latest release: %w", err)
	}
	return info, nil
}

// IsNewerVersion 比较两版本号，若 latest > current 则返回 true
func IsNewerVersion(latest string, current string) bool {
	latestParts, latestOK := parseVersion(latest)
	currentParts, currentOK := parseVersion(current)
	if !latestOK || !currentOK {
		return false
	}
	for i := range latestParts {
		if latestParts[i] > currentParts[i] {
			return true
		}
		if latestParts[i] < currentParts[i] {
			return false
		}
	}
	return false
}

func normalizeVersion(version string) string {
	return strings.TrimPrefix(strings.TrimSpace(version), "v")
}

func parseVersion(version string) ([3]int, bool) {
	var result [3]int
	normalized := normalizeVersion(version)
	if normalized == "" {
		return result, false
	}
	normalized = strings.Split(normalized, "-")[0]
	parts := strings.Split(normalized, ".")
	if len(parts) != 3 {
		return result, false
	}
	for i, part := range parts {
		number, err := strconv.Atoi(part)
		if err != nil || number < 0 {
			return result, false
		}
		result[i] = number
	}
	return result, true
}

// SelectAssetForPlatform 根据操作系统与架构选出最适用的安装资产
func SelectAssetForPlatform(assets []ReleaseAsset, goos string, arch string) (ReleaseAsset, bool) {
	bestScore := -1
	var best ReleaseAsset
	for _, asset := range assets {
		score := assetScore(asset.Name, goos, arch)
		if score > bestScore {
			bestScore = score
			best = asset
		}
	}
	if bestScore < 0 {
		return ReleaseAsset{}, false
	}
	return best, true
}

func assetScore(name string, goos string, arch string) int {
	lower := strings.ToLower(name)
	switch goos {
	case "darwin":
		if strings.HasSuffix(lower, ".dmg") {
			return 100
		}
		if (strings.Contains(lower, "darwin") || strings.Contains(lower, "macos")) && matchesArch(lower, arch) {
			return 80
		}
	case "windows":
		if !(strings.Contains(lower, "windows") || strings.Contains(lower, "win")) || !matchesArch(lower, arch) {
			return -1
		}
		if strings.HasSuffix(lower, ".msi") {
			return 100
		}
		if strings.HasSuffix(lower, ".exe") {
			return 95
		}
		if strings.HasSuffix(lower, ".zip") {
			return 70
		}
	case "linux":
		if !strings.Contains(lower, "linux") || !matchesArch(lower, arch) {
			return -1
		}
		if strings.HasSuffix(lower, ".appimage") {
			return 100
		}
		if strings.HasSuffix(lower, ".deb") {
			return 90
		}
		if strings.HasSuffix(lower, ".rpm") {
			return 80
		}
		if strings.HasSuffix(lower, ".tar.gz") || strings.HasSuffix(lower, ".tgz") {
			return 70
		}
	}
	return -1
}

func matchesArch(name string, arch string) bool {
	switch arch {
	case "amd64":
		return strings.Contains(name, "amd64") || strings.Contains(name, "x64") || strings.Contains(name, "x86_64")
	case "arm64":
		return strings.Contains(name, "arm64") || strings.Contains(name, "aarch64") || strings.Contains(name, "universal")
	default:
		return strings.Contains(name, arch)
	}
}
