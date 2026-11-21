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
