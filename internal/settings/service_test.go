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

func TestSettingsService_MultiProviderStorageAndFallback(t *testing.T) {
	tempDir := t.TempDir()
	database, err := db.Open(context.Background(), filepath.Join(tempDir, "test.db"))
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	defer database.Close()

	repo := db.NewSettingsRepository(database)
	svc := settings.NewSettingsService(repo)
	ctx := context.Background()

	// 1. 保存多 Provider 隔离配置与 active_provider
	cfg := map[string]string{
		"llm.active_provider":            "deepseek",
		"llm.providers.openai.base_url":  "https://api.openai.com/v1",
		"llm.providers.openai.api_key":   "sk-openai-test",
		"llm.providers.openai.model":     "gpt-4o",
		"llm.providers.deepseek.base_url": "https://api.deepseek.com/v1",
		"llm.providers.deepseek.api_key":  "sk-deepseek-test",
		"llm.providers.deepseek.model":    "deepseek-chat",
	}
	if err := svc.SaveSettings(ctx, cfg); err != nil {
		t.Fatalf("SaveSettings failed: %v", err)
	}

	active, err := svc.GetActiveProvider(ctx)
	if err != nil {
		t.Fatalf("GetActiveProvider failed: %v", err)
	}
	if active != "deepseek" {
		t.Errorf("expected active provider 'deepseek', got %q", active)
	}

	baseURL, apiKey, model, err := svc.GetProviderCredentials(ctx, "deepseek")
	if err != nil {
		t.Fatalf("GetProviderCredentials deepseek failed: %v", err)
	}
	if baseURL != "https://api.deepseek.com/v1" || apiKey != "sk-deepseek-test" || model != "deepseek-chat" {
		t.Errorf("unexpected credentials for deepseek: %s, %s, %s", baseURL, apiKey, model)
	}

	// 2. 测试向后兼容：当只存在旧版单全局 key 时，回退读取
	tempDir2 := t.TempDir()
	db2, err := db.Open(context.Background(), filepath.Join(tempDir2, "legacy.db"))
	if err != nil {
		t.Fatalf("failed to open legacy db: %v", err)
	}
	defer db2.Close()

	legacyRepo := db.NewSettingsRepository(db2)
	legacySvc := settings.NewSettingsService(legacyRepo)
	legacyCfg := map[string]string{
		"llm.provider": "openai",
		"llm.base_url": "https://legacy.openai.com/v1",
		"llm.api_key":  "sk-legacy-key",
		"llm.model":    "gpt-3.5-turbo",
	}
	if err := legacySvc.SaveSettings(ctx, legacyCfg); err != nil {
		t.Fatalf("legacy SaveSettings failed: %v", err)
	}

	legacyActive, err := legacySvc.GetActiveProvider(ctx)
	if err != nil {
		t.Fatalf("legacy GetActiveProvider failed: %v", err)
	}
	if legacyActive != "openai" {
		t.Errorf("expected legacy active provider 'openai', got %q", legacyActive)
	}

	lBaseURL, lAPIKey, lModel, err := legacySvc.GetProviderCredentials(ctx, "openai")
	if err != nil {
		t.Fatalf("GetProviderCredentials legacy failed: %v", err)
	}
	if lBaseURL != "https://legacy.openai.com/v1" || lAPIKey != "sk-legacy-key" || lModel != "gpt-3.5-turbo" {
		t.Errorf("unexpected legacy credentials: %s, %s, %s", lBaseURL, lAPIKey, lModel)
	}
}

func TestSettingsService_ListProviderModels(t *testing.T) {
	ctx := context.Background()

	// 1. Ollama 动态拉取测试 (/api/tags)
	ollamaServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/tags" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"models":[{"name":"qwen2.5-coder:latest"},{"name":"llama3.2:3b"}]}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer ollamaServer.Close()

	tempDir := t.TempDir()
	database, _ := db.Open(ctx, filepath.Join(tempDir, "test.db"))
	defer database.Close()
	svc := settings.NewSettingsService(db.NewSettingsRepository(database))

	models, err := svc.ListProviderModels(ctx, "ollama", ollamaServer.URL, "")
	if err != nil {
		t.Fatalf("ListProviderModels ollama failed: %v", err)
	}
	if len(models) != 2 || models[0] != "qwen2.5-coder:latest" {
		t.Errorf("unexpected ollama models: %v", models)
	}

	// 2. OpenAI / DeepSeek 动态拉取测试 (/models)
	openaiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/models" {
			if r.Header.Get("Authorization") != "Bearer test-key" {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"data":[{"id":"gpt-4o"},{"id":"gpt-4o-mini"}]}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer openaiServer.Close()

	aiModels, err := svc.ListProviderModels(ctx, "openai", openaiServer.URL, "test-key")
	if err != nil {
		t.Fatalf("ListProviderModels openai failed: %v", err)
	}
	if len(aiModels) != 2 || aiModels[0] != "gpt-4o" {
		t.Errorf("unexpected openai models: %v", aiModels)
	}

	// 3. 服务端异常时回退到预设模型列表
	fallbackModels, err := svc.ListProviderModels(ctx, "deepseek", "http://invalid-endpoint-1234.local", "dummy")
	if err != nil {
		t.Fatalf("expected no error on fallback, got: %v", err)
	}
	if len(fallbackModels) == 0 {
		t.Fatalf("expected non-empty fallback models for deepseek")
	}
}
