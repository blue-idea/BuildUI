package agent

import (
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"buildui/internal/config"
)

func TestNativeDesignContextMatchesProjectEntry(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, config.NativeAppMarker), []byte(config.NativeAppTemplate), 0600); err != nil {
		t.Fatal(err)
	}
	legacy := projectStackContext(root)
	if !strings.Contains(legacy, "App.tsx") {
		t.Fatal("existing native projects must retain their entry point")
	}
	if err := os.WriteFile(filepath.Join(root, "package.json"), []byte(`{"main":"expo-router/entry"}`), 0600); err != nil {
		t.Fatal(err)
	}
	router := projectStackContext(root)
	for _, term := range []string{"Expo Router", "Font Awesome", "390×844", "360×800", "48×48", "one core task", "completed actions", `Redirect href="/(tabs)"`} {
		if !strings.Contains(router, term) {
			t.Errorf("native context is missing %q", term)
		}
	}
	if strings.Contains(router, "entry screen is App.tsx") || !slices.Contains(requestedSourcePaths(root, ""), "src/app/_layout.tsx") {
		t.Fatal("router projects must use their actual route layout")
	}
	for _, path := range []string{"src/app/(tabs)/index.tsx", "src/app/note/[id].tsx"} {
		if heard := requestedSourcePaths(root, "@"+path+": change the heading"); heard[0] != path {
			t.Errorf("source selection must preserve Expo Router route path %s", path)
		}
	}
	if projectStackContext(t.TempDir()) != "" {
		t.Fatal("mobile rules must apply only to native projects")
	}
}
