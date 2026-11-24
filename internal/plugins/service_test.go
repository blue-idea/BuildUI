package plugins

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"slices"
	"testing"

	"buildui/internal/db"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestHeaderLifecycleAndPluginPersistence(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	database, err := db.Open(ctx, filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	service, err := NewService(database, dir)
	if err != nil {
		t.Fatal(err)
	}

	var captured []string
	mcpServer := mcp.NewServer(&mcp.Implementation{Name: "Test MCP", Version: "1.0"}, nil)
	mcpServer.AddTool(&mcp.Tool{Name: "lookup", InputSchema: map[string]any{"type": "object"}}, func(ctx context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		return &mcp.CallToolResult{Content: []mcp.Content{&mcp.TextContent{Text: "found"}}}, nil
	})
	handler := mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server { return mcpServer }, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			var request struct{ Method string }
			body, _ := io.ReadAll(r.Body)
			_ = json.Unmarshal(body, &request)
			r.Body = io.NopCloser(bytes.NewReader(body))
			if request.Method == "tools/list" {
				captured = append(captured, r.Header.Get("X-Test-Key"))
			}
		}
		handler.ServeHTTP(w, r)
	}))
	defer server.Close()

	p, err := service.Save(ctx, Input{Name: "Local MCP", Transport: "http", Endpoint: server.URL, Enabled: true})
	if err != nil {
		t.Fatal(err)
	}
	set := func(old, key, value string) {
		t.Helper()
		updated, err := service.SaveCredential(ctx, CredentialEdit{PluginID: p.ID, OldKey: old, Key: key, Value: value})
		if err != nil {
			t.Fatal(err)
		}
		p = updated
	}
	probe := func() {
		t.Helper()
		tools, err := service.Tools(ctx, p.ID)
		if err != nil || len(tools) != 1 || tools[0].Name != "lookup" {
			t.Fatalf("tools = %v, err = %v", tools, err)
		}
	}
	set("", "X-Test-Key", "first-value")
	if raw, _ := json.Marshal(p); bytes.Contains(raw, []byte("first-value")) || !slices.Contains(p.Headers, "X-Test-Key") {
		t.Fatal("unexpected public credentials")
	}
	var raw string
	if err := database.SQLDB().QueryRow("SELECT credentials FROM mcp_plugins").Scan(&raw); err != nil || raw == "" || raw == "first-value" {
		t.Fatalf("credential storage unavailable: %v", err)
	}
	probe()
	if _, err := service.Call(ctx, 1, p.ID, "lookup", json.RawMessage("{}")); err == nil {
		t.Fatal("an unapproved tool was called")
	}
	if err := service.SetToolPermission(ctx, p.ID, "lookup", true); err != nil {
		t.Fatal(err)
	}
	if out, err := service.Call(ctx, 1, p.ID, "lookup", json.RawMessage("{}")); err != nil || !bytes.Contains([]byte(out), []byte("found")) {
		t.Fatalf("approved tool call failed: %v", err)
	}
	service, err = NewService(database, dir)
	if err != nil {
		t.Fatal(err)
	}
	set("x-test-key", "X-Test-Key", "second-value")
	probe()
	set("X-Test-Key", "", "")
	probe()
	if !slices.Equal(captured, []string{"first-value", "second-value", ""}) {
		t.Fatalf("request headers = %v", captured)
	}
	if err := service.Delete(ctx, p.ID); err != nil {
		t.Fatal(err)
	}
	if list, err := service.List(ctx); err != nil || len(list) != 0 {
		t.Fatalf("plugins = %v, err = %v", list, err)
	}
	if allowed, err := service.allowedNames(ctx, p.ID); err != nil || len(allowed) != 0 {
		t.Fatalf("permissions did not cascade: %v %v", allowed, err)
	}
}

func TestContext7Live(t *testing.T) {
	key := os.Getenv("CONTEXT7_API_KEY")
	if key == "" {
		t.Skip("CONTEXT7_API_KEY is unset")
	}
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	s, err := NewService(database, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	p, err := s.Save(ctx, Input{Name: "Context7", Transport: "http", Endpoint: "https://mcp.context7.com/mcp", Enabled: true})
	if err != nil {
		t.Fatal(err)
	}
	if _, err = s.SaveCredential(ctx, CredentialEdit{PluginID: p.ID, Key: "Authorization", Value: "Bearer " + key}); err != nil {
		t.Fatal(err)
	}
	tools, err := s.Tools(ctx, p.ID)
	if err != nil {
		t.Fatal(err)
	}
	const name = "resolve-library-id"
	if !slices.ContainsFunc(tools, func(tool Tool) bool { return tool.Name == name }) {
		t.Fatalf("Context7 did not expose %s", name)
	}
	if err = s.SetToolPermission(ctx, p.ID, name, true); err != nil {
		t.Fatal(err)
	}
	output, err := s.Call(ctx, 1, p.ID, name, json.RawMessage(`{"libraryName":"Model Context Protocol Go SDK","query":"StreamableClientTransport and ListTools"}`))
	if err != nil {
		t.Fatal(err)
	}
	var result struct {
		IsError bool `json:"isError"`
		Content []json.RawMessage
	}
	if err := json.Unmarshal([]byte(output), &result); err != nil || result.IsError || len(result.Content) == 0 {
		t.Fatal("Context7 returned no usable library lookup result")
	}
	t.Logf("Context7 returned %d tools and %d lookup content items", len(tools), len(result.Content))
}
