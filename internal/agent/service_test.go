package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/blueprint"
	"buildui/internal/db"
	"buildui/internal/llm"
)

func TestStreamChatUsesSavedModelAndWaitsForApproval(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	database, err := db.Open(ctx, filepath.Join(root, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	apps := db.NewAppRepository(database)
	chats := db.NewChatRepository(database)
	bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)
	appID, err := apps.Create(ctx, &db.AppEntity{Name: "Fitness Check-in", Path: root, NeedsAppBlueprint: true})
	if err != nil {
		t.Fatal(err)
	}
	chatID, err := chats.Create(ctx, &db.ChatEntity{AppID: appID})
	if err != nil {
		t.Fatal(err)
	}
	requests := make(chan llm.ChatRequest, 2)
	replies := []string{
		`{"appName":"Fitness Check-in","designDirection":"Daily check-in","primaryColor":"#334455","visuals":[]}`,
		`<dyad-write path="src/App.tsx">export default function App() { return null; }</dyad-write>`,
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		index := len(requests)
		var request llm.ChatRequest
		if r.URL.Path != "/chat/completions" || json.NewDecoder(r.Body).Decode(&request) != nil || index >= len(replies) {
			http.Error(w, "Unexpected request", http.StatusBadRequest)
			return
		}
		requests <- request
		w.Header().Set("Content-Type", "text/event-stream")
		delta, _ := json.Marshal(map[string]any{"choices": []any{map[string]any{"delta": map[string]string{"content": replies[index]}}}})
		fmt.Fprintf(w, "data: %s\n\ndata: [DONE]\n\n", delta)
	}))
	defer server.Close()
	service := NewChatService(chats, apps, bps, nil)
	settings := db.NewSettingsRepository(database)
	if err := settings.SetMany(ctx, map[string]string{
		"llm.base_url": server.URL, "llm.model": "fixture-model",
	}); err != nil {
		t.Fatal(err)
	}
	service.SetModelRepositories(settings, db.NewMessageRepository(database))
	req := StreamChatRequest{ChatID: chatID, Prompt: "Build daily fitness check-in"}
	if err := service.StreamChat(ctx, req); err != nil {
		t.Fatal(err)
	}
	if len(requests) != 1 {
		t.Fatal("未向保存的模型发送蓝图请求")
	}
	bp, err := bps.GetBlueprint(ctx, chatID)
	if err != nil || bp.Approved || bp.DesignDirection != "Daily check-in" {
		t.Fatalf("未保存待审批的模型蓝图：%+v, %v", bp, err)
	}
	sourcePath := filepath.Join(root, "src", "App.tsx")
	if _, err := os.Stat(sourcePath); !os.IsNotExist(err) {
		t.Fatalf("审批前工作区发生变化：%v", err)
	}
	if err := bps.ApproveBlueprint(ctx, chatID); err != nil {
		t.Fatal(err)
	}
	req.Prompt = "Implement the approved blueprint"
	if err := service.StreamChat(ctx, req); err != nil {
		t.Fatal(err)
	}
	first, second := <-requests, <-requests
	if first.Model != "fixture-model" || second.Model != first.Model || len(second.Messages) < 4 {
		t.Fatalf("未沿用保存的模型及首轮上下文：%+v, %+v", first, second)
	}
	if second.MaxTokens <= 0 {
		t.Fatal("代码生成请求应显式设置输出预算")
	}
	if data, err := os.ReadFile(sourcePath); err != nil || !strings.Contains(string(data), "return null") {
		t.Fatalf("未写入模型生成的文件：%s, %v", data, err)
	}
}

type mockEventEmitter struct {
	events []struct {
		Name string
		Data interface{}
	}
}

