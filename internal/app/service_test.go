package app_test

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/app"
	"buildui/internal/db"
)

// v1.REQ-001-AC-001 & v1.REQ-001-AC-002: AppService.CreateApp 基础脚手架展开与应用创建测试
func TestAppService_CreateApp(t *testing.T) {
	ctx := context.Background()

	// 1. 初始化纯 Go 内存数据库
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open test database: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	svc := app.NewAppService(appRepo, database)

	// 2. 准备临时测试目录
	tempDir, err := os.MkdirTemp("", "blot-test-app-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	targetPath := filepath.Join(tempDir, "sample-ai-app")

	req := app.CreateAppRequest{
		Name:       "Sample AI App",
		TemplateID: "react",
		CustomPath: targetPath,
	}

	// 3. 执行应用创建
	resp, err := svc.CreateApp(ctx, req)
	if err != nil {
		t.Fatalf("CreateApp failed: %v", err)
	}

	if resp.AppID <= 0 {
		t.Fatalf("expected positive AppID, got %d", resp.AppID)
	}
	if resp.Name != "Sample AI App" {
		t.Fatalf("unexpected app name: %s", resp.Name)
	}
	if resp.Path != targetPath {
		t.Fatalf("unexpected app path: %s", resp.Path)
	}
	if resp.InitialCommitHash == "" {
		t.Fatalf("expected non-empty initial commit hash")
	}

	// 4. 验证关键文件已展开
	requiredFiles := []string{
		"package.json",
		"vite.config.ts",
		"src/App.tsx",
		"src/pages/Index.tsx",
		"src/components/ui/button.tsx",
		"AI_RULES.md",
	}

	for _, file := range requiredFiles {
		fp := filepath.Join(targetPath, file)
		if _, err := os.Stat(fp); os.IsNotExist(err) {
			t.Fatalf("expected required file to exist: %s", file)
		}
	}

	// 5. 验证 Git 状态 clean
	cmd := exec.Command("git", "status", "--porcelain")
	cmd.Dir = targetPath
	out, err := cmd.Output()
	if err != nil {
		t.Fatalf("failed to run git status on target app: %v", err)
	}
	if strings.TrimSpace(string(out)) != "" {
		t.Fatalf("expected clean git status, got: %s", string(out))
	}

	// 6. 验证 SQLite 数据库持久化记录
	dbApp, err := appRepo.GetByID(ctx, resp.AppID)
	if err != nil {
		t.Fatalf("failed to query app from database: %v", err)
	}
	if dbApp.Name != "Sample AI App" || dbApp.Path != targetPath {
		t.Fatalf("database app mismatch: %+v", dbApp)
	}

	// 7. 测试 ListApps
	apps, err := svc.ListApps(ctx)
	if err != nil {
		t.Fatalf("ListApps failed: %v", err)
	}
	if len(apps) != 1 || apps[0].ID != resp.AppID {
		t.Fatalf("unexpected ListApps output: %+v", apps)
	}

	// 8. 测试在已占用的非空目录重复创建报错
	_, err = svc.CreateApp(ctx, app.CreateAppRequest{
		Name:       "Occupied App",
		CustomPath: targetPath,
	})
	if err == nil {
		t.Fatal("expected precondition error for non-empty directory, got nil")
	}
}

func TestAppService_CreateApp_Validation(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	svc := app.NewAppService(db.NewAppRepository(database), database)

	// 空应用名应被拒绝
	_, err = svc.CreateApp(ctx, app.CreateAppRequest{Name: ""})
	if err == nil {
		t.Fatal("expected validation error for empty name, got nil")
	}
}
