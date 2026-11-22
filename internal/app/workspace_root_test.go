package app_test

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/app"
	"buildui/internal/db"
)

// v16.REQ-001-AC-001, AC-002, AC-003: 验证 AppService 动态读取 settings 中的 workspace.dir 并在新建项目时生效
func TestWorkspaceRoot_DynamicSettingsBinding(t *testing.T) {
	ctx := context.Background()

	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open in-memory db: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	settingsRepo := db.NewSettingsRepository(database)
	svc := app.NewAppService(appRepo, database)

	tempDir, err := os.MkdirTemp("", "blot-ws-root-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	customWorkspace1 := filepath.Join(tempDir, "custom-workspace-1")
	customWorkspace2 := filepath.Join(tempDir, "custom-workspace-2")
	_ = os.MkdirAll(customWorkspace1, 0755)
	_ = os.MkdirAll(customWorkspace2, 0755)

	// 1. 在未设置 settings 时，默认回退
	defaultFallback := svc.GetWorkspaceRoot(ctx)
	if defaultFallback == "" {
		t.Fatalf("expected non-empty default fallback workspace root")
	}

	// 2. 在 settings 表中写入 workspace.dir
	if err := settingsRepo.Set(ctx, "workspace.dir", customWorkspace1); err != nil {
		t.Fatalf("failed to save workspace.dir to settings: %v", err)
	}

	// 验证 GetWorkspaceRoot 动态识别新路径
	activeRoot := svc.GetWorkspaceRoot(ctx)
	if filepath.Clean(activeRoot) != filepath.Clean(customWorkspace1) {
		t.Fatalf("expected workspace root %q, got %q", customWorkspace1, activeRoot)
	}

	// 3. 调用 CreateApp（不传 CustomPath），验证项目创建在 customWorkspace1 下
	resp1, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name: "App Under Workspace 1",
	})
	if err != nil {
		t.Fatalf("CreateApp 1 failed: %v", err)
	}

	if !strings.HasPrefix(filepath.Clean(resp1.Path), filepath.Clean(customWorkspace1)) {
		t.Fatalf("expected app path %q to be inside customWorkspace1 %q", resp1.Path, customWorkspace1)
	}
	// 验证磁盘上真实生成了目录
	if _, err := os.Stat(resp1.Path); err != nil {
		t.Fatalf("expected project directory to exist on disk at %q: %v", resp1.Path, err)
	}

	// 4. 用户在设置中更新为新的 workspace.dir (customWorkspace2)
	if err := settingsRepo.Set(ctx, "workspace.dir", customWorkspace2); err != nil {
		t.Fatalf("failed to update workspace.dir in settings: %v", err)
	}

	// 验证无需重启，立即反映新路径
	activeRoot2 := svc.GetWorkspaceRoot(ctx)
	if filepath.Clean(activeRoot2) != filepath.Clean(customWorkspace2) {
		t.Fatalf("expected updated workspace root %q, got %q", customWorkspace2, activeRoot2)
	}

	// 5. 再次调用 CreateApp，验证新项目自动落盘在 customWorkspace2 下
	resp2, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name: "App Under Workspace 2",
	})
	if err != nil {
		t.Fatalf("CreateApp 2 failed: %v", err)
	}

	if !strings.HasPrefix(filepath.Clean(resp2.Path), filepath.Clean(customWorkspace2)) {
		t.Fatalf("expected app path %q to be inside customWorkspace2 %q", resp2.Path, customWorkspace2)
	}
	if _, err := os.Stat(resp2.Path); err != nil {
		t.Fatalf("expected project directory to exist on disk at %q: %v", resp2.Path, err)
	}
}
