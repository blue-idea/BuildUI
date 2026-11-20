package scaffold_test

import (
	"os"
	"path/filepath"
	"testing"

	"buildui/internal/scaffold"
)

func TestScaffold_Extract(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "scaffold-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	targetDir := filepath.Join(tempDir, "my-extracted-app")
	if err := scaffold.Extract(targetDir, "My Special App"); err != nil {
		t.Fatalf("failed to extract scaffold: %v", err)
	}

	pkgPath := filepath.Join(targetDir, "package.json")
	data, err := os.ReadFile(pkgPath)
	if err != nil {
		t.Fatalf("failed to read extracted package.json: %v", err)
	}

	content := string(data)
	if !filepath.IsAbs(pkgPath) {
		t.Fatalf("expected absolute path")
	}
	if len(content) == 0 {
		t.Fatalf("expected non-empty package.json")
	}
}
