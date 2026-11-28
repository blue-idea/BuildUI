package app

import (
	"context"
	"encoding/base64"
	"fmt"
	"net"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"buildui/internal/config"
	"buildui/internal/errs"
	"buildui/internal/sysutil"
)

// ScreenshotCapturer 抽象页面无头截图引擎，便于单元测试注入替身
type ScreenshotCapturer interface {
	CaptureURL(ctx context.Context, targetURL string) ([]byte, error)
}

// 支持的缩略图 MIME 类型与扩展名映射
type thumbnailFormat struct {
	mime string
	ext  string
}

var supportedThumbnailFormats = []thumbnailFormat{
	{mime: "image/png", ext: ".png"},
	{mime: "image/jpeg", ext: ".jpg"},
	{mime: "image/webp", ext: ".webp"},
}

// SetThumbnailDir 设置项目缩略图持久化根目录（位于应用数据目录内，不污染项目 Git 工作区）
func (s *AppService) SetThumbnailDir(dir string) {
	s.thumbnailDir = strings.TrimSpace(dir)
}

// SetScreenshotCapturer 注入自定义截图引擎（主要用于测试或扩展）
func (s *AppService) SetScreenshotCapturer(capturer ScreenshotCapturer) {
	s.screenshotCapturer = capturer
}

// resolveThumbnailDir 返回当前有效的缩略图存储目录
func (s *AppService) resolveThumbnailDir() string {
	if s.thumbnailDir != "" {
		return filepath.Clean(s.thumbnailDir)
	}
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "."
	}
	return filepath.Join(configDir, "buildui", config.ThumbnailDirName)
}

// SaveAppThumbnail 校验并持久化项目封面缩略图，返回规范化 DataURL
// 覆盖验收标准：v33.REQ-001-AC-001, v33.REQ-001-AC-003
func (s *AppService) SaveAppThumbnail(ctx context.Context, appID int64, dataURL string) (string, error) {
	if appID <= 0 {
		return "", errs.NewValidationError("app id must be positive", nil)
	}
	if _, err := s.appRepo.GetByID(ctx, appID); err != nil {
		return "", err
	}

	mimeType, ext, rawBytes, err := decodeThumbnailDataURL(dataURL)
	if err != nil {
		return "", err
	}

	if err := s.writeThumbnailBytes(appID, ext, rawBytes); err != nil {
		return "", err
	}

	return encodeThumbnailDataURL(mimeType, rawBytes), nil
}

// CaptureAppScreenshot 捕获项目预览页面截图并持久化为项目封面
// 覆盖验收标准：v33.REQ-001-AC-002, v33.REQ-001-AC-003
func (s *AppService) CaptureAppScreenshot(ctx context.Context, appID int64, targetURL string) (string, error) {
	if appID <= 0 {
		return "", errs.NewValidationError("app id must be positive", nil)
	}
	appEntity, err := s.appRepo.GetByID(ctx, appID)
	if err != nil {
		return "", err
	}

	captureURL := strings.TrimSpace(targetURL)
	startedEphemeral := false

	if captureURL != "" {
		if err := validateLocalScreenshotURL(captureURL); err != nil {
			return "", err
		}
	} else {
		if s.runner != nil {
			captureURL = strings.TrimSpace(s.runner.PreviewURL(appID))
		}
		if captureURL == "" {
			if s.runner == nil {
				return "", errs.NewPreconditionError("preview runner is unavailable", nil)
			}
			started, startErr := s.runner.StartApp(ctx, appID, appEntity.Path)
			if startErr != nil {
				return "", startErr
			}
			captureURL = strings.TrimSpace(started.PreviewURL)
			startedEphemeral = true
			defer func() {
				if startedEphemeral {
					_ = s.runner.StopApp(context.Background(), appID)
				}
			}()
		}
		if err := validateLocalScreenshotURL(captureURL); err != nil {
			return "", err
		}
	}

	capturer := s.screenshotCapturer
	if capturer == nil {
		capturer = &headlessBrowserCapturer{}
	}

	captureCtx, cancel := context.WithTimeout(ctx, config.ScreenshotTimeout)
	defer cancel()

	pngBytes, err := capturer.CaptureURL(captureCtx, captureURL)
	if err != nil {
		return "", errs.NewExternalError(fmt.Sprintf("failed to capture project screenshot: %v", err), err)
	}
	if len(pngBytes) == 0 {
		return "", errs.NewExternalError("captured screenshot is empty", nil)
	}
	if len(pngBytes) > config.MaxThumbnailBytes {
		return "", errs.NewValidationError("captured screenshot exceeds maximum allowed size", nil)
	}

	if err := s.writeThumbnailBytes(appID, ".png", pngBytes); err != nil {
		return "", err
	}

	return encodeThumbnailDataURL("image/png", pngBytes), nil
}

