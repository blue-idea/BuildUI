package plugins

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"buildui/internal/config"
	"github.com/modelcontextprotocol/go-sdk/auth"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type Tool struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Schema      json.RawMessage `json:"schema"`
	Allowed     bool            `json:"allowed"`
}

type Capability struct {
	PluginID int64
	Tool
}

type headerTransport struct{ values map[string]string }

func (h headerTransport) RoundTrip(r *http.Request) (*http.Response, error) {
	req := r.Clone(r.Context())
	for key, value := range h.values {
		if key == "Authorization" && req.Header.Get(key) != "" {
			continue
		}
		req.Header.Set(key, value)
	}
	return http.DefaultTransport.RoundTrip(req)
}

type sessionOpener func(context.Context, Plugin, string) (*mcp.ClientSession, func(), error)

func (s *Service) connectWithOAuth(ctx context.Context, p Plugin, stored string, handler auth.OAuthHandler) (*mcp.ClientSession, error) {
	return s.connect(ctx, ctx, p, stored, "", handler)
}

func (s *Service) connect(ctx, processCtx context.Context, p Plugin, stored, directory string, handler auth.OAuthHandler) (*mcp.ClientSession, error) {
	if !p.Enabled {
		return nil, errors.New("Enable the plugin before connecting.")
	}
	values, err := s.decrypt(p.ID, stored)
	if err != nil {
		return nil, err
	}
	var transport mcp.Transport
	if p.Transport == "stdio" {
		command := stdioCommand(processCtx, p.Endpoint, p.Args)
		command.Dir = directory
		command.Env = os.Environ()
		for name, value := range values {
			command.Env = append(command.Env, name+"="+value)
		}
		transport = &mcp.CommandTransport{Command: command}
	} else {
		if handler == nil && p.OAuthConnected {
			handler, err = s.savedOAuth(ctx, p.ID)
			if err != nil {
				return nil, err
			}
		}
		client := &http.Client{
			Transport: headerTransport{values},
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 5 || !strings.EqualFold(req.URL.Host, via[0].URL.Host) || req.URL.Scheme != via[0].URL.Scheme {
					return http.ErrUseLastResponse
				}
				return nil
			},
		}
		transport = &mcp.StreamableClientTransport{Endpoint: p.Endpoint, HTTPClient: client, DisableStandaloneSSE: true, OAuthHandler: handler}
	}
	session, err := mcp.NewClient(&mcp.Implementation{Name: "BuildUI", Version: "1.0.0"}, nil).Connect(ctx, transport, nil)
	if err != nil {
		return nil, publicConnectionError(err)
	}
	return session, nil
}

func (s *Service) transientSession(directory string) sessionOpener {
	return func(ctx context.Context, p Plugin, stored string) (*mcp.ClientSession, func(), error) {
		session, err := s.connect(ctx, ctx, p, stored, directory, nil)
		if err != nil {
			return nil, nil, err
		}
		return session, func() { _ = session.Close() }, nil
	}
}

func publicConnectionError(err error) error {
	// 远端错误或命令参数可能包含凭据，不将原文传播到界面或模型。
	message := strings.ToLower(err.Error())
	if strings.Contains(message, "401") || strings.Contains(message, "403") || strings.Contains(message, "unauthorized") || strings.Contains(message, "forbidden") {
		return errors.New("MCP authentication failed. Check the plugin credentials.")
	}
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
		return err
	}
	return errors.New("Could not connect to the MCP server. Check its URL or command and credentials.")
}

func (s *Service) get(ctx context.Context, id int64) (Plugin, string, error) {
	return scanPlugin(s.db.QueryRowContext(ctx, "SELECT "+pluginColumns+" FROM mcp_plugins WHERE id = ?", id))
}

func (s *Service) Tools(ctx context.Context, id int64) ([]Tool, error) {
	return s.ToolsInProject(ctx, id, "")
}

func (s *Service) ToolsInProject(ctx context.Context, id int64, directory string) ([]Tool, error) {
	return s.listTools(ctx, id, s.transientSession(directory))
}

