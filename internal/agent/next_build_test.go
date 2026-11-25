package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync/atomic"
	"testing"

	"buildui/internal/blueprint"
	"buildui/internal/config"
	"buildui/internal/db"
	"buildui/internal/llm"
	"buildui/internal/verification/tsc"
)

func TestParseNextBuildDiagnostics(t *testing.T) {
	output := `
./src/app/page.tsx:4:9
Type error: Type 'string' is not assignable to type 'number'.
`

	problems := parseNextBuildDiagnostics(t.TempDir(), output)
	if len(problems) != 1 {
		t.Fatalf("expected one Next.js diagnostic, got %+v", problems)
	}
	problem := problems[0]
	if problem.Tool != "Next.js" || problem.File != "src/app/page.tsx" || problem.Line != 4 || problem.Column != 9 {
		t.Fatalf("unexpected Next.js diagnostic location: %+v", problem)
	}
	if !strings.Contains(problem.Message, "not assignable") {
		t.Fatalf("unexpected Next.js diagnostic message: %q", problem.Message)
	}
}

func TestCheckNextBuildReportsDiagnostic(t *testing.T) {
	root := t.TempDir()
	writeNextBuildFixture(t, root, true)
	bin := t.TempDir()
	installFakePnpm(t, bin)
	t.Setenv("PATH", bin+string(os.PathListSeparator)+os.Getenv("PATH"))

	problems, err := checkNextBuild(context.Background(), root)
	if err != nil {
		t.Fatalf("checkNextBuild returned an execution error: %v", err)
	}
	if len(problems) != 1 || problems[0].File != config.NextTemplatePage {
		t.Fatalf("expected the page diagnostic, got %+v", problems)
	}
	if !strings.Contains(problems[0].Message, "not assignable") {
		t.Fatalf("expected the Next.js build error to be preserved, got %+v", problems[0])
	}
}

func TestNextBuildGenerationRepairsCompileFailure(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	writeNextBuildFixture(t, root, true)
	bin := t.TempDir()
	installFakePnpm(t, bin)
	t.Setenv("PATH", bin+string(os.PathListSeparator)+os.Getenv("PATH"))

	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	apps := db.NewAppRepository(database)
	appID, err := apps.Create(ctx, &db.AppEntity{Name: "Next Repair", Path: root, NeedsAppBlueprint: true})
	if err != nil {
		t.Fatal(err)
	}
	chatID, err := db.NewChatRepository(database).Create(ctx, &db.ChatEntity{AppID: appID, Title: "Next Repair"})
	if err != nil {
		t.Fatal(err)
	}
	bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)
	if err := bps.SaveBlueprint(ctx, blueprint.BlueprintDTO{
		ChatID: chatID, AppName: "Next Repair", DesignDirection: "Next.js dashboard", PrimaryColor: "#2563eb",
	}); err != nil {
		t.Fatal(err)
	}
	if err := bps.ApproveBlueprint(ctx, chatID); err != nil {
		t.Fatal(err)
	}

	var repairs atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var request llm.ChatRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil || len(request.Messages) < 2 {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		system := request.Messages[0].Content
		last := request.Messages[len(request.Messages)-1].Content
		switch {
		case strings.Contains(system, "Build planning protocol"):
			writeBuildReply(w, fmt.Sprintf(`{"objective":"Build the dashboard","steps":[{"title":"Build home","goal":"Create the dashboard home","files":[%q]}]}`, config.NextTemplatePage))
		case strings.Contains(last, "Current build step"):
			writeBuildReply(w, fmt.Sprintf(`<dyad-write path="%s">export default function Home() { const value: number = "broken"; return <main>{value}</main>; }</dyad-write>`, config.NextTemplatePage))
		case strings.Contains(last, "Build the Next.js dashboard"):
			writeBuildReply(w, fmt.Sprintf(`<dyad-write path="%s">export default function Home() { const value: number = "broken"; return <main>{value}</main>; }</dyad-write>`, config.NextTemplatePage))
		case strings.Contains(last, "Next.js compilation failed"):
			repairs.Add(1)
			writeBuildReply(w, fmt.Sprintf(`<dyad-write path="%s">export default function Home() { const value: number = 1; return <main>{value}</main>; }</dyad-write>`, config.NextTemplatePage))
		default:
			http.Error(w, "Missing Next.js repair request", http.StatusBadRequest)
		}
	}))
	defer server.Close()
	if err := db.NewSettingsRepository(database).SetMany(ctx, map[string]string{"llm.base_url": server.URL, "llm.model": "next-test"}); err != nil {
		t.Fatal(err)
	}
	service := testBuildService(database)
	service.SetBuildProblems(tsc.NewProblemsService(apps, nil))

	if err := service.StreamChat(ctx, StreamChatRequest{ChatID: chatID, Mode: "edit", Prompt: "Build the Next.js dashboard"}); err != nil {
		t.Fatalf("Next.js generation failed: %v", err)
	}
	if repairs.Load() != 1 {
		t.Fatalf("expected one Next.js repair request, got %d", repairs.Load())
	}
	source, err := os.ReadFile(filepath.Join(root, filepath.FromSlash(config.NextTemplatePage)))
	if err != nil || !strings.Contains(string(source), "const value: number = 1") {
		t.Fatalf("Next.js repair was not written: %s (%v)", source, err)
	}
}

