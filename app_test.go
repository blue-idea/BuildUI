package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/app"
	"buildui/internal/app/runner"
	"buildui/internal/blueprint"
	"buildui/internal/db"
	"buildui/internal/theme"
	"buildui/internal/verification/tsc"
)

func TestApp_SelectDirectory(t *testing.T) {
	app := NewApp()
	dir, err := app.SelectDirectory("Select Workspace")
	if err != nil {
		t.Fatalf("expected no error when ctx is nil, got: %v", err)
	}
	if dir != "" {
		t.Errorf("expected empty string when ctx is nil, got %q", dir)
	}
}

func TestApp_InstallDependencies(t *testing.T) {
	app := NewApp()
	// appRepo 为 nil 时应安全返回 nil
	err := app.InstallDependencies(1, []string{"lucide-react"})
	if err != nil {
		t.Fatalf("expected nil when appRepo is nil, got: %v", err)
	}
}

func TestApp_GetAppTemplatesAndCreate(t *testing.T) {
	app := NewApp()
	templates := app.GetAppTemplates()
	if len(templates) < 4 {
		t.Fatalf("expected at least 4 templates, got %d", len(templates))
	}
}

func TestApp_CreateAppWorkflow(t *testing.T) {
	tmpDir := t.TempDir()
	t.Setenv("BLOT_DEV_USER_DATA_DIR", tmpDir)

	a := NewApp()
	a.startup(t.Context())
	defer a.shutdown(t.Context())

	res, err := a.CreateApp(app.CreateAppRequest{
		Name: "test",
	})
	if err != nil {
		t.Fatalf("CreateApp failed: %v", err)
	}
	t.Logf("Created app id: %d, path: %s", res.AppID, res.Path)

	chat, err := a.GetProjectChat(res.AppID)
	if err != nil {
		t.Fatalf("GetProjectChat failed: %v", err)
	}
	t.Logf("Chat created with ID: %d", chat.ChatID)
}

func TestApp_ListProviderModels(t *testing.T) {
	a := NewApp()
	// 未初始化 startup 时安全回退
	models, err := a.ListProviderModels("ollama", "", "")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(models) == 0 {
		t.Fatalf("expected non-empty fallback models")
	}

	tmpDir := t.TempDir()
	t.Setenv("BLOT_DEV_USER_DATA_DIR", tmpDir)
	a.startup(t.Context())
	defer a.shutdown(t.Context())

	models, err = a.ListProviderModels("openai", "", "")
	if err != nil {
		t.Fatalf("expected no error with service initialized, got: %v", err)
	}
	if len(models) == 0 {
		t.Fatalf("expected non-empty fallback models for openai")
	}
}

func TestApp_RunAppChecksAndRepairsBeforeOpeningPreview(t *testing.T) {
	ctx := t.Context()
	t.Setenv("BLOT_DEV_USER_DATA_DIR", t.TempDir())
	a := NewApp()
	a.startup(ctx)
	defer a.shutdown(ctx)
	a.chatService.SetEmitter(nil)
	a.blueprintService.SetEmitter(nil)

	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "tsconfig.json"), []byte("{}"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(root, "node_modules"), 0755); err != nil {
		t.Fatal(err)
	}
	entry := filepath.Join(root, "Index.tsx")
	writeEntry := func(source string) {
		t.Helper()
		if err := os.WriteFile(entry, []byte(source), 0644); err != nil {
			t.Fatal(err)
		}
	}
	writeEntry("export const podcast = 'ready';")
	projectID, err := a.appRepo.Create(ctx, &db.AppEntity{Name: "Podcast", Path: root, NeedsAppBlueprint: true})
	if err != nil {
		t.Fatal(err)
	}
	chat, err := a.GetProjectChat(projectID)
	if err != nil {
		t.Fatal(err)
	}
	launcher := &previewTestLauncher{}
	a.appService.SetRunner(runner.NewAppRunnerWithLauncher(launcher, nil))
	a.chatService.SetBuildProblems(tsc.NewProblemsService(a.appRepo, previewTestTsc{}))
	req := runner.RunAppRequest{AppID: projectID}

	first, err := a.RunApp(req)
	if err != nil || first.PreviewURL == "" || launcher.launches != 1 {
		t.Fatalf("没有模型配置时也应打开通过检查的工程：%+v, %v", first, err)
	}
	writeEntry(`import { HeroSection } from "@/components/site/HeroSection";`)
	if _, err := a.RunApp(req); err == nil || !strings.Contains(err.Error(), "HeroSection") {
		t.Fatalf("刷新正在运行的工程也应报告缺失导入：%v", err)
	}
	if _, err := a.RunApp(runner.RunAppRequest{AppID: projectID, Restart: true}); err == nil || launcher.killed != 0 {
		t.Fatalf("检查失败时应保留已运行的服务器：%v", err)
	}
	if err := a.StopApp(runner.StopAppRequest{AppID: projectID}); err != nil {
		t.Fatal(err)
	}
	if err := a.blueprintService.SaveBlueprint(ctx, blueprint.BlueprintDTO{ChatID: chat.ChatID, AppName: "Podcast"}); err != nil {
		t.Fatal(err)
	}
	if err := a.ApproveBlueprint(chat.ChatID); err != nil {
		t.Fatal(err)
	}
	if _, err := a.RunApp(req); err == nil || !strings.Contains(err.Error(), "HeroSection") || !strings.Contains(err.Error(), "Configure the model") {
		t.Fatalf("无法修复时应返回诊断和配置原因：%v", err)
	}
	if launcher.launches != 1 {
		t.Fatal("有错误的工程不应启动新服务器")
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		fmt.Fprint(w, "data: {\"choices\":[{\"delta\":{\"content\":\"<dyad-write path=\\\"Index.tsx\\\">export const podcast = 'ready';</dyad-write>\"}}]}\n\ndata: [DONE]\n\n")
	}))
	defer server.Close()
	if err := db.NewSettingsRepository(a.db).SetMany(ctx, map[string]string{"llm.base_url": server.URL, "llm.model": "podcast-test"}); err != nil {
		t.Fatal(err)
	}
	fixed, err := a.RunApp(req)
	if err != nil || fixed.PreviewURL == "" || launcher.launches != 2 {
		t.Fatalf("修复并通过复查后应启动预览：%+v, %v", fixed, err)
	}
	if data, err := os.ReadFile(entry); err != nil || !strings.Contains(string(data), "podcast = 'ready'") {
		t.Fatalf("修复没有写入工作区：%q, %v", data, err)
	}

	// 默认刷新继续复用开发服务器，显式重新运行必须更换进程。
	reloaded, err := a.RunApp(req)
	if err != nil || reloaded.ProcessID != fixed.ProcessID || launcher.launches != 2 {
		t.Fatalf("刷新不应重启开发服务器：%+v, %v", reloaded, err)
	}
	restarted, err := a.RunApp(runner.RunAppRequest{AppID: projectID, Restart: true})
	if err != nil || restarted.ProcessID == fixed.ProcessID || launcher.launches != 3 || launcher.killed != fixed.ProcessID {
		t.Fatalf("重新运行应在检查通过后停止旧进程并启动新进程：%+v, %v", restarted, err)
	}
}

