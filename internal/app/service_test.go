package app_test

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/app"
	"buildui/internal/app/runner"
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

	// 验证应用创建时已同步生成初始会话 ChatEntity
	chatRepo := db.NewChatRepository(database)
	chats, err := chatRepo.ListByAppID(ctx, resp.AppID)
	if err != nil {
		t.Fatalf("failed to list chats for created app: %v", err)
	}
	if len(chats) != 1 {
		t.Fatalf("expected 1 initial chat, got %d", len(chats))
	}
	if chats[0].Title != "Sample AI App" {
		t.Fatalf("expected chat title %q, got %q", "Sample AI App", chats[0].Title)
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

type mockRunnerLauncher struct{}

func (m *mockRunnerLauncher) Launch(ctx context.Context, appPath string, onOutput func(string), onExit func(error)) (int, error) {
	go func() {
		onOutput("  ➜  Local:   http://localhost:5173/\n")
	}()
	return 9999, nil
}

func (m *mockRunnerLauncher) Kill(pid int) error {
	return nil
}

// v1.REQ-006-AC-001: 校验 AppService 驱动 RunApp 与 StopApp
func TestAppService_RunAppAndStopApp(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	svc := app.NewAppService(appRepo, database)

	tempDir, err := os.MkdirTemp("", "blot-test-runapp-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	appID, err := appRepo.Create(ctx, &db.AppEntity{
		Name: "Test Run App",
		Path: tempDir,
	})
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}

	mockLauncher := &mockRunnerLauncher{}
	appRunner := runner.NewAppRunnerWithLauncher(mockLauncher, nil)
	svc.SetRunner(appRunner)

	// 测试 RunApp
	runResp, err := svc.RunApp(ctx, runner.RunAppRequest{AppID: appID})
	if err != nil {
		t.Fatalf("RunApp failed: %v", err)
	}
	if runResp.Status != "running" || runResp.PreviewURL != "http://localhost:5173" {
		t.Fatalf("unexpected RunApp response: %+v", runResp)
	}

	// 测试 StopApp
	err = svc.StopApp(ctx, runner.StopAppRequest{AppID: appID})
	if err != nil {
		t.Fatalf("StopApp failed: %v", err)
	}

	// 测试非法 AppID
	_, err = svc.RunApp(ctx, runner.RunAppRequest{AppID: -1})
	if err == nil {
		t.Fatal("expected validation error for invalid app ID, got nil")
	}
}

// v22.REQ-001-AC-001：首页 App 路线展开独立脚手架，并沿用工作区初始化。
func TestAppService_CreateNativeApp(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()

	svc := app.NewAppService(db.NewAppRepository(database), database)
	resp, err := svc.CreateApp(ctx, app.CreateAppRequest{
		Name: "Fitness Check-in", TemplateID: "react-native", CustomPath: t.TempDir(),
	})
	if err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{".buildui-runtime", "src/app/_layout.tsx", "src/app/index.tsx", "app.config.js", "metro.config.js", "src/components/ui/button.tsx"} {
		if _, err := os.Stat(filepath.Join(resp.Path, name)); err != nil {
			t.Errorf("missing native scaffold file %s: %v", name, err)
		}
	}
	if _, err := os.Stat(filepath.Join(resp.Path, "vite.config.ts")); !os.IsNotExist(err) {
		t.Errorf("unexpected Vite configuration in native workspace: %v", err)
	}
	active, err := svc.SwitchApp(ctx, resp.AppID)
	if err != nil || !active.NativeApp {
		t.Fatalf("native app must use the phone preview: %+v, %v", active, err)
	}
	content, err := os.ReadFile(filepath.Join(resp.Path, "package.json"))
	if err != nil || !strings.Contains(string(content), `"name": "fitness-check-in"`) ||
		!strings.Contains(string(content), `"nativewind"`) || !strings.Contains(string(content), `"react-native"`) ||
		!strings.Contains(string(content), `"main": "expo-router/entry"`) || !strings.Contains(string(content), `"@expo/vector-icons"`) {
		t.Errorf("invalid native manifest: %s, %v", content, err)
	}
}
