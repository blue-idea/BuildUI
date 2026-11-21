package app_test

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"buildui/internal/app"
	"buildui/internal/db"
)

// v3.REQ-001-AC-001 & v3.REQ-001-AC-003: AppService.SwitchApp 与 DeleteApp 测试
func TestAppService_SwitchAppAndDeleteApp(t *testing.T) {
	ctx := context.Background()

	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	svc := app.NewAppService(appRepo, database)

	tempDir, err := os.MkdirTemp("", "blot-switch-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// 创建两个应用
	app1Resp, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name:       "First App",
		CustomPath: filepath.Join(tempDir, "first-app"),
	})
	if err != nil {
		t.Fatalf("CreateApp 1 failed: %v", err)
	}

	app2Resp, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name:       "Second App",
		CustomPath: filepath.Join(tempDir, "second-app"),
	})
	if err != nil {
		t.Fatalf("CreateApp 2 failed: %v", err)
	}

	// 1. 切换到 Second App
	switchResp, err := svc.SwitchApp(ctx, app2Resp.AppID)
	if err != nil {
		t.Fatalf("SwitchApp failed: %v", err)
	}
	if switchResp.AppID != app2Resp.AppID {
		t.Fatalf("expected switched AppID %d, got %d", app2Resp.AppID, switchResp.AppID)
	}
	if switchResp.Name != "Second App" {
		t.Fatalf("expected switched Name 'Second App', got '%s'", switchResp.Name)
	}
	// 加载已有工程是读取操作，不能因配置表暂不可写而失败。
	_, err = database.SQLDB().ExecContext(ctx, `CREATE TRIGGER reject_active_write
		BEFORE UPDATE ON settings WHEN NEW.key = 'app.active_id'
		BEGIN SELECT RAISE(ABORT, 'active settings are read-only'); END;`)
	if err != nil {
		t.Fatal(err)
	}
	if active, err := svc.GetActiveApp(ctx); err != nil || active.AppID != app2Resp.AppID {
		t.Fatalf("加载项目时不应重写活跃配置：%+v, %v", active, err)
	}

	// 2. 尝试删除当前活跃的 Second App 应被拒绝
	err = svc.DeleteApp(ctx, app2Resp.AppID)
	if err == nil {
		t.Fatalf("expected error deleting active app, got nil")
	}

	// 3. 删除非活跃的 First App 应当成功
	err = svc.DeleteApp(ctx, app1Resp.AppID)
	if err != nil {
		t.Fatalf("failed to delete inactive app: %v", err)
	}

	// 验证列表只剩 1 个
	list, err := svc.ListApps(ctx)
	if err != nil || len(list) != 1 {
		t.Fatalf("expected 1 app left, got %d (err: %v)", len(list), err)
	}
	if list[0].ID != app2Resp.AppID {
		t.Fatalf("expected remaining app %d, got %d", app2Resp.AppID, list[0].ID)
	}
}
