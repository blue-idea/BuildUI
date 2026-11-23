package scaffold_test

import (
	"os"
	"path/filepath"
	"testing"

	"buildui/internal/scaffold"
)

func TestPrepareExpoPreview(t *testing.T) {
	project := t.TempDir()
	original := []byte("module.exports = { projectRoot: __dirname };")
	projectConfig := filepath.Join(project, "metro.config.js")
	if err := os.WriteFile(projectConfig, original, 0600); err != nil {
		t.Fatal(err)
	}

	previewConfig, cleanup, err := scaffold.PrepareExpoPreview(project)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(cleanup)
	dir := filepath.Dir(previewConfig)
	if filepath.Dir(dir) != filepath.Join(project, ".expo") {
		t.Fatal("preview assets must be in the Expo cache")
	}
	for _, name := range []string{filepath.Base(previewConfig), "transformer.cjs", "preview-inspector.js"} {
		if _, err := os.Stat(filepath.Join(dir, name)); err != nil {
			t.Error(err)
		}
	}
	data, err := os.ReadFile(projectConfig)
	if err != nil || string(data) != string(original) {
		t.Fatalf("project config changed: %q, %v", data, err)
	}
	cleanup()
	if _, err := os.Stat(dir); !os.IsNotExist(err) {
		t.Fatalf("preview runtime still exists: %v", err)
	}
}
