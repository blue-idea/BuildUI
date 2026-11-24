package plugins

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/db"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestPluginTurnReusesStdioInProjectDirectory(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	service, err := NewService(database, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	command, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	plugin, err := service.Save(ctx, Input{Name: "Stateful fixture", Transport: "stdio", Endpoint: command, Args: []string{"-test.run=^TestStdioFixtureProcess$"}, Enabled: true})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := service.SaveCredential(ctx, CredentialEdit{PluginID: plugin.ID, Key: "BUILDUI_MCP_STDIO_FIXTURE", Value: "enabled"}); err != nil {
		t.Fatal(err)
	}
	if err := service.SetToolPermission(ctx, plugin.ID, "stdio_tool", true); err != nil {
		t.Fatal(err)
	}
	project := t.TempDir()
	if err := os.WriteFile(filepath.Join(project, "mcp-fixture-marker"), nil, 0600); err != nil {
		t.Fatal(err)
	}
	turn := service.StartTurn(ctx, 1, project)
	defer turn.Close()
	if tools := turn.Capabilities(ctx); len(tools) != 1 || tools[0].Name != "stdio_tool" {
		t.Fatalf("tools=%v", tools)
	}
	call := func(count int) {
		t.Helper()
		out, err := turn.Call(ctx, plugin.ID, "stdio_tool", json.RawMessage(`{}`))
		if err != nil || !strings.Contains(out, fmt.Sprintf("project=true count=%d", count)) {
			t.Fatalf("call %d: %s (%v)", count, out, err)
		}
	}
	call(1)
	call(2)
	if _, err := service.SaveCredential(ctx, CredentialEdit{PluginID: plugin.ID, Key: "BUILDUI_MCP_FIXTURE_REV", Value: "2"}); err != nil {
		t.Fatal(err)
	}
	call(1)
	if err := service.SetToolPermission(ctx, plugin.ID, "stdio_tool", false); err != nil {
		t.Fatal(err)
	}
	if _, err := turn.Call(ctx, plugin.ID, "stdio_tool", json.RawMessage(`{}`)); err == nil {
		t.Fatal("revoked tool still available")
	}
}

func TestStdioPluginUsesSavedEnvironment(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	service, err := NewService(database, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	command, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	p, err := service.Save(ctx, Input{Name: "Stdio fixture", Transport: "stdio", Endpoint: command, Args: []string{"-test.run=^TestStdioFixtureProcess$"}, Enabled: true})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := service.SaveCredential(ctx, CredentialEdit{PluginID: p.ID, Key: "BUILDUI_MCP_STDIO_FIXTURE", Value: "enabled"}); err != nil {
		t.Fatal(err)
	}
	tools, err := service.Tools(ctx, p.ID)
	if err != nil || len(tools) != 1 || tools[0].Name != "stdio_tool" {
		t.Fatalf("stdio tools = %v, err = %v", tools, err)
	}
}

func TestStdioFixtureProcess(t *testing.T) {
	if os.Getenv("BUILDUI_MCP_STDIO_FIXTURE") != "enabled" {
		return
	}
	server := mcp.NewServer(&mcp.Implementation{Name: "Stdio fixture", Version: "1"}, nil)
	calls := 0
	server.AddTool(&mcp.Tool{Name: "stdio_tool", InputSchema: map[string]any{"type": "object"}}, func(context.Context, *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		calls++
		_, err := os.Stat("mcp-fixture-marker")
		return &mcp.CallToolResult{Content: []mcp.Content{&mcp.TextContent{Text: fmt.Sprintf("project=%t count=%d", err == nil, calls)}}}, nil
	})
	if err := server.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
		os.Exit(1)
	}
	os.Exit(0)
}
