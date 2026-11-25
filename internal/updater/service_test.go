package updater_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"buildui/internal/updater"
)

func TestIsNewerVersion(t *testing.T) {
	tests := []struct {
		name     string
		latest   string
		current  string
		expected bool
	}{
		{"major bump", "v1.0.0", "v0.1.0", true},
		{"minor bump", "v0.2.0", "v0.1.0", true},
		{"patch bump", "v0.1.1", "v0.1.0", true},
		{"without v prefix", "0.2.0", "0.1.0", true},
		{"mixed v prefix", "v0.2.0", "0.1.0", true},
		{"same version", "v0.1.0", "v0.1.0", false},
		{"older version", "v0.0.9", "v0.1.0", false},
		{"invalid latest", "invalid", "v0.1.0", false},
		{"invalid current", "v0.2.0", "invalid", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := updater.IsNewerVersion(tt.latest, tt.current)
			if actual != tt.expected {
				t.Fatalf("expected IsNewerVersion(%q, %q) = %v, got %v", tt.latest, tt.current, tt.expected, actual)
			}
		})
	}
}

func TestSelectAssetForPlatform(t *testing.T) {
	assets := []updater.ReleaseAsset{
		{Name: "buildui-windows-amd64.exe", BrowserDownloadURL: "https://example.com/buildui.exe"},
		{Name: "BuildUI.dmg", BrowserDownloadURL: "https://example.com/BuildUI.dmg"},
		{Name: "buildui-amd64", BrowserDownloadURL: "https://example.com/buildui-amd64"},
	}

	// macOS 测试
	macAsset, ok := updater.SelectAssetForPlatform(assets, "darwin", "arm64")
	if !ok || macAsset.Name != "BuildUI.dmg" {
		t.Fatalf("expected BuildUI.dmg for darwin, got %v (ok=%v)", macAsset, ok)
	}

	// Windows 测试
	winAsset, ok := updater.SelectAssetForPlatform(assets, "windows", "amd64")
	if !ok || winAsset.Name != "buildui-windows-amd64.exe" {
		t.Fatalf("expected buildui-windows-amd64.exe for windows, got %v (ok=%v)", winAsset, ok)
	}

	// Linux 通用二进制测试
	linuxBinAsset, ok := updater.SelectAssetForPlatform(assets, "linux", "amd64")
	if !ok || linuxBinAsset.Name != "buildui-amd64" {
		t.Fatalf("expected buildui-amd64 for linux, got %v (ok=%v)", linuxBinAsset, ok)
	}

	// Linux DEB / RPM 包优先匹配测试
	linuxPackages := []updater.ReleaseAsset{
		{Name: "buildui-amd64", BrowserDownloadURL: "https://example.com/buildui-amd64"},
		{Name: "buildui-0.1.1-1.x86_64.rpm", BrowserDownloadURL: "https://example.com/buildui.rpm"},
		{Name: "buildui_0.1.1_amd64.deb", BrowserDownloadURL: "https://example.com/buildui.deb"},
	}
	debAsset, ok := updater.SelectAssetForPlatform(linuxPackages, "linux", "amd64")
	if !ok || debAsset.Name != "buildui_0.1.1_amd64.deb" {
		t.Fatalf("expected buildui_0.1.1_amd64.deb for linux amd64, got %v (ok=%v)", debAsset, ok)
	}

	// 无匹配平台测试
	_, ok = updater.SelectAssetForPlatform(assets, "unknown_os", "amd64")
	if ok {
		t.Fatalf("expected false for unknown_os")
	}
}

func TestCheckForUpdatesWithMockServer(t *testing.T) {
	mockRelease := updater.ReleaseInfo{
		TagName: "v0.2.0",
		HTMLURL: "https://github.com/blue-idea/BuildUI/releases/tag/v0.2.0",
		Assets: []updater.ReleaseAsset{
			{Name: "BuildUI.dmg", BrowserDownloadURL: "https://github.com/blue-idea/BuildUI/releases/download/v0.2.0/BuildUI.dmg"},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(mockRelease)
	}))
	defer server.Close()

	service := updater.NewService(updater.Config{
		CurrentVersion:    "0.1.0",
		ReleaseAPIBaseURL: server.URL,
		ReleaseRepository: "blue-idea/BuildUI",
		GOOS:              "darwin",
		GOARCH:            "arm64",
		HTTPClient:        server.Client(),
	})

	result, err := service.CheckForUpdates(context.Background())
	if err != nil {
		t.Fatalf("CheckForUpdates failed: %v", err)
	}

	if !result.Available {
		t.Fatalf("expected available = true")
	}
	if result.Version != "0.2.0" {
		t.Fatalf("expected version 0.2.0, got %s", result.Version)
	}
	if result.DownloadURL != "https://github.com/blue-idea/BuildUI/releases/download/v0.2.0/BuildUI.dmg" {
		t.Fatalf("expected download url to match asset, got %s", result.DownloadURL)
	}
}

func TestCheckAndNotifyEmit(t *testing.T) {
	mockRelease := updater.ReleaseInfo{
		TagName: "v0.2.0",
		HTMLURL: "https://github.com/blue-idea/BuildUI/releases/tag/v0.2.0",
		Assets: []updater.ReleaseAsset{
			{Name: "BuildUI.dmg", BrowserDownloadURL: "https://github.com/blue-idea/BuildUI/releases/download/v0.2.0/BuildUI.dmg"},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(mockRelease)
	}))
	defer server.Close()

	emitted := false
	var emittedPayload updater.UpdateCheckResult

	service := updater.NewService(updater.Config{
		CurrentVersion:    "0.1.0",
		ReleaseAPIBaseURL: server.URL,
		ReleaseRepository: "blue-idea/BuildUI",
		GOOS:              "darwin",
		GOARCH:            "arm64",
		HTTPClient:        server.Client(),
		Emitter: func(ctx context.Context, eventName string, result updater.UpdateCheckResult) {
			emitted = true
			emittedPayload = result
		},
	})

	res, err := service.CheckAndNotify(context.Background())
	if err != nil {
		t.Fatalf("CheckAndNotify failed: %v", err)
	}
	if !res.Available {
		t.Fatalf("expected available = true")
	}
	if !emitted {
		t.Fatalf("expected event to be emitted")
	}
	if emittedPayload.Version != "0.2.0" {
		t.Fatalf("expected emitted payload version 0.2.0, got %s", emittedPayload.Version)
	}
}
