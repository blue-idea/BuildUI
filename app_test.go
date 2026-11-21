package main

import (
	"testing"

	"buildui/internal/app"
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
