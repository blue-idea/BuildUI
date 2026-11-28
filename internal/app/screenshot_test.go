package app_test

import (
	"context"
	"encoding/base64"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"

	"buildui/internal/app"
	"buildui/internal/app/runner"
	"buildui/internal/db"
)

// 1x1 像素合法 PNG 字节，用于单元测试
var samplePNGBytes = []byte{
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
	0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
	0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
	0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
	0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
	0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
	0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
	0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
	0x42, 0x60, 0x82,
}

func samplePNGDataURL() string {
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(samplePNGBytes)
}

type fakeScreenshotCapturer struct {
	capturedURLs []string
	resultBytes  []byte
	err          error
}

func (f *fakeScreenshotCapturer) CaptureURL(ctx context.Context, targetURL string) ([]byte, error) {
	f.capturedURLs = append(f.capturedURLs, targetURL)
	if f.err != nil {
		return nil, f.err
	}
	return f.resultBytes, nil
}

type trackingRunnerLauncher struct {
	url      string
	launches atomic.Int32
	kills    atomic.Int32
}

func (l *trackingRunnerLauncher) Launch(ctx context.Context, appPath string, onOutput func(string), onExit func(error)) (int, error) {
	l.launches.Add(1)
	go func() {
		onOutput("  ➜  Local:   " + l.url + "/\n")
	}()
	return 4242, nil
}

func (l *trackingRunnerLauncher) Kill(pid int) error {
	l.kills.Add(1)
	return nil
}

// v33.REQ-001-AC-001：保存缩略图到独立目录、ListApps 返回 thumbnailUrl、覆盖更新与删除清理
func TestAppService_Screenshot_PersistenceAndCleanup(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	svc := app.NewAppService(appRepo, database)
	thumbDir := t.TempDir()
	svc.SetThumbnailDir(thumbDir)

	projDir := filepath.Join(t.TempDir(), "my-project")
	if err := os.MkdirAll(projDir, 0755); err != nil {
		t.Fatal(err)
	}
	appID, err := appRepo.Create(ctx, &db.AppEntity{
		Name: "Snapshot App",
		Path: projDir,
	})
	if err != nil {
		t.Fatal(err)
	}

	// 保存 PNG 缩略图
	savedURL, err := svc.SaveAppThumbnail(ctx, appID, samplePNGDataURL())
	if err != nil {
		t.Fatalf("SaveAppThumbnail failed: %v", err)
	}
	if !strings.HasPrefix(savedURL, "data:image/png;base64,") {
		t.Fatalf("expected png data URL, got %q", savedURL)
	}

	// 验证落盘在独立缩略图目录，不污染用户项目目录
	entries, err := os.ReadDir(projDir)
	if err != nil || len(entries) != 0 {
		t.Fatalf("expected project directory to stay clean, got %v (%v)", entries, err)
	}
	if _, err := os.Stat(filepath.Join(thumbDir, "app-1.png")); err != nil {
		t.Fatalf("expected persisted thumbnail file: %v", err)
	}

	// 验证 ListApps 返回 thumbnailUrl 与 createdAt
	apps, err := svc.ListApps(ctx)
	if err != nil {
		t.Fatalf("ListApps failed: %v", err)
	}
	if len(apps) != 1 || apps[0].ThumbnailURL != savedURL {
		t.Fatalf("expected ListApps to include thumbnailUrl, got %+v", apps)
	}
	if apps[0].CreatedAt == "" {
		t.Fatalf("expected ListApps to include createdAt")
	}

	// 替换为 JPEG 缩略图时应清理旧 PNG 文件
	jpegDataURL := "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString([]byte{0xff, 0xd8, 0xff, 0xd9})
	replacedURL, err := svc.SaveAppThumbnail(ctx, appID, jpegDataURL)
	if err != nil {
		t.Fatalf("SaveAppThumbnail jpeg replace failed: %v", err)
	}
	if !strings.HasPrefix(replacedURL, "data:image/jpeg;base64,") {
		t.Fatalf("expected jpeg data URL, got %q", replacedURL)
	}
	if _, err := os.Stat(filepath.Join(thumbDir, "app-1.png")); !os.IsNotExist(err) {
		t.Fatalf("expected old png thumbnail to be removed on format replace")
	}
	if _, err := os.Stat(filepath.Join(thumbDir, "app-1.jpg")); err != nil {
		t.Fatalf("expected new jpg thumbnail to exist: %v", err)
	}

	// 删除非活跃应用时同步清理缩略图文件
	if err := svc.DeleteApp(ctx, appID); err != nil {
		t.Fatalf("DeleteApp failed: %v", err)
	}
	if _, err := os.Stat(filepath.Join(thumbDir, "app-1.jpg")); !os.IsNotExist(err) {
		t.Fatalf("expected thumbnail file to be cleaned up on DeleteApp")
	}
}

