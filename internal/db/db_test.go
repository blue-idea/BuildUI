package db_test

import (
	"context"
	"testing"
	"time"

	"buildui/internal/db"
)

// v1.REQ-001-AC-002: 数据库自动建表与纯 Go SQLite 驱动连接
func TestDatabase_InitAndAutoMigration(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open in-memory database: %v", err)
	}
	defer database.Close()

	tables := []string{"apps", "chats", "messages", "blueprints", "versions"}
	for _, table := range tables {
		exists, err := database.TableExists(ctx, table)
		if err != nil {
			t.Fatalf("failed to check table %s existence: %v", table, err)
		}
		if !exists {
			t.Fatalf("expected table %s to exist after auto-migration", table)
		}
	}
}

// v1.REQ-001-AC-002: Apps 表基础 CRUD 操作测试
func TestAppRepository_CRUD(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	repo := db.NewAppRepository(database)

	// 1. Create App
	now := time.Now()
	newApp := &db.AppEntity{
		Name:              "My AI App",
		Path:              "/workspace/apps/my-ai-app",
		ThemeID:           "default",
		NeedsAppBlueprint: true,
		TestingEnabled:    false,
		InstallCommand:    "pnpm install",
		StartCommand:      "pnpm run dev",
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	appID, err := repo.Create(ctx, newApp)
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}
	if appID <= 0 {
		t.Fatalf("expected positive app ID, got %d", appID)
	}

	// 2. Get App By ID
	fetched, err := repo.GetByID(ctx, appID)
	if err != nil {
		t.Fatalf("failed to get app by id: %v", err)
	}
	if fetched == nil {
		t.Fatal("expected app entity, got nil")
	}
	if fetched.Name != "My AI App" || fetched.Path != "/workspace/apps/my-ai-app" {
		t.Fatalf("unexpected app fields: name=%s, path=%s", fetched.Name, fetched.Path)
	}
	if !fetched.NeedsAppBlueprint {
		t.Fatalf("expected NeedsAppBlueprint to be true")
	}

	// 3. List Apps
	apps, err := repo.List(ctx)
	if err != nil {
		t.Fatalf("failed to list apps: %v", err)
	}
	if len(apps) != 1 {
		t.Fatalf("expected 1 app, got %d", len(apps))
	}

	// 4. Delete App
	if err := repo.Delete(ctx, appID); err != nil {
		t.Fatalf("failed to delete app: %v", err)
	}

	// 5. Verify Not Found after deletion
	notFoundApp, err := repo.GetByID(ctx, appID)
	if err == nil || notFoundApp != nil {
		t.Fatalf("expected not found error, got app=%v, err=%v", notFoundApp, err)
	}
}

// 关联级联删除与 Chats / Messages / Blueprints / Versions CRUD
func TestDatabase_CascadeAndRelations(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	chatRepo := db.NewChatRepository(database)
	msgRepo := db.NewMessageRepository(database)
	bpRepo := db.NewBlueprintRepository(database)
	verRepo := db.NewVersionRepository(database)

	// Create App
	appID, err := appRepo.Create(ctx, &db.AppEntity{
		Name: "Cascade Test App",
		Path: "/workspace/cascade-test",
	})
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}

	// Create Chat
	chatID, err := chatRepo.Create(ctx, &db.ChatEntity{
		AppID:    appID,
		Title:    "Initial Chat",
		ChatMode: "agent",
	})
	if err != nil {
		t.Fatalf("failed to create chat: %v", err)
	}

	// Create Messages
	msgID, err := msgRepo.Create(ctx, &db.MessageEntity{
		ChatID:  chatID,
		Role:    "user",
		Content: "Build a todo app",
		Model:   "gemini-2.5-pro",
	})
	if err != nil {
		t.Fatalf("failed to create message: %v", err)
	}
	if msgID <= 0 {
		t.Fatalf("expected positive message ID")
	}

	messages, err := msgRepo.ListByChatID(ctx, chatID)
	if err != nil || len(messages) != 1 {
		t.Fatalf("expected 1 message, got %d, err: %v", len(messages), err)
	}

	// Create Blueprint
	bp := &db.BlueprintEntity{
		ChatID:          chatID,
		AppName:         "Todo Master",
		DesignDirection: "Minimalist modern dashboard",
		PrimaryColor:    "#3b82f6",
		ThemeID:         "light",
		VisualsJSON:     `["clean-layout", "sidebar-nav"]`,
		Approved:        false,
	}
	if err := bpRepo.Upsert(ctx, bp); err != nil {
		t.Fatalf("failed to upsert blueprint: %v", err)
	}

	fetchedBp, err := bpRepo.GetByChatID(ctx, chatID)
	if err != nil || fetchedBp == nil {
		t.Fatalf("failed to get blueprint by chat id: %v", err)
	}
	if fetchedBp.Approved {
		t.Fatalf("expected blueprint not approved yet")
	}

	// Approve Blueprint
	if err := bpRepo.Approve(ctx, chatID); err != nil {
		t.Fatalf("failed to approve blueprint: %v", err)
	}
	approvedBp, err := bpRepo.GetByChatID(ctx, chatID)
	if err != nil || !approvedBp.Approved {
		t.Fatalf("expected blueprint approved to be true")
	}

	// Create Version
	verID, err := verRepo.Create(ctx, &db.VersionEntity{
		AppID:      appID,
		ChatID:     &chatID,
		CommitHash: "c0ffee123456",
		Message:    "Initial scaffold commit",
	})
	if err != nil || verID <= 0 {
		t.Fatalf("failed to create version: %v", err)
	}

	versions, err := verRepo.ListByAppID(ctx, appID)
	if err != nil || len(versions) != 1 {
		t.Fatalf("expected 1 version, got %d, err: %v", len(versions), err)
	}

	// Now Delete App -> should cascade to chats, messages, blueprints, versions
	if err := appRepo.Delete(ctx, appID); err != nil {
		t.Fatalf("failed to delete app: %v", err)
	}

	// Check chats cascade
	chats, err := chatRepo.ListByAppID(ctx, appID)
	if err != nil {
		t.Fatalf("failed to list chats: %v", err)
	}
	if len(chats) != 0 {
		t.Fatalf("expected 0 chats after cascade delete, got %d", len(chats))
	}
}