// writeThumbnailBytes 原子写入缩略图并清理同项目其他扩展名的旧缩略图
func (s *AppService) writeThumbnailBytes(appID int64, ext string, data []byte) error {
	dir := s.resolveThumbnailDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		return errs.NewInternalError("failed to prepare thumbnail directory", err)
	}

	targetPath := filepath.Join(dir, fmt.Sprintf("app-%d%s", appID, ext))
	tmpFile, err := os.CreateTemp(dir, fmt.Sprintf("app-%d-*.tmp", appID))
	if err != nil {
		return errs.NewInternalError("failed to create temporary thumbnail file", err)
	}
	tmpPath := tmpFile.Name()
	if _, err := tmpFile.Write(data); err != nil {
		_ = tmpFile.Close()
		_ = os.Remove(tmpPath)
		return errs.NewInternalError("failed to write thumbnail data", err)
	}
	if err := tmpFile.Close(); err != nil {
		_ = os.Remove(tmpPath)
		return errs.NewInternalError("failed to flush thumbnail file", err)
	}
	// Windows 下目标文件存在时先移除旧目标，避免 Rename 失败
	_ = os.Remove(targetPath)
	if err := os.Rename(tmpPath, targetPath); err != nil {
		_ = os.Remove(tmpPath)
		return errs.NewInternalError("failed to commit thumbnail file", err)
	}

	for _, format := range supportedThumbnailFormats {
		if format.ext != ext {
			_ = os.Remove(filepath.Join(dir, fmt.Sprintf("app-%d%s", appID, format.ext)))
		}
	}
	return nil
}

// loadAppThumbnail 读取磁盘中已持久化的项目缩略图 DataURL（不存在时返回空字符串）
func (s *AppService) loadAppThumbnail(appID int64) string {
	dir := s.resolveThumbnailDir()
	for _, format := range supportedThumbnailFormats {
		filePath := filepath.Join(dir, fmt.Sprintf("app-%d%s", appID, format.ext))
		info, err := os.Stat(filePath)
		if err != nil || info.IsDir() || info.Size() == 0 || info.Size() > config.MaxThumbnailBytes {
			continue
		}
		data, err := os.ReadFile(filePath)
		if err != nil || len(data) == 0 {
			continue
		}
		return encodeThumbnailDataURL(format.mime, data)
	}
	return ""
}

// deleteAppThumbnail 清理指定项目的所有缩略图文件
func (s *AppService) deleteAppThumbnail(appID int64) {
	dir := s.resolveThumbnailDir()
	for _, format := range supportedThumbnailFormats {
		_ = os.Remove(filepath.Join(dir, fmt.Sprintf("app-%d%s", appID, format.ext)))
	}
}

func encodeThumbnailDataURL(mimeType string, data []byte) string {
	return "data:" + mimeType + ";base64," + base64.StdEncoding.EncodeToString(data)
}

func decodeThumbnailDataURL(raw string) (string, string, []byte, error) {
	trimmed := strings.TrimSpace(raw)
	if !strings.HasPrefix(trimmed, "data:") {
		return "", "", nil, errs.NewValidationError("thumbnail must be a valid image data URL", nil)
	}
	commaIdx := strings.Index(trimmed, ",")
	if commaIdx <= 5 {
		return "", "", nil, errs.NewValidationError("thumbnail data URL is malformed", nil)
	}
	meta := trimmed[len("data:"):commaIdx]
	payload := trimmed[commaIdx+1:]
	if !strings.HasSuffix(meta, ";base64") {
		return "", "", nil, errs.NewValidationError("thumbnail data URL must be base64 encoded", nil)
	}
	mimeType := strings.ToLower(strings.TrimSuffix(meta, ";base64"))

	ext := ""
	for _, format := range supportedThumbnailFormats {
		if format.mime == mimeType {
			ext = format.ext
			break
		}
	}
	if ext == "" {
		return "", "", nil, errs.NewValidationError("unsupported thumbnail image format; expected png, jpeg, or webp", nil)
	}

	decoded, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return "", "", nil, errs.NewValidationError("invalid base64 payload in thumbnail data URL", err)
	}
	if len(decoded) == 0 {
		return "", "", nil, errs.NewValidationError("thumbnail image payload is empty", nil)
	}
	if len(decoded) > config.MaxThumbnailBytes {
		return "", "", nil, errs.NewValidationError("thumbnail image exceeds maximum allowed size", nil)
	}
	return mimeType, ext, decoded, nil
}