func TestInterruptedProviderClosesPendingFileTool(t *testing.T) {
	emitter := &mockEventEmitter{}
	service := NewChatService(nil, nil, nil, emitter)
	upstream := errors.New("The model reached its output limit.")
	err := service.processChunks(context.Background(), 1, t.TempDir(), func(feed func(string) error) error {
		if err := feed(`<dyad-write path="src/App.tsx">partial`); err != nil {
			return err
		}
		return upstream
	}, nil)
	if !errors.Is(err, upstream) {
		t.Fatalf("未返回提供商错误：%v", err)
	}
	if len(emitter.events) != 2 ||
		emitter.events[0].Name != "chat:tool-start" || emitter.events[1].Name != "chat:tool-end" {
		t.Fatalf("未关闭界面中进行中的文件操作：%+v", emitter.events)
	}
	end := emitter.events[1].Data.(map[string]interface{})
	if end["tool"] != "write_file" || end["success"] != false {
		t.Fatalf("未将中断标记为失败：%+v", end)
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

func TestStreamChat_ExplicitProviderAndModel(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	database, err := db.Open(ctx, filepath.Join(root, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()

	apps := db.NewAppRepository(database)
	chats := db.NewChatRepository(database)
	bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)
	appID, _ := apps.Create(ctx, &db.AppEntity{Name: "Multi Provider App", Path: root, NeedsAppBlueprint: false})
	chatID, _ := chats.Create(ctx, &db.ChatEntity{AppID: appID})

	validBlueprint, _ := json.Marshal(map[string]any{
		"appName":         "Multi Provider App",
		"designDirection": "Modern Clean",
		"primaryColor":    "#123456",
		"visuals":         []string{},
	})

	deepseekRequests := make(chan llm.ChatRequest, 1)
	deepseekServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req llm.ChatRequest
		_ = json.NewDecoder(r.Body).Decode(&req)
		deepseekRequests <- req
		w.Header().Set("Content-Type", "text/event-stream")
		delta, _ := json.Marshal(map[string]any{"choices": []any{map[string]any{"delta": map[string]string{"content": string(validBlueprint)}}}})
		fmt.Fprintf(w, "data: %s\n\ndata: [DONE]\n\n", delta)
	}))
	defer deepseekServer.Close()

	openaiRequests := make(chan llm.ChatRequest, 1)
	openaiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req llm.ChatRequest
		_ = json.NewDecoder(r.Body).Decode(&req)
		openaiRequests <- req
		w.Header().Set("Content-Type", "text/event-stream")
		delta, _ := json.Marshal(map[string]any{"choices": []any{map[string]any{"delta": map[string]string{"content": string(validBlueprint)}}}})
		fmt.Fprintf(w, "data: %s\n\ndata: [DONE]\n\n", delta)
	}))
	defer openaiServer.Close()

	service := NewChatService(chats, apps, bps, nil)
	settings := db.NewSettingsRepository(database)
	_ = settings.SetMany(ctx, map[string]string{
		"llm.active_provider":            "openai",
		"llm.providers.openai.base_url":  openaiServer.URL,
		"llm.providers.openai.api_key":   "sk-openai",
		"llm.providers.openai.model":     "gpt-4o",
		"llm.providers.deepseek.base_url": deepseekServer.URL,
		"llm.providers.deepseek.api_key":  "sk-deepseek",
		"llm.providers.deepseek.model":    "deepseek-chat",
	})
	service.SetModelRepositories(settings, db.NewMessageRepository(database))

	// 1. 显式指定 deepseek 与 deepseek-reasoner
	req1 := StreamChatRequest{
		ChatID:   chatID,
		Prompt:   "Hello from deepseek",
		Provider: "deepseek",
		Model:    "deepseek-reasoner",
	}
	if err := service.StreamChat(ctx, req1); err != nil {
		t.Fatalf("StreamChat deepseek failed: %v", err)
	}
	got1 := <-deepseekRequests
	if got1.Model != "deepseek-reasoner" {
		t.Errorf("expected model 'deepseek-reasoner', got %q", got1.Model)
	}

	// 2. 指定 auto，应自动降级至当前 active_provider (openai) 及其默认模型 gpt-4o
	req2 := StreamChatRequest{
		ChatID:   chatID,
		Prompt:   "Hello from auto",
		Provider: "auto",
	}
	if err := service.StreamChat(ctx, req2); err != nil {
		t.Fatalf("StreamChat auto failed: %v", err)
	}
	got2 := <-openaiRequests
	if got2.Model != "gpt-4o" {
		t.Errorf("expected model 'gpt-4o', got %q", got2.Model)
	}
}
