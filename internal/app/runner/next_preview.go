package runner

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"buildui/internal/config"
)

var nextLocalLine = regexp.MustCompile(`^\s*(?:-\s*)?Local:\s+(https?://(?:localhost|127\.0\.0\.1):(\d+))/?\s*$`)

func isNextPreviewConflict(line string) bool {
	message := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(line), "⨯"))
	return message == "Another next dev server is already running."
}

func nextPreviewURL(cleanLine string) string {
	match := nextLocalLine.FindStringSubmatch(cleanLine)
	if match == nil {
		return ""
	}
	if port, err := strconv.ParseUint(match[2], 10, 16); err != nil || port == 0 {
		return ""
	}
	return match[1]
}

func waitForNextPreview(ctx context.Context, reported <-chan string, ready chan<- string) {
	select {
	case address := <-reported:
		if nextPreviewResponds(ctx, address) {
			ready <- address
		}
	case <-ctx.Done():
	}
}

// 冲突段落之前的 Local 行来自失败的新进程，不能用作已运行服务的地址。
func existingNextPreviewURL(projectPath, startupLog string) string {
	var address string
	var checkingConflict bool
	for _, raw := range strings.Split(startupLog, "\n") {
		line := strings.TrimSpace(raw)
		if isNextPreviewConflict(line) {
			checkingConflict = true
			address = ""
			continue
		}
		if !checkingConflict {
			continue
		}
		if dir, ok := strings.CutPrefix(line, "- Dir:"); ok {
			dir = strings.TrimSpace(dir)
			if address == "" || !filepath.IsAbs(dir) {
				return ""
			}
			project, projectErr := os.Stat(projectPath)
			existing, existingErr := os.Stat(dir)
			if projectErr == nil && existingErr == nil && project.IsDir() && os.SameFile(project, existing) {
				return address
			}
			return ""
		}
		if candidate := nextPreviewURL(line); candidate != "" {
			address = candidate
		}
	}
	return ""
}

func nextPreviewResponds(ctx context.Context, address string) bool {
	// 探测限于日志中的本地服务，避免代理或重定向将请求发往其他地址。
	client := &http.Client{
		Transport: &http.Transport{DisableKeepAlives: true},
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	ticker := time.NewTicker(config.NextPreviewRetryInterval)
	defer ticker.Stop()
	for ctx.Err() == nil {
		request, err := http.NewRequestWithContext(ctx, http.MethodHead, address, nil)
		if err != nil {
			return false
		}
		if response, err := client.Do(request); err == nil {
			_ = response.Body.Close()
			return true
		}
		select {
		case <-ctx.Done():
			return false
		case <-ticker.C:
		}
	}
	return false
}
