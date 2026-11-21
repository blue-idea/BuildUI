package agent_test

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"buildui/internal/agent"
	"buildui/internal/blueprint"
	"buildui/internal/db"
)

type mockMultiTurnEmitter struct {
	mu     sync.Mutex
	events []string
}

func (m *mockMultiTurnEmitter) Emit(eventName string, optionalData ...interface{}) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events = append(m.events, eventName)
}

func (m *mockMultiTurnEmitter) HasEvent(eventName string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, ev := range m.events {
		if ev == eventName {
			return true
		}
	}
	return false
}

func TestPromptAssembler_WorkspaceTreeAndHistory(t *testing.T) {
	tempDir := t.TempDir()

	// 创建测试目录结构
	_ = os.MkdirAll(filepath.Join(tempDir, "src", "components"), 0755)
	_ = os.MkdirAll(filepath.Join(tempDir, "node_modules", "react"), 0755)
	_ = os.MkdirAll(filepath.Join(tempDir, ".git"), 0755)
	_ = os.MkdirAll(filepath.Join(tempDir, "dist"), 0755)

	_ = os.WriteFile(filepath.Join(tempDir, "package.json"), []byte("{}"), 0644)
	_ = os.WriteFile(filepath.Join(tempDir, "src", "App.tsx"), []byte("export const App = () => null;"), 0644)
	_ = os.WriteFile(filepath.Join(tempDir, "src", "components", "Header.tsx"), []byte("export const Header = () => null;"), 0644)
	_ = os.WriteFile(filepath.Join(tempDir, "node_modules", "react", "index.js"), []byte(""), 0644)
	_ = os.WriteFile(filepath.Join(tempDir, "dist", "index.html"), []byte(""), 0644)

	// 1. 验证工作区目录树扫描
	tree, err := agent.ScanWorkspaceTree(tempDir)
	if err != nil {
		t.Fatalf("ScanWorkspaceTree failed: %v", err)
	}

	if !strings.Contains(tree, "src/App.tsx") || !strings.Contains(tree, "package.json") || !strings.Contains(tree, "src/components/Header.tsx") {
		t.Fatalf("tree missing source files, got:\n%s", tree)
	}
	if strings.Contains(tree, "node_modules") || strings.Contains(tree, ".git") || strings.Contains(tree, "dist") {
		t.Fatalf("tree should ignore node_modules, .git and dist, got:\n%s", tree)
	}

	// 2. 验证多轮 Prompt 组装包含文件树与历史记录
	assembler := agent.NewPromptAssembler()
	ctx := agent.PromptContext{
		AppName:         "Analytics App",
		DesignDirection: "Dark Cyberpunk",
		PrimaryColor:    "#00ffcc",
		WorkspaceTree:   tree,
		HistoryMessages: []agent.HistoryMessage{
			{Role: "user", Content: "Initial prompt"},
			{Role: "assistant", Content: "Created initial App.tsx"},
			{Role: "user", Content: "Change background to dark navy"},
		},
	}

	prompt := assembler.AssembleContextPrompt(ctx)
	if !strings.Contains(prompt, "<workspace_tree>") || !strings.Contains(prompt, "src/App.tsx") {
		t.Fatalf("prompt missing workspace_tree, got:\n%s", prompt)
	}
	if !strings.Contains(prompt, "<conversation_history>") || !strings.Contains(prompt, "Change background to dark navy") {
		t.Fatalf("prompt missing conversation_history, got:\n%s", prompt)
	}
}

func TestChatService_CancelChat(t *testing.T) {
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "test.db")
	database, err := db.Open(context.Background(), dbPath)
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	defer database.Close()

	chatRepo := db.NewChatRepository(database)
	appRepo := db.NewAppRepository(database)
	bpRepo := db.NewBlueprintRepository(database)
	emitter := &mockMultiTurnEmitter{}

	bpService := blueprint.NewBlueprintService(bpRepo, appRepo, database)
	chatService := agent.NewChatService(chatRepo, appRepo, bpService, emitter)

	pr, pw := io.Pipe()
	defer pr.Close()
	defer pw.Close()

	errChan := make(chan error, 1)
	go func() {
		// 启动长流
		errChan <- chatService.ProcessStream(context.Background(), 1, tempDir, pr)
	}()

	// 写入初始数据
	_, _ = pw.Write([]byte("Thinking about your request... "))

	// 延时后主动取消该会话
	time.Sleep(30 * time.Millisecond)
	err = chatService.CancelChat(1)
	if err != nil {
		t.Fatalf("CancelChat failed: %v", err)
	}

	select {
	case err := <-errChan:
		if err == nil {
			t.Fatal("expected error after CancelChat, got nil")
		}
	case <-time.After(1 * time.Second):
		t.Fatal("timeout waiting for ProcessStream to exit after cancellation")
	}

	// 验证触发了 chat:cancelled 事件
	if !emitter.HasEvent("chat:cancelled") {
		t.Fatalf("expected chat:cancelled event to be emitted")
	}
}
