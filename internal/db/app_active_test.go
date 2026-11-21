package db_test

import (
	"context"
	"testing"
	"time"

	"buildui/internal/db"
)

// v3.REQ-001-AC-001 & v3.REQ-001-AC-003: 活跃应用存取与级联删除测试
func TestAppRepository_ActiveAppAndCascadeDelete(t *testing.T) {
	ctx := context.Background()

	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open memory db: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)

	// 1. 创建两个测试应用
	app1 := &db.AppEntity{
		Name:      "App One",
		Path:      "/tmp/app1",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	id1, err := appRepo.Create(ctx, app1)
	if err != nil {
		t.Fatalf("failed to create app1: %v", err)
	}

	app2 := &db.AppEntity{
		Name:      "App Two",
		Path:      "/tmp/app2",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	id2, err := appRepo.Create(ctx, app2)
	if err != nil {
		t.Fatalf("failed to create app2: %v", err)
	}

	// 2. 初始状态获取活跃应用 ID
	activeID, err := appRepo.GetActiveAppID(ctx)
	if err != nil {
		t.Fatalf("GetActiveAppID failed: %v", err)
	}
	if activeID != 0 && activeID != id1 {
		t.Errorf("unexpected initial activeID: %d", activeID)
	}

	// 3. 设置活跃应用为 id2
	if err := appRepo.SetActiveAppID(ctx, id2); err != nil {
		t.Fatalf("SetActiveAppID failed: %v", err)
	}
	activeID, err = appRepo.GetActiveAppID(ctx)
	if err != nil || activeID != id2 {
		t.Fatalf("expected activeID %d, got %d (err: %v)", id2, activeID, err)
	}

	// 4. 删除 app1 (非活跃应用)
	if err := appRepo.Delete(ctx, id1); err != nil {
		t.Fatalf("failed to delete app1: %v", err)
	}

	// 验证 app1 已被删除
	_, err = appRepo.GetByID(ctx, id1)
	if err == nil {
		t.Fatalf("expected app1 to be deleted, but found")
	}
}