// v33.REQ-001-AC-002：支持显式本机 URL、复用运行中预览、以及未运行时临时启停预览截图
func TestAppService_Screenshot_CaptureLifecycle(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	svc := app.NewAppService(appRepo, database)
	svc.SetThumbnailDir(t.TempDir())

	launcher := &trackingRunnerLauncher{url: "http://127.0.0.1:4173"}
	appRunner := runner.NewAppRunnerWithLauncher(launcher, nil)
	svc.SetRunner(appRunner)

	capturer := &fakeScreenshotCapturer{resultBytes: samplePNGBytes}
	svc.SetScreenshotCapturer(capturer)

	appID, err := appRepo.Create(ctx, &db.AppEntity{
		Name: "Capture Target",
		Path: t.TempDir(),
	})
	if err != nil {
		t.Fatal(err)
	}

	// 场景 1：显式传入合法本机 URL，不启动新预览进程
	url1, err := svc.CaptureAppScreenshot(ctx, appID, "http://localhost:5173/dashboard")
	if err != nil {
		t.Fatalf("CaptureAppScreenshot with explicit URL failed: %v", err)
	}
	if !strings.HasPrefix(url1, "data:image/png;base64,") {
		t.Fatalf("unexpected thumbnail URL: %q", url1)
	}
	if launcher.launches.Load() != 0 {
		t.Fatalf("expected no preview launch when targetURL is provided, got %d", launcher.launches.Load())
	}
	if len(capturer.capturedURLs) != 1 || capturer.capturedURLs[0] != "http://localhost:5173/dashboard" {
		t.Fatalf("unexpected captured URLs: %+v", capturer.capturedURLs)
	}

	// 场景 2：未传 URL 且项目未运行预览时，临时启动并在截图完成后自动停止
	url2, err := svc.CaptureAppScreenshot(ctx, appID, "")
	if err != nil {
		t.Fatalf("CaptureAppScreenshot with ephemeral preview failed: %v", err)
	}
	if !strings.HasPrefix(url2, "data:image/png;base64,") {
		t.Fatalf("unexpected thumbnail URL: %q", url2)
	}
	if launcher.launches.Load() != 1 || launcher.kills.Load() != 1 {
		t.Fatalf("expected ephemeral preview launch=1 kill=1, got launch=%d kill=%d", launcher.launches.Load(), launcher.kills.Load())
	}
	if appRunner.IsRunning(appID) {
		t.Fatalf("expected ephemeral preview to be stopped after capture")
	}

	// 场景 3：项目已在运行预览时复用现有 URL 且截图完成后不停止运行中的预览
	if _, err := svc.RunApp(ctx, runner.RunAppRequest{AppID: appID}); err != nil {
		t.Fatalf("RunApp failed: %v", err)
	}
	killsBefore := launcher.kills.Load()
	if _, err := svc.CaptureAppScreenshot(ctx, appID, ""); err != nil {
		t.Fatalf("CaptureAppScreenshot reusing running preview failed: %v", err)
	}
	if !appRunner.IsRunning(appID) || launcher.kills.Load() != killsBefore {
		t.Fatalf("expected existing running preview to stay running after capture")
	}
	_ = svc.StopApp(ctx, runner.StopAppRequest{AppID: appID})
}

// v33.REQ-001-AC-003：参数校验、非本机 URL 拒绝（防 SSRF）与截图器错误透传
func TestAppService_Screenshot_ValidationAndSecurity(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	svc := app.NewAppService(appRepo, database)
	svc.SetThumbnailDir(t.TempDir())

	appID, err := appRepo.Create(ctx, &db.AppEntity{
		Name: "Secure App",
		Path: t.TempDir(),
	})
	if err != nil {
		t.Fatal(err)
	}

	// 非法 AppID
	if _, err := svc.SaveAppThumbnail(ctx, 0, samplePNGDataURL()); err == nil {
		t.Fatal("expected error for invalid app id")
	}

	// 不支持的 DataURL MIME 类型
	if _, err := svc.SaveAppThumbnail(ctx, appID, "data:text/html;base64,PGgxPkJhZDwvaDE+"); err == nil {
		t.Fatal("expected error for unsupported mime type")
	}

	// 非本机外部 URL 必须拒绝（防止 SSRF）
	svc.SetScreenshotCapturer(&fakeScreenshotCapturer{resultBytes: samplePNGBytes})
	for _, badURL := range []string{"https://example.com", "http://169.254.169.254/latest/meta-data", "file:///etc/passwd"} {
		if _, err := svc.CaptureAppScreenshot(ctx, appID, badURL); err == nil {
			t.Fatalf("expected SSRF validation error for %q, got nil", badURL)
		}
	}

	// 截图器执行失败时应返回清晰错误
	svc.SetScreenshotCapturer(&fakeScreenshotCapturer{err: errors.New("headless browser unavailable")})
	if _, err := svc.CaptureAppScreenshot(ctx, appID, "http://127.0.0.1:5173"); err == nil {
		t.Fatal("expected error when capturer fails")
	}
}
