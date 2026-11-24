package plugins

import (
	"context"
	"encoding/json"
	"slices"
	"sync"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// Turn 持有一个项目对话轮中需要状态的本地 MCP 进程。
type Turn struct {
	service  *Service
	appID    int64
	dir      string
	ctx      context.Context
	cancel   context.CancelFunc
	mu       sync.Mutex
	sessions map[int64]turnSession
}

type turnSession struct {
	endpoint    string
	args        []string
	credentials string
	client      *mcp.ClientSession
}

func (s *Service) StartTurn(ctx context.Context, appID int64, directory string) *Turn {
	ctx, cancel := context.WithCancel(ctx)
	return &Turn{service: s, appID: appID, dir: directory, ctx: ctx, cancel: cancel, sessions: make(map[int64]turnSession)}
}

func (t *Turn) Close() {
	t.mu.Lock()
	defer t.mu.Unlock()
	for _, entry := range t.sessions {
		_ = entry.client.Close()
	}
	clear(t.sessions)
	t.cancel()
}

func (t *Turn) Call(ctx context.Context, id int64, name string, args json.RawMessage) (string, error) {
	return t.service.call(ctx, t.appID, id, name, args, t.open)
}

func (t *Turn) open(ctx context.Context, plugin Plugin, stored string) (*mcp.ClientSession, func(), error) {
	if err := t.ctx.Err(); err != nil {
		return nil, nil, err
	}
	if plugin.Transport != "stdio" {
		return t.service.transientSession(t.dir)(ctx, plugin, stored)
	}
	t.mu.Lock()
	defer t.mu.Unlock()
	if err := t.ctx.Err(); err != nil {
		return nil, nil, err
	}
	if !plugin.Enabled {
		return t.service.transientSession(t.dir)(ctx, plugin, stored)
	}
	if entry, ok := t.sessions[plugin.ID]; ok {
		if entry.endpoint == plugin.Endpoint && slices.Equal(entry.args, plugin.Args) && entry.credentials == stored {
			return entry.client, func() {}, nil
		}
		_ = entry.client.Close()
		delete(t.sessions, plugin.ID)
	}
	// 工具发现的截止时间只约束握手。已启动的浏览器进程由对话生命周期持有。
	client, err := t.service.connect(ctx, t.ctx, plugin, stored, t.dir, nil)
	if err != nil {
		return nil, nil, err
	}
	t.sessions[plugin.ID] = turnSession{endpoint: plugin.Endpoint, args: plugin.Args, credentials: stored, client: client}
	return client, func() {}, nil
}
