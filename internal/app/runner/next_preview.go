package runner

import (
	"context"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"buildui/internal/config"
)

var nextLocalLine = regexp.MustCompile(`^\s*(?:-\s*)?Local:\s+(https?://(?:localhost|127\.0\.0\.1):(\d+))/?\s*$`)

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
	var address string
	select {
	case address = <-reported:
	case <-ctx.Done():
		return
	}

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
			return
		}
		if response, err := client.Do(request); err == nil {
			_ = response.Body.Close()
			ready <- address
			return
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}
