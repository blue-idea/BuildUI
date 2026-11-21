package settings_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"buildui/internal/db"
	"buildui/internal/settings"
)

func TestSettingsService_SaveAndGet(t *testing.T) {
	tempDir := t.TempDir()
	database, err := db.Open(context.Background(), filepath.Join(tempDir, "test.db"))
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	defer database.Close()

	repo := db.NewSettingsRepository(database)
	svc := settings.NewSettingsService(repo)
	ctx := context.Background()

	// 保存配置
	cfg := map[string]string{
		"llm.provider": "deepseek",
		"llm.base_url": "https://api.deepseek.com/v1",
		"llm.api_key":  "sk-test-secret",
		"llm.model":    "deepseek-chat",
	}
	err = svc.SaveSettings(ctx, cfg)
	if err != nil {
		t.Fatalf("SaveSettings failed: %v", err)
	}

	// 读取配置
	res, err := svc.GetSettings(ctx)
	if err != nil {
		t.Fatalf("GetSettings failed: %v", err)
	}

	if res["llm.provider"] != "deepseek" || res["llm.model"] != "deepseek-chat" {
		t.Fatalf("unexpected settings: %v", res)
	}
}

func TestSettingsService_TestConnection(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/models" {
			w.WriteHeader(http.StatusOK)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	tempDir := t.TempDir()
	database, err := db.Open(context.Background(), filepath.Join(tempDir, "test.db"))
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	defer database.Close()

	repo := db.NewSettingsRepository(database)
	svc := settings.NewSettingsService(repo)

	err = svc.TestConnection(context.Background(), server.URL, "dummy-key", "gpt-4o")
	if err != nil {
		t.Fatalf("TestConnection failed: %v", err)
	}
}