type previewTestTsc struct{}

func (previewTestTsc) RunTsc(_ context.Context, root string) (string, error) {
	data, err := os.ReadFile(filepath.Join(root, "Index.tsx"))
	if err != nil {
		return "", err
	}
	if strings.Contains(string(data), "HeroSection") {
		return "Index.tsx(1,1): error TS2307: Cannot find module '@/components/site/HeroSection'.", fmt.Errorf("exit code 2")
	}
	return "", nil
}

type previewTestLauncher struct{ launches, killed int }

func (l *previewTestLauncher) Launch(_ context.Context, _ string, onOutput func(string), _ func(error)) (int, error) {
	l.launches++
	onOutput("  ➜  Local:   http://127.0.0.1:8080/\n")
	return l.launches, nil
}

func (l *previewTestLauncher) Kill(pid int) error {
	l.killed = pid
	return nil
}

func TestApp_ExtractStyle(t *testing.T) {
	a := NewApp()
	// 未初始化 startup 时应报错
	_, err := a.ExtractStyle(theme.ExtractStyleRequest{Reference: "Linear"})
	if err == nil || !strings.Contains(err.Error(), "theme service is not initialized") {
		t.Fatalf("expected uninitialized error, got: %v", err)
	}

	tmpDir := t.TempDir()
	t.Setenv("BLOT_DEV_USER_DATA_DIR", tmpDir)
	a.startup(t.Context())
	defer a.shutdown(t.Context())

	// startup 后未配置 LLM 时应返回友好报错
	_, err = a.ExtractStyle(theme.ExtractStyleRequest{Reference: "Linear"})
	if err == nil || !strings.Contains(err.Error(), "Configure the model") {
		t.Fatalf("expected configure model error, got: %v", err)
	}
}

func TestApp_WindowSizeMemory(t *testing.T) {
	tmpDir := t.TempDir()
	t.Setenv("BLOT_DEV_USER_DATA_DIR", tmpDir)

	a := NewApp()

	// 1. 数据库未初始化或空配置时，获取初始尺寸应返回默认 1280x800
	w, h := a.GetInitialWindowSize()
	if w != 1280 || h != 800 {
		t.Fatalf("expected default (1280, 800), got (%d, %d)", w, h)
	}

	// 2. 初始化应用并启动
	ctx := t.Context()
	a.startup(ctx)
	defer a.shutdown(ctx)

	// 3. 保存窗口尺寸 1600x1000（记忆默认开启）
	err := a.SaveWindowSize(1600, 1000)
	if err != nil {
		t.Fatalf("SaveWindowSize failed: %v", err)
	}

	// 4. 重启实例前检查 GetInitialWindowSize
	w, h = a.GetInitialWindowSize()
	if w != 1600 || h != 1000 {
		t.Fatalf("expected remembered size (1600, 1000), got (%d, %d)", w, h)
	}

	// 5. 关闭记忆开关
	err = a.SaveSettings(map[string]string{
		"window.remember_size": "false",
	})
	if err != nil {
		t.Fatalf("SaveSettings failed: %v", err)
	}

	// 6. 当记忆开关关闭时，GetInitialWindowSize 应回退到默认 1280x800
	w, h = a.GetInitialWindowSize()
	if w != 1280 || h != 800 {
		t.Fatalf("expected fallback (1280, 800) when remember disabled, got (%d, %d)", w, h)
	}

	// 7. 当记忆开关关闭时，调用 SaveWindowSize 不应更新尺寸
	_ = a.SaveWindowSize(1920, 1080)
	w, h = a.GetInitialWindowSize()
	if w != 1280 || h != 800 {
		t.Fatalf("expected still default (1280, 800), got (%d, %d)", w, h)
	}
}
