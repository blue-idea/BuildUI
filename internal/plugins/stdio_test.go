package plugins

import (
	"context"
	"os"
	"testing"

	"buildui/internal/db"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

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
	server.AddTool(&mcp.Tool{Name: "stdio_tool", InputSchema: map[string]any{"type": "object"}}, func(context.Context, *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		return &mcp.CallToolResult{}, nil
	})
	if err := server.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
		os.Exit(1)
	}
	os.Exit(0)
}
