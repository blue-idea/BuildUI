package agent

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/blueprint"
	"buildui/internal/db"
)

type mockEventEmitter struct {
	events []struct {
		Name string
		Data interface{}
	}
}

func (m *mockEventEmitter) Emit(eventName string, optionalData ...interface{}) {
	var data interface{}
	if len(optionalData) > 0 {
		data = optionalData[0]
	}
	m.events = append(m.events, struct {
		Name string
		Data interface{}
	}{Name: eventName, Data: data})
}

// v1.REQ-002-AC-003 与 v1.REQ-003-AC-001: 门禁拦截与事件流
func TestChatService_BlueprintGateAndEventStream(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "chat_service_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")
	database, err := db.Open(context.Background(), dbPath)
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	chatRepo := db.NewChatRepository(database)
	bpRepo := db.NewBlueprintRepository(database)

	bpService := blueprint.NewBlueprintService(bpRepo, appRepo, database)

	// 创建测试应用与会话
	appID, err := appRepo.Create(context.Background(), &db.AppEntity{
		Name: "Demo App",
		Path: tempDir,
	})
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}
	chatID, err := chatRepo.Create(context.Background(), &db.ChatEntity{
		AppID: appID,
		Title: "Initial turn",
	})
	if err != nil {
		t.Fatalf("failed to create chat: %v", err)
	}

	emitter := &mockEventEmitter{}
	chatService := NewChatService(chatRepo, appRepo, bpService, emitter)

	// 场景 1: 未通过蓝图审批时，写盘被门禁拒绝并触发 chat:error
	mockStreamContent := `<dyad-write path="src/App.tsx" description="update App">
export default function App() { return <div>Approved!</div>; }
</dyad-write>`

	err = chatService.ProcessStream(context.Background(), chatID, tempDir, strings.NewReader(mockStreamContent))
	if err == nil {
		t.Fatalf("expected gate error because blueprint is not approved, got nil")
	}

	// 场景 2: 批准蓝图后，重新执行写盘成功，并验证事件流发射
	err = bpRepo.Upsert(context.Background(), &db.BlueprintEntity{
		ChatID:          chatID,
		AppName:         "Demo App",
		DesignDirection: "Clean",
		Approved:        true,
	})
	if err != nil {
		t.Fatalf("failed to approve blueprint: %v", err)
	}

	emitter.events = nil // 重置事件记录
	err = chatService.ProcessStream(context.Background(), chatID, tempDir, strings.NewReader(mockStreamContent))
	if err != nil {
		t.Fatalf("unexpected error after blueprint approved: %v", err)
	}

	// 验证事件流中包含 chat:tool-start, chat:tool-end, chat:end
	hasToolStart := false
	hasToolEnd := false
	hasChatEnd := false

	for _, ev := range emitter.events {
		switch ev.Name {
		case "chat:tool-start":
			hasToolStart = true
		case "chat:tool-end":
			hasToolEnd = true
		case "chat:end":
			hasChatEnd = true
		}
	}

	if !hasToolStart {
		t.Errorf("missing chat:tool-start event")
	}
	if !hasToolEnd {
		t.Errorf("missing chat:tool-end event")
	}
	if !hasChatEnd {
		t.Errorf("missing chat:end event")
	}

	// 验证目标文件已真正安全落盘
	targetFile := filepath.Join(tempDir, "src", "App.tsx")
	data, err := os.ReadFile(targetFile)
	if err != nil {
		t.Fatalf("target file was not created: %v", err)
	}
	if !strings.Contains(string(data), "Approved!") {
		t.Errorf("target file content mismatch: %s", string(data))
	}
}
