package app_test

import (
	"context"
	"os"
	"path/filepath"
	"sync"
	"testing"

	"buildui/internal/app"
	"buildui/internal/app/runner"
	"buildui/internal/db"
)

// v14.REQ-001-AC-001, AC-002, AC-003 & v14.REQ-002-AC-002
func TestAppService_DeleteApp_DirectoryCleanAndSafety(t *testing.T) {
	ctx := context.Background()

	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	svc := app.NewAppService(appRepo, database)

	tempDir, err := os.MkdirTemp("", "blot-delete-dir-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// 创建两个应用：App1 和 App2
	app1Path := filepath.Join(tempDir, "app-one")
	app1Resp, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name:       "App One",
		CustomPath: app1Path,
	})
	if err != nil {
		t.Fatalf("CreateApp 1 failed: %v", err)
	}

	app2Path := filepath.Join(tempDir, "app-two")
	app2Resp, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name:       "App Two",
		CustomPath: app2Path,
	})
	if err != nil {
		t.Fatalf("CreateApp 2 failed: %v", err)
	}

	// 确认两个应用的物理目录均已存在
	if _, err := os.Stat(app1Path); err != nil {
		t.Fatalf("expected app1 directory to exist on disk: %v", err)
	}
	if _, err := os.Stat(app2Path); err != nil {
		t.Fatalf("expected app2 directory to exist on disk: %v", err)
	}

	// 激活 App2
	if _, err := svc.SwitchApp(ctx, app2Resp.AppID); err != nil {
		t.Fatalf("SwitchApp to app2 failed: %v", err)
	}

	// 测试 1 (AC-002): 尝试删除当前活跃的 App2 应当被拒绝，且其磁盘目录必须完整保留
	err = svc.DeleteApp(ctx, app2Resp.AppID)
	if err == nil {
		t.Fatalf("expected error when deleting active app, got nil")
	}
	if _, err := os.Stat(app2Path); os.IsNotExist(err) {
		t.Fatalf("active app directory should NOT be deleted, but it was missing")
	}

	// 测试 2 (AC-001): 删除非活跃的 App1 应当成功，且其物理磁盘目录必须被同步删除
	err = svc.DeleteApp(ctx, app1Resp.AppID)
	if err != nil {
		t.Fatalf("failed to delete inactive app1: %v", err)
	}
	// 验证数据库中已无 App1
	if _, err := appRepo.GetByID(ctx, app1Resp.AppID); err == nil {
		t.Fatalf("expected app1 to be deleted from database")
	}
	// 验证磁盘上的 App1 目录已被物理彻底删除
	if _, err := os.Stat(app1Path); !os.IsNotExist(err) {
		t.Fatalf("expected app1 directory %s to be deleted from disk, but it still exists", app1Path)
	}

	// 测试 3 (v14.REQ-002-AC-002): 容错测试：若磁盘目录已不存在，删除仍应正常清理数据库
	app3Path := filepath.Join(tempDir, "app-three")
	app3Resp, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name:       "App Three",
		CustomPath: app3Path,
	})
	if err != nil {
		t.Fatalf("CreateApp 3 failed: %v", err)
	}
	// 模拟外部先删除了目录
	_ = os.RemoveAll(app3Path)
	err = svc.DeleteApp(ctx, app3Resp.AppID)
	if err != nil {
		t.Fatalf("expected DeleteApp to succeed even if directory already absent, got %v", err)
	}
	if _, err := appRepo.GetByID(ctx, app3Resp.AppID); err == nil {
		t.Fatalf("expected app3 to be deleted from database")
	}
}

// 验证删除工程前若存在运行态 Runner 实例，应被安全终止
func TestAppService_DeleteApp_StopsRunner(t *testing.T) {
	ctx := context.Background()

	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	svc := app.NewAppService(appRepo, database)

	mockLauncher := &mockAppLauncher{
		running: make(map[int]bool),
	}
	appRunner := runner.NewAppRunnerWithLauncher(mockLauncher, nil)
	svc.SetRunner(appRunner)

	tempDir, err := os.MkdirTemp("", "blot-delete-runner-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	app1Path := filepath.Join(tempDir, "runner-app-1")
	app1Resp, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name:       "Runner App 1",
		CustomPath: app1Path,
	})
	if err != nil {
		t.Fatalf("CreateApp 1 failed: %v", err)
	}

	app2Path := filepath.Join(tempDir, "runner-app-2")
	app2Resp, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name:       "Runner App 2",
		CustomPath: app2Path,
	})
	if err != nil {
		t.Fatalf("CreateApp 2 failed: %v", err)
	}

	// 激活 App2，使 App1 处于非活跃态
	if _, err := svc.SwitchApp(ctx, app2Resp.AppID); err != nil {
		t.Fatalf("SwitchApp failed: %v", err)
	}

	// 启动 App1 runner
	_, err = svc.RunApp(ctx, runner.RunAppRequest{AppID: app1Resp.AppID})
	if err != nil {
		t.Fatalf("RunApp failed: %v", err)
	}

	if !appRunner.IsRunning(app1Resp.AppID) {
		t.Fatalf("expected appRunner to be running for app1")
	}

	// 执行删除 App1
	if err := svc.DeleteApp(ctx, app1Resp.AppID); err != nil {
		t.Fatalf("DeleteApp failed: %v", err)
	}

	// 验证 mockLauncher 与 appRunner 中 App1 已停止
	if appRunner.IsRunning(app1Resp.AppID) {
		t.Fatalf("expected runner to be stopped for deleted app1, but it was still running")
	}

	// 验证物理目录已被删除
	if _, err := os.Stat(app1Path); !os.IsNotExist(err) {
		t.Fatalf("expected app1 directory to be removed from disk, but it still exists")
	}
}

type mockAppLauncher struct {
	mu      sync.Mutex
	running map[int]bool
}

func (m *mockAppLauncher) Launch(ctx context.Context, appPath string, onOutput func(string), onExit func(error)) (int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	pid := 8888
	m.running[pid] = true
	go func() {
		onOutput("  ➜  Local:   http://localhost:5173/\n")
	}()
	return pid, nil
}

func (m *mockAppLauncher) Kill(pid int) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.running, pid)
	return nil
}