func (s *Service) listTools(ctx context.Context, id int64, open sessionOpener) ([]Tool, error) {
	p, stored, err := s.get(ctx, id)
	if err != nil {
		return nil, err
	}
	timeout := config.MCPRequestTimeout
	if p.Transport == "stdio" {
		timeout = config.MCPStdioDiscoveryTimeout
	}
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	allowed, err := s.allowedNames(ctx, id)
	if err != nil {
		return nil, err
	}
	session, release, err := open(ctx, p, stored)
	if err != nil {
		return nil, err
	}
	defer release()
	var tools []Tool
	for item, err := range session.Tools(ctx, nil) {
		if err != nil {
			return nil, publicConnectionError(err)
		}
		schema, err := json.Marshal(item.InputSchema)
		if err != nil {
			continue
		}
		tools = append(tools, Tool{Name: item.Name, Description: item.Description, Schema: schema, Allowed: allowed[item.Name]})
		if len(tools) >= config.MCPDiscoveryLimit {
			break
		}
	}
	return tools, nil
}

func (s *Service) allowedNames(ctx context.Context, id int64) (map[string]bool, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT tool_name FROM mcp_tool_permissions WHERE plugin_id=?", id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	names := map[string]bool{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		names[name] = true
	}
	return names, rows.Err()
}

func (s *Service) SetToolPermission(ctx context.Context, id int64, name string, allow bool) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("Tool name is required.")
	}
	query := "DELETE FROM mcp_tool_permissions WHERE plugin_id=? AND tool_name=?"
	if allow {
		query = "INSERT OR IGNORE INTO mcp_tool_permissions(plugin_id,tool_name) VALUES(?,?)"
	}
	_, err := s.db.ExecContext(ctx, query, id, name)
	return err
}

func (t *Turn) Capabilities(ctx context.Context) []Capability {
	ctx, cancel := context.WithTimeout(ctx, config.MCPRequestTimeout)
	defer cancel()
	rows, err := t.service.db.QueryContext(ctx, `SELECT id FROM mcp_plugins WHERE enabled AND (app_id IS NULL OR app_id=?)
		AND EXISTS (SELECT 1 FROM mcp_tool_permissions WHERE plugin_id=mcp_plugins.id) ORDER BY id`, t.appID)
	if err != nil {
		return nil
	}
	var ids []int64
	for rows.Next() {
		var id int64
		if rows.Scan(&id) == nil {
			ids = append(ids, id)
		}
	}
	_ = rows.Close()
	var result []Capability
	for _, id := range ids {
		tools, _ := t.service.listTools(ctx, id, t.open)
		for _, tool := range tools {
			if tool.Allowed {
				result = append(result, Capability{PluginID: id, Tool: tool})
			}
		}
	}
	return result
}

func (s *Service) Call(ctx context.Context, appID, id int64, name string, args json.RawMessage) (string, error) {
	return s.call(ctx, appID, id, name, args, s.transientSession(""))
}

func (s *Service) call(ctx context.Context, appID, id int64, name string, args json.RawMessage, open sessionOpener) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, config.MCPToolCallTimeout)
	defer cancel()
	// 在同一查询中校验配置与授权，防止使用已经被替换的连接配置。
	query := "SELECT " + pluginColumns + " FROM mcp_plugins WHERE id=? AND enabled AND (app_id IS NULL OR app_id=?) AND EXISTS (SELECT 1 FROM mcp_tool_permissions WHERE plugin_id=mcp_plugins.id AND tool_name=?)"
	p, stored, err := scanPlugin(s.db.QueryRowContext(ctx, query, id, appID, name))
	if err != nil {
		return "", errors.New("This plugin tool is no longer allowed.")
	}
	if !json.Valid(args) {
		return "", errors.New("Invalid MCP tool arguments.")
	}
	session, release, err := open(ctx, p, stored)
	if err != nil {
		return "", err
	}
	defer release()
	result, err := session.CallTool(ctx, &mcp.CallToolParams{Name: name, Arguments: args})
	if err != nil {
		return "", errors.New("The MCP tool call failed.")
	}
	data, err := json.Marshal(result)
	if err != nil {
		return "", err
	}
	if len(data) > config.MCPToolResultLimit {
		return "", fmt.Errorf("MCP tool output exceeded %d bytes.", config.MCPToolResultLimit)
	}
	return string(data), nil
}
