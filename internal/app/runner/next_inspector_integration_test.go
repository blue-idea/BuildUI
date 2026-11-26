package runner

import (
	"context"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"buildui/internal/config"
	"buildui/internal/scaffold"
)

// v29.REQ-021 / AC-021-01：旧版创建的 Next.js 工程也应提供局部编辑标记与交互脚本。
func TestNextPreviewInspectorIntegration(t *testing.T) {
	if os.Getenv("BUILDUI_TEST_NEXT_INSPECTOR") != "1" {
		t.Skip("Set BUILDUI_TEST_NEXT_INSPECTOR=1 to run with Node and pnpm.")
	}
	root := filepath.Join(t.TempDir(), "局部编辑 preview")
	if err := scaffold.ExtractForTemplate(root, "Sample AI App", config.NextTemplateID); err != nil {
		t.Fatal(err)
	}
	clientPage := `'use client';
export default function ClientButton() {
  return <button type="button">Inspect client button</button>;
}
`
	serverPage := `import ClientButton from './client-button';
export default function Page() {
  return <main><h1>Next.js Starter</h1><ClientButton /></main>;
}
`
	for name, source := range map[string]string{"src/app/client-button.tsx": clientPage, "src/app/page.tsx": serverPage} {
		if err := os.WriteFile(filepath.Join(root, name), []byte(source), 0644); err != nil {
			t.Fatal(err)
		}
	}
	configPath := filepath.Join(root, config.NextTemplateConfig)
	originalConfig, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(t.Context(), 3*time.Minute)
	defer cancel()
	r := NewAppRunner(nil)
	defer func() { _ = r.StopApp(context.Background(), 1) }()
	started, err := r.StartApp(ctx, 1, root)
	if err != nil {
		t.Fatal(err)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, started.PreviewURL, nil)
	if err != nil {
		t.Fatal(err)
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	html, err := io.ReadAll(response.Body)
	if err != nil || response.StatusCode != http.StatusOK {
		t.Fatalf("preview returned HTTP %d: %v", response.StatusCode, err)
	}
	for _, marker := range []string{
		`data-buildui-source="src/app/page.tsx:3:16"`,
		`data-buildui-source="src/app/client-button.tsx:3:10"`,
		"buildui:element-selected",
	} {
		if !strings.Contains(string(html), marker) {
			t.Errorf("preview does not contain %q", marker)
		}
	}
	if after, err := os.ReadFile(configPath); err != nil || string(after) != string(originalConfig) {
		t.Fatalf("Next.js preview rewrote next.config.ts: %v", err)
	}
}
