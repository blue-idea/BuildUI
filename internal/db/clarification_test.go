package db

import (
	"context"
	"path/filepath"
	"testing"
)

func TestMessageRepository_ClarificationLifecycle(t *testing.T) {
	ctx := context.Background()
	database, err := Open(ctx, filepath.Join(t.TempDir(), "clarify.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()

	apps := NewAppRepository(database)
	chats := NewChatRepository(database)
	messages := NewMessageRepository(database)

	appID, err := apps.Create(ctx, &AppEntity{Name: "Demo", Path: t.TempDir()})
	if err != nil {
		t.Fatal(err)
	}
	chatID, err := chats.Create(ctx, &ChatEntity{AppID: appID, Title: "Clarify"})
	if err != nil {
		t.Fatal(err)
	}

	// 1. 初始无澄清记录应返回空串与 nil
	got, err := messages.GetClarification(ctx, chatID)
	if err != nil || got != "" {
		t.Fatalf("expected empty clarification, got %q, err=%v", got, err)
	}

	// 2. 保存与覆盖更新
	firstPayload := `{"chatId":1,"summary":"First","questions":[{"id":"q1","question":"Pick style","type":"single_choice","options":["A","B"]}]}`
	if err := messages.SaveClarification(ctx, chatID, firstPayload); err != nil {
		t.Fatalf("SaveClarification failed: %v", err)
	}
	got, err = messages.GetClarification(ctx, chatID)
	if err != nil || got != firstPayload {
		t.Fatalf("expected %q, got %q, err=%v", firstPayload, got, err)
	}

	secondPayload := `{"chatId":1,"summary":"Updated","questions":[{"id":"q1","question":"Pick palette","type":"multi_choice","options":["Warm","Cool"]}]}`
	if err := messages.SaveClarification(ctx, chatID, secondPayload); err != nil {
		t.Fatalf("SaveClarification upsert failed: %v", err)
	}
	got, err = messages.GetClarification(ctx, chatID)
	if err != nil || got != secondPayload {
		t.Fatalf("expected %q, got %q, err=%v", secondPayload, got, err)
	}

	// 3. 显式删除
	if err := messages.DeleteClarification(ctx, chatID); err != nil {
		t.Fatalf("DeleteClarification failed: %v", err)
	}
	got, err = messages.GetClarification(ctx, chatID)
	if err != nil || got != "" {
		t.Fatalf("expected empty after delete, got %q, err=%v", got, err)
	}

	// 4. 级联删除：删除应用后相关澄清记录一并清理
	if err := messages.SaveClarification(ctx, chatID, secondPayload); err != nil {
		t.Fatal(err)
	}
	if err := apps.Delete(ctx, appID); err != nil {
		t.Fatal(err)
	}
	var count int
	if err := database.SQLDB().QueryRowContext(ctx, "SELECT COUNT(*) FROM chat_clarifications WHERE chat_id = ?", chatID).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 0 {
		t.Fatalf("expected cascade delete to remove clarification, got count=%d", count)
	}
}
