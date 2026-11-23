package agent

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync/atomic"
	"testing"

	"buildui/internal/blueprint"
	"buildui/internal/db"
	"buildui/internal/llm"
	"buildui/internal/verification/tsc"
)

// v22.REQ-001-AC-002、AC-003：类型检查通过后，Metro 仍可报告需要修复的打包错误。
func TestNativeBuildPlansAndRepairsMetroFailure(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("The CLI fixture uses POSIX shell.")
	}
	ctx := context.Background()
	root := t.TempDir()
	bin := t.TempDir()
	t.Setenv("PATH", bin+string(os.PathListSeparator)+os.Getenv("PATH"))
	fixtures := map[string]string{
		".buildui-runtime": "react-native",
		"package.json":     `{"dependencies":{"expo":"54","react-native":"0.81"}}`,
		"tsconfig.json":    `{}`,
		"App.tsx":          `export default function App() { return null; }`,
	}
	for name, source := range fixtures {
		if err := os.WriteFile(filepath.Join(root, name), []byte(source), 0644); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.MkdirAll(filepath.Join(root, "node_modules", ".bin"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "node_modules/.bin/expo"), []byte("#!/bin/sh\n"), 0755); err != nil {
		t.Fatal(err)
	}
	cli := `#!/bin/sh
case "$*" in
  "exec tsc --noEmit") exit 0 ;;
  "exec expo export --platform all "*) ;;
  *) exit 2 ;;
esac
case "$(cat App.tsx)" in
  *missing-asset*)
    printf 'Unable to resolve "./missing-asset.png" from "App.tsx"\n'
    exit 1
    ;;
esac
`
	for _, name := range []string{filepath.Join(bin, "pnpm"), filepath.Join(root, "node_modules/.bin/tsc")} {
		if err := os.WriteFile(name, []byte(cli), 0755); err != nil {
			t.Fatal(err)
		}
	}

	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	apps := db.NewAppRepository(database)
	appID, err := apps.Create(ctx, &db.AppEntity{Name: "Fitness Check-in", Path: root, NeedsAppBlueprint: true})
	if err != nil {
		t.Fatal(err)
	}
	chatID, err := db.NewChatRepository(database).Create(ctx, &db.ChatEntity{AppID: appID, Title: "Fitness Check-in"})
	if err != nil {
		t.Fatal(err)
	}
	bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)
	if err := bps.SaveBlueprint(ctx, blueprint.BlueprintDTO{ChatID: chatID, AppName: "Fitness Check-in", DesignDirection: "Workout tracker", PrimaryColor: "#264653"}); err != nil {
		t.Fatal(err)
	}
	if err := bps.ApproveBlueprint(ctx, chatID); err != nil {
		t.Fatal(err)
	}

	var repairs atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var request llm.ChatRequest
		if json.NewDecoder(r.Body).Decode(&request) != nil || len(request.Messages) < 2 {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		system, user := request.Messages[0].Content, request.Messages[len(request.Messages)-1].Content
		for _, want := range []string{"React Native", "NativeWind", "React Native Reusables", "App.tsx"} {
			if !strings.Contains(system, want) || strings.Contains(system, "Vite") || strings.Contains(system, "lucide-react") {
				http.Error(w, "Missing React Native build context", http.StatusBadRequest)
				return
			}
		}
		switch {
		case strings.Contains(system, "Build planning protocol"):
			writeBuildReply(w, `{"objective":"Add workout tracker","steps":[{"title":"Build home","goal":"Show the workout tracker","files":["App.tsx"]}]}`)
		case strings.Contains(user, "Current build step"):
			writeBuildReply(w, `<dyad-write path="App.tsx">export default function App() { return require("./missing-asset.png"); }</dyad-write>`)
		case strings.Contains(user, "Metro") && strings.Contains(user, "Unable to resolve") && strings.Contains(user, "Current source: App.tsx"):
			repairs.Add(1)
			writeBuildReply(w, `<dyad-write path="App.tsx">export default function App() { return null; } // repaired</dyad-write>`)
		default:
			http.Error(w, "Missing Metro diagnostic and source", http.StatusBadRequest)
		}
	}))
	defer server.Close()
	if err := db.NewSettingsRepository(database).SetMany(ctx, map[string]string{"llm.base_url": server.URL, "llm.model": "native-test"}); err != nil {
		t.Fatal(err)
	}
	service := testBuildService(database)
	service.SetBuildProblems(tsc.NewProblemsService(apps, nil))
	if err := service.StreamChat(ctx, StreamChatRequest{ChatID: chatID, Mode: "build", Prompt: "Build a workout tracker"}); err != nil {
		t.Fatal(err)
	}
	if got := repairs.Load(); got != 1 {
		t.Fatalf("expected one Metro repair, got %d", got)
	}
	source, err := os.ReadFile(filepath.Join(root, "App.tsx"))
	if err != nil || !strings.Contains(string(source), "// repaired") {
		t.Fatalf("repair was not applied: %s, %v", source, err)
	}
}