func writeNextBuildFixture(t *testing.T, root string, broken bool) {
	t.Helper()
	files := map[string]string{
		"next.config.ts": "import type { NextConfig } from 'next';\nconst config: NextConfig = {};\nexport default config;\n",
		"tsconfig.json":  `{}`,
		"package.json":   `{"scripts":{"build":"next build"},"devDependencies":{"next":"16.4.6","typescript":"5.9.0"}}`,
	}
	page := `export default function Home() { const value: number = 1; return <main>{value}</main>; }`
	if broken {
		page = `export default function Home() { const value: number = "broken"; return <main>{value}</main>; }`
	}
	files[config.NextTemplatePage] = page
	for name, source := range files {
		path := filepath.Join(root, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(source), 0644); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.MkdirAll(filepath.Join(root, "node_modules", ".bin"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "node_modules", ".modules.yaml"), []byte("layoutVersion: 5\n"), 0644); err != nil {
		t.Fatal(err)
	}
	for _, command := range []string{"next", "tsc"} {
		name := command
		if runtime.GOOS == "windows" {
			name += ".cmd"
		}
		if err := os.WriteFile(filepath.Join(root, "node_modules", ".bin", name), []byte(""), 0755); err != nil {
			t.Fatal(err)
		}
	}
}

func installFakePnpm(t *testing.T, bin string) {
	t.Helper()
	var name string
	var source string
	if runtime.GOOS == "windows" {
		name = "pnpm.cmd"
		source = `@echo off
if "%1"=="install" exit /b 0
if not "%1"=="exec" exit /b 0
if "%2"=="tsc" exit /b 0
if not "%2"=="next" exit /b 0
if not "%3"=="build" exit /b 0
findstr /C:"broken" src\app\page.tsx >nul
if errorlevel 1 exit /b 0
echo ./src/app/page.tsx:4:9
echo Type error: Type 'string' is not assignable to type 'number'.
exit /b 1
`
	} else {
		name = "pnpm"
		source = `#!/bin/sh
case "$*" in
  install) exit 0 ;;
  "exec tsc --noEmit") exit 0 ;;
  "exec next build")
    if grep -q broken src/app/page.tsx; then
      printf './src/app/page.tsx:4:9\nType error: Type '\''string'\'' is not assignable to type '\''number'\''.\n'
      exit 1
    fi
    exit 0
    ;;
esac
exit 0
`
	}
	if err := os.WriteFile(filepath.Join(bin, name), []byte(source), 0755); err != nil {
		t.Fatal(err)
	}
}
