package runner

import (
	"context"
	"strings"
	"testing"
	"time"
)

// v1.REQ-006-AC-001: 校验从 Vite 启动日志中动态提取监听端口 URL
func TestPortParser_ExtractPreviewURL(t *testing.T) {
	cases := []struct {
		name     string
		logText  string
		expected string
	}{
		{
			name: "Standard Vite localhost",
			logText: `
  VITE v6.4.6  ready in 260 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
`,
			expected: "http://localhost:5173",
		},
		{
			name: "Standard Vite 127.0.0.1 with custom port",
			logText: `
  ➜  Local:   http://127.0.0.1:3000/
`,
			expected: "http://127.0.0.1:3000",
		},
		{
			name: "Vite with ANSI colors",
			logText: `
  [32m➜[39m  [1mLocal[22m:   [36mhttp://localhost:5174/[39m
`,
			expected: "http://localhost:5174",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			url := ExtractPreviewURL(tc.logText)
			if url != tc.expected {
				t.Fatalf("expected %q, got %q", tc.expected, url)
			}
		})
	}
}

type mockProcess struct {
	pid        int
	outputChan chan string
	killed     bool
}

type mockProcessLauncher struct {
	processes map[int64]*mockProcess
}

func newMockProcessLauncher() *mockProcessLauncher {
	return &mockProcessLauncher{
		processes: make(map[int64]*mockProcess),
	}
}

func (m *mockProcessLauncher) Launch(ctx context.Context, appPath string, onOutput func(string)) (int, error) {
	p := &mockProcess{
		pid:        12345,
		outputChan: make(chan string, 10),
	}
	m.processes[1] = p

	go func() {
		time.Sleep(10 * time.Millisecond)
		onOutput("  ➜  Local:   http://localhost:5173/\n")
	}()

	return p.pid, nil
}

func (m *mockProcessLauncher) Kill(pid int) error {
	for _, p := range m.processes {
		if p.pid == pid {
			p.killed = true
		}
	}
	return nil
}

type mockEventEmitter struct {
	events []struct {
		Name string
		Data interface{}
	}
}

func (e *mockEventEmitter) Emit(eventName string, optionalData ...interface{}) {
	var data interface{}
	if len(optionalData) > 0 {
		data = optionalData[0]
	}
	e.events = append(e.events, struct {
		Name string
		Data interface{}
	}{Name: eventName, Data: data})
}

// v1.REQ-006-AC-001: 校验 AppRunner 启动、捕获端口与优雅关停
func TestAppRunner_StartAndStop(t *testing.T) {
	launcher := newMockProcessLauncher()
	emitter := &mockEventEmitter{}
	runner := NewAppRunnerWithLauncher(launcher, emitter)

	// 启动应用开发服务器
	resp, err := runner.StartApp(context.Background(), 1, "/workspace/my-app")
	if err != nil {
		t.Fatalf("failed to start app: %v", err)
	}

	if resp.Status != "running" {
		t.Errorf("expected status 'running', got %s", resp.Status)
	}
	if resp.PreviewURL != "http://localhost:5173" {
		t.Errorf("expected previewUrl 'http://localhost:5173', got %s", resp.PreviewURL)
	}
	if resp.ProcessID != 12345 {
		t.Errorf("expected processId 12345, got %d", resp.ProcessID)
	}

	// 再次启动相同应用应返回现有活跃实例
	resp2, err := runner.StartApp(context.Background(), 1, "/workspace/my-app")
	if err != nil {
		t.Fatalf("unexpected error on second start: %v", err)
	}
	if resp2.PreviewURL != resp.PreviewURL {
		t.Errorf("expected same preview url on idempotency, got %s", resp2.PreviewURL)
	}

	// 关停应用开发服务器
	err = runner.StopApp(context.Background(), 1)
	if err != nil {
		t.Fatalf("failed to stop app: %v", err)
	}

	p := launcher.processes[1]
	if p == nil || !p.killed {
		t.Errorf("expected process to be killed upon StopApp")
	}

	// 关停后状态应被清除
	if runner.IsRunning(1) {
		t.Errorf("expected app 1 to be stopped")
	}
}

// v1.REQ-006-AC-002: 校验控制台错误日志转发 (preview:console)
func TestAppRunner_ConsoleErrorForwarding(t *testing.T) {
	launcher := newMockProcessLauncher()
	emitter := &mockEventEmitter{}
	runner := NewAppRunnerWithLauncher(launcher, emitter)

	_, err := runner.StartApp(context.Background(), 42, "/workspace/app42")
	if err != nil {
		t.Fatalf("failed to start app: %v", err)
	}

	// 触发子进程异常输出
	runner.HandleProcessOutput(42, "[vite] Internal server error: Failed to parse source\n")

	hasConsoleEvent := false
	for _, ev := range emitter.events {
		if ev.Name == "preview:console" {
			hasConsoleEvent = true
			if m, ok := ev.Data.(map[string]interface{}); ok {
				if m["level"] != "error" {
					t.Errorf("expected error level, got %v", m["level"])
				}
				if !strings.Contains(m["message"].(string), "Internal server error") {
					t.Errorf("message content mismatch: %v", m["message"])
				}
			}
		}
	}

	if !hasConsoleEvent {
		t.Errorf("expected preview:console event to be forwarded")
	}
}
