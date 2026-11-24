package scaffold_test

import (
	"os"
	"path/filepath"
	"strings"
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

func TestAutoHealNativeRouterEntry(t *testing.T) {
	t.Run("heals placeholder index when tabs exist", func(t *testing.T) {
		project := t.TempDir()
		tabsDir := filepath.Join(project, "src", "app", "(tabs)")
		if err := os.MkdirAll(tabsDir, 0755); err != nil {
			t.Fatal(err)
		}
		indexPath := filepath.Join(project, "src", "app", "index.tsx")
		placeholder := `import { Text } from 'react-native';
export default function HomeScreen() {
  return <Text>Your app is ready to build.</Text>;
}`
		if err := os.WriteFile(indexPath, []byte(placeholder), 0644); err != nil {
			t.Fatal(err)
		}

		if err := scaffold.AutoHealNativeRouterEntry(project); err != nil {
			t.Fatalf("AutoHealNativeRouterEntry failed: %v", err)
		}

		healed, err := os.ReadFile(indexPath)
		if err != nil {
			t.Fatal(err)
		}
		if !strings.Contains(string(healed), `<Redirect href="/(tabs)" />`) {
			t.Fatalf("expected redirect to (tabs), got: %s", string(healed))
		}
	})

	t.Run("does not overwrite customized index", func(t *testing.T) {
		project := t.TempDir()
		tabsDir := filepath.Join(project, "src", "app", "(tabs)")
		if err := os.MkdirAll(tabsDir, 0755); err != nil {
			t.Fatal(err)
		}
		indexPath := filepath.Join(project, "src", "app", "index.tsx")
		custom := `import { View } from 'react-native';
export default function CustomHome() {
  return <View testID="custom-landing" />;
}`
		if err := os.WriteFile(indexPath, []byte(custom), 0644); err != nil {
			t.Fatal(err)
		}

		if err := scaffold.AutoHealNativeRouterEntry(project); err != nil {
			t.Fatalf("AutoHealNativeRouterEntry failed: %v", err)
		}

		content, err := os.ReadFile(indexPath)
		if err != nil {
			t.Fatal(err)
		}
		if string(content) != custom {
			t.Fatalf("custom index should not be overwritten, got: %s", string(content))
		}
	})

	t.Run("does nothing when no tabs directory", func(t *testing.T) {
		project := t.TempDir()
		appDir := filepath.Join(project, "src", "app")
		if err := os.MkdirAll(appDir, 0755); err != nil {
			t.Fatal(err)
		}
		indexPath := filepath.Join(appDir, "index.tsx")
		placeholder := `Your app is ready to build.`
		if err := os.WriteFile(indexPath, []byte(placeholder), 0644); err != nil {
			t.Fatal(err)
		}

		if err := scaffold.AutoHealNativeRouterEntry(project); err != nil {
			t.Fatalf("AutoHealNativeRouterEntry failed: %v", err)
		}

		content, err := os.ReadFile(indexPath)
		if err != nil {
			t.Fatal(err)
		}
		if string(content) != placeholder {
			t.Fatalf("placeholder should remain if tabs directory does not exist, got: %s", string(content))
		}
	})
}
