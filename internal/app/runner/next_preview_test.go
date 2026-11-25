package runner

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"buildui/internal/config"
)

// 在进程边界控制日志和退出顺序，HTTP 请求仍走真实的回环端口。
type nextPreviewLauncher struct {
	launch func(context.Context, func(string), func(error))
}

func (l nextPreviewLauncher) Launch(ctx context.Context, _ string, output func(string), exit func(error)) (int, error) {
	l.launch(ctx, output, exit)
	return 123, nil
}

func (nextPreviewLauncher) Kill(int) error { return nil }

func nextPreviewFixture(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, config.NextTemplateConfig), nil, 0644); err != nil {
		t.Fatal(err)
	}
	return dir
}

// v29.REQ-018 / AC-018-01：服务实际响应前不能返回预览地址。
func TestNextPreviewWaitsForHTTPResponse(t *testing.T) {
	dir := nextPreviewFixture(t)
	requested := make(chan struct{}, 1)
	respond := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		select {
		case requested <- struct{}{}:
		default:
		}
		select {
		case <-respond:
			w.WriteHeader(http.StatusNotFound)
		case <-req.Context().Done():
		}
	}))
	defer server.Close()
	// 没有首页的项目同样可以预览，收到真实的 404 也证明服务已响应。
	ctx, cancel := context.WithTimeout(t.Context(), 5*time.Second)
	defer cancel()
	r := NewAppRunnerWithLauncher(nextPreviewLauncher{func(_ context.Context, output func(string), _ func(error)) {
		output("  - Local: " + server.URL)
		output("✓ Ready in 100ms")
	}}, nil)
	defer r.StopApp(ctx, 1)
	result := make(chan error, 1)
	go func() {
		response, err := r.StartApp(ctx, 1, dir)
		if err == nil && response.PreviewURL != server.URL {
			err = errors.New("unexpected preview URL: " + response.PreviewURL)
		}
		result <- err
	}()

	select {
	case <-requested:
		if got := r.PreviewURL(1); got != "" {
			t.Fatalf("preview URL published before HTTP response: %s", got)
		}
		close(respond)
	case err := <-result:
		t.Fatalf("preview startup returned without an HTTP request: %v", err)
	case <-ctx.Done():
		t.Fatal(ctx.Err())
	}
	select {
	case err := <-result:
		if err != nil {
			t.Fatal(err)
		}
	case <-ctx.Done():
		t.Fatal(ctx.Err())
	}
}

// v29.REQ-018 / AC-018-02：进程在就绪前退出时保留启动错误。
func TestNextPreviewReportsStartupExitAfterURL(t *testing.T) {
	dir := nextPreviewFixture(t)
	ctx, cancel := context.WithTimeout(t.Context(), 5*time.Second)
	defer cancel()
	server := httptest.NewServer(http.HandlerFunc(func(_ http.ResponseWriter, req *http.Request) {
		<-req.Context().Done()
	}))
	defer server.Close()
	release := make(chan struct{})
	defer close(release)
	r := NewAppRunnerWithLauncher(nextPreviewLauncher{func(procCtx context.Context, output func(string), exit func(error)) {
		output("  - Local: " + server.URL)
		output("✓ Ready in 100ms")
		go func() {
			select {
			case <-time.After(100 * time.Millisecond):
				output("Error: Unable to acquire lock")
				exit(errors.New("exit status 1"))
			case <-release:
			case <-procCtx.Done():
			}
		}()
	}}, nil)
	defer r.StopApp(ctx, 1)
	response, err := r.StartApp(ctx, 1, dir)
	if response != nil || err == nil || !strings.Contains(err.Error(), "Unable to acquire lock") {
		t.Fatalf("expected startup failure with the process log, got %+v, %v", response, err)
	}
	if got := r.PreviewURL(1); got != "" {
		t.Fatalf("exited process kept a preview URL: %s", got)
	}
}
