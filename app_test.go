package main

import (
	"testing"
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
