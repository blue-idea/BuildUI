package db_test

import (
	"context"
	"path/filepath"
	"testing"

	"buildui/internal/db"
)

func TestSettingsRepository_CRUD(t *testing.T) {
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "settings_test.db")
	ctx := context.Background()

	database, err := db.Open(ctx, dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	repo := db.NewSettingsRepository(database)

	// 1. 测试设置单个配置
	err = repo.Set(ctx, "llm.provider", "openai")
	if err != nil {
		t.Fatalf("failed to set key: %v", err)
	}

	val, err := repo.Get(ctx, "llm.provider")
	if err != nil {
		t.Fatalf("failed to get key: %v", err)
	}
	if val != "openai" {
		t.Fatalf("expected openai, got %s", val)
	}

	// 2. 测试更新已有配置
	err = repo.Set(ctx, "llm.provider", "deepseek")
	if err != nil {
		t.Fatalf("failed to update key: %v", err)
	}
	val, err = repo.Get(ctx, "llm.provider")
	if err != nil || val != "deepseek" {
		t.Fatalf("expected deepseek after update, got %s, err: %v", val, err)
	}

	// 3. 测试批量保存
	batch := map[string]string{
		"llm.base_url": "https://api.deepseek.com/v1",
		"llm.api_key":  "sk-test-key-12345",
		"llm.model":    "deepseek-chat",
	}
	err = repo.SetMany(ctx, batch)
	if err != nil {
		t.Fatalf("failed to SetMany: %v", err)
	}

	all, err := repo.GetAll(ctx)
	if err != nil {
		t.Fatalf("failed to GetAll: %v", err)
	}
	if len(all) != 4 {
		t.Fatalf("expected 4 settings, got %d", len(all))
	}
	if all["llm.api_key"] != "sk-test-key-12345" {
		t.Fatalf("expected sk-test-key-12345, got %s", all["llm.api_key"])
	}

	// 4. 查询不存在的 key 应返回空字符串
	nonExistVal, err := repo.Get(ctx, "non.existing.key")
	if err != nil {
		t.Fatalf("unexpected error on missing key: %v", err)
	}
	if nonExistVal != "" {
		t.Fatalf("expected empty string for missing key, got %s", nonExistVal)
	}
}