// validateLocalScreenshotURL 严格限定只允许截取本机 loopback 预览地址，防御 SSRF
func validateLocalScreenshotURL(raw string) error {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return errs.NewValidationError("invalid preview URL for screenshot", err)
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return errs.NewValidationError("screenshot URL must use http or https scheme", nil)
	}
	host := strings.ToLower(parsed.Hostname())
	if host == "localhost" {
		return nil
	}
	if ip := net.ParseIP(host); ip != nil && ip.IsLoopback() {
		return nil
	}
	return errs.NewValidationError("screenshot URL must target a local loopback preview address", nil)
}

// headlessBrowserCapturer 调用本机已安装的 Chromium/Edge/Chrome 无头模式截取高保真画面
type headlessBrowserCapturer struct{}

func (c *headlessBrowserCapturer) CaptureURL(ctx context.Context, targetURL string) ([]byte, error) {
	browserPath, err := findHeadlessBrowserBinary()
	if err != nil {
		return nil, err
	}

	tmpDir, err := os.MkdirTemp("", "buildui-shot-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tmpDir)

	outPath := filepath.Join(tmpDir, "capture.png")
	userDataDir := filepath.Join(tmpDir, "profile")
	windowSize := strconv.Itoa(config.ScreenshotWidth) + "," + strconv.Itoa(config.ScreenshotHeight)

	// 兼容新版 --headless=new 与传统 --headless
	attempts := [][]string{
		{
			"--headless=new",
			"--disable-gpu",
			"--hide-scrollbars",
			"--no-first-run",
			"--no-default-browser-check",
			"--user-data-dir=" + userDataDir,
			"--window-size=" + windowSize,
			"--virtual-time-budget=3000",
			"--screenshot=" + outPath,
			targetURL,
		},
		{
			"--headless",
			"--disable-gpu",
			"--hide-scrollbars",
			"--no-first-run",
			"--no-default-browser-check",
			"--user-data-dir=" + userDataDir,
			"--window-size=" + windowSize,
			"--virtual-time-budget=3000",
			"--screenshot=" + outPath,
			targetURL,
		},
	}

	var lastErr error
	for _, args := range attempts {
		cmd := sysutil.CommandContext(ctx, browserPath, args...)
		out, runErr := cmd.CombinedOutput()
		if data, readErr := os.ReadFile(outPath); readErr == nil && len(data) > 0 {
			return data, nil
		}
		if runErr != nil {
			lastErr = fmt.Errorf("%w (%s)", runErr, strings.TrimSpace(string(out)))
		} else {
			lastErr = fmt.Errorf("headless browser exited without producing screenshot")
		}
	}
	return nil, lastErr
}

// findHeadlessBrowserBinary 查找本机可用的 Chrome/Edge/Chromium 可执行文件路径
func findHeadlessBrowserBinary() (string, error) {
	if custom := strings.TrimSpace(os.Getenv(config.EnvScreenshotBrowser)); custom != "" {
		if info, err := os.Stat(custom); err == nil && !info.IsDir() {
			return custom, nil
		}
	}

	var candidates []string
	switch runtime.GOOS {
	case "windows":
		programFiles := os.Getenv("ProgramFiles")
		programFilesX86 := os.Getenv("ProgramFiles(x86)")
		localAppData := os.Getenv("LocalAppData")
		for _, base := range []string{programFiles, programFilesX86, localAppData} {
			if base == "" {
				continue
			}
			candidates = append(candidates,
				filepath.Join(base, "Microsoft", "Edge", "Application", "msedge.exe"),
				filepath.Join(base, "Google", "Chrome", "Application", "chrome.exe"),
				filepath.Join(base, "Chromium", "Application", "chrome.exe"),
			)
		}
		candidates = append(candidates, "msedge.exe", "chrome.exe", "chromium.exe")
	case "darwin":
		candidates = append(candidates,
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
			"google-chrome",
			"chromium",
		)
	default:
		candidates = append(candidates,
			"google-chrome",
			"google-chrome-stable",
			"chromium",
			"chromium-browser",
			"microsoft-edge",
		)
	}

	for _, candidate := range candidates {
		if filepath.IsAbs(candidate) {
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
				return candidate, nil
			}
			continue
		}
		if resolved, err := exec.LookPath(candidate); err == nil && resolved != "" {
			return resolved, nil
		}
	}

	return "", fmt.Errorf("no supported headless browser (Edge/Chrome/Chromium) found")
}
