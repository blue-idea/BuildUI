package agent

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"

	"buildui/internal/blueprint"
	"buildui/internal/db"
	"buildui/internal/llm"
	"buildui/internal/plugins"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestHomePluginSelectionPersistsThroughBlueprintAndBuild(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	database, err := db.Open(ctx, filepath.Join(t.TempDir(), "automation.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	apps := db.NewAppRepository(database)
	appID, err := apps.Create(ctx, &db.AppEntity{Name: "Dashboard", Path: root, NeedsAppBlueprint: true})
	if err != nil {
		t.Fatal(err)
	}
	chatID, err := db.NewChatRepository(database).Create(ctx, &db.ChatEntity{AppID: appID})
	if err != nil {
		t.Fatal(err)
	}
	pluginStore, err := plugins.NewService(database, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	remote := mcp.NewServer(&mcp.Implementation{Name: "Fixture MCP", Version: "1"}, nil)
	for _, name := range []string{"lookup", "unapproved"} {
		remote.AddTool(&mcp.Tool{Name: name, InputSchema: map[string]string{"type": "object"}}, func(context.Context, *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return &mcp.CallToolResult{}, nil
		})
	}
	var selectedHTTP, unselectedHTTP atomic.Int32
	handler := mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server { return remote }, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true})
	mcpHTTP := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/selected" {
			selectedHTTP.Add(1)
		} else {
			unselectedHTTP.Add(1)
		}
		handler.ServeHTTP(w, r)
	}))
	defer mcpHTTP.Close()
	create := func(name, path string) int64 {
		t.Helper()
		item, err := pluginStore.Save(ctx, plugins.Input{Name: name, Transport: "http", Endpoint: mcpHTTP.URL + path, Enabled: true})
		if err != nil {
			t.Fatal(err)
		}
		if err := pluginStore.SetToolPermission(ctx, item.ID, "lookup", true); err != nil {
			t.Fatal(err)
		}
		return item.ID
	}
	selected := create("Reference Helper", "/selected")
	create("Unselected Helper", "/unselected")
	var seenBlueprint, seenPlan, seenBuild, seenOff atomic.Bool
	var off atomic.Bool
	model := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Messages []llm.ChatMessage                       `json:"messages"`
			Tools    []struct{ Function llm.ToolDefinition } `json:"tools"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.Messages) < 2 {
			http.Error(w, "Invalid model request", 400)
			return
		}
		system := req.Messages[0].Content
		if off.Load() {
			if len(req.Tools) != 0 || strings.Contains(system, "Use the selected plugins") {
				t.Error("automation off must omit plugin tools and instructions")
			}
			seenOff.Store(true)
			writeBuildReply(w, "No plugin needed.")
			return
		}
		if len(req.Tools) != 1 || !strings.Contains(system, "Use the selected plugins") || !strings.Contains(system, "Reference Helper") || strings.Contains(system, "Unselected Helper") {
			t.Errorf("expected selected plugin instructions and its single approved tool; got %d tools", len(req.Tools))
		} else if !strings.Contains(req.Tools[0].Function.Description, "lookup") || strings.Contains(req.Tools[0].Function.Description, "unapproved") {
			t.Error("the model received an unapproved tool")
		}
		switch {
		case strings.Contains(system, "Build planning protocol"):
			seenPlan.Store(true)
			writeBuildReply(w, `{"objective":"Build dashboard","steps":[{"title":"Create dashboard","goal":"Create a dashboard","files":["src/App.tsx"]}]}`)
		case !seenBlueprint.Load():
			seenBlueprint.Store(true)
			writeBuildReply(w, `{"appName":"Dashboard","designDirection":"Simple dashboard","primaryColor":"#334155","visuals":[]}`)
		default:
			seenBuild.Store(true)
			writeBuildReply(w, `<dyad-write path="src/App.tsx">export default function App() { return null; }</dyad-write>`)
		}
	}))
	defer model.Close()
	if err := db.NewSettingsRepository(database).SetMany(ctx, map[string]string{"llm.base_url": model.URL, "llm.model": "automation-test"}); err != nil {
		t.Fatal(err)
	}
	service := testBuildService(database)
	service.SetPlugins(pluginStore)
	if err := service.StreamChat(ctx, StreamChatRequest{ChatID: chatID, Mode: "build", Prompt: "Build a dashboard", PluginAutomation: &plugins.ProjectAutomation{Enabled: true, PluginIDs: []int64{selected}}}); err != nil {
		t.Fatal(err)
	}
	if err := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database).ApproveBlueprint(ctx, chatID); err != nil {
		t.Fatal(err)
	}
	// 模拟退出应用后重新打开，后续构建通过数据库恢复首页选择。
	service = testBuildService(database)
	service.SetPlugins(pluginStore)
	if err := service.StreamChat(ctx, StreamChatRequest{ChatID: chatID, Mode: "build", Prompt: "Build the approved project"}); err != nil {
		t.Fatal(err)
	}
	off.Store(true)
	requestsBeforeOff := selectedHTTP.Load()
	if err := service.StreamChat(ctx, StreamChatRequest{ChatID: chatID, Mode: "plan", Prompt: "Describe the dashboard", PluginAutomation: &plugins.ProjectAutomation{Enabled: false, PluginIDs: []int64{selected}}}); err != nil {
		t.Fatal(err)
	}
	if !seenBlueprint.Load() || !seenPlan.Load() || !seenBuild.Load() || !seenOff.Load() || requestsBeforeOff == 0 || selectedHTTP.Load() != requestsBeforeOff || unselectedHTTP.Load() != 0 {
		t.Fatal("not all stages, saved preferences, or discovery restrictions were verified")
	}
}
