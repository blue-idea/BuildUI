package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"sync/atomic"
	"testing"

	"buildui/internal/blueprint"
	"buildui/internal/db"
	"buildui/internal/llm"
)

// v12.REQ-004-AC-001 到 AC-003 验证分步生成、中断恢复和单轮历史。
func TestStagedSaaSBuildResumesAfterAServiceRestart(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	dbPath := filepath.Join(t.TempDir(), "build.db")
	database, err := db.Open(ctx, dbPath)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = database.Close() }()

	apps := db.NewAppRepository(database)
	chats := db.NewChatRepository(database)
	bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)
	appID, err := apps.Create(ctx, &db.AppEntity{Name: "Subscription SaaS", Path: root, NeedsAppBlueprint: true})
	if err != nil {
		t.Fatal(err)
	}
	chatID, err := chats.Create(ctx, &db.ChatEntity{AppID: appID, Title: "Subscription SaaS"})
	if err != nil {
		t.Fatal(err)
	}
	if err := bps.SaveBlueprint(ctx, blueprint.BlueprintDTO{ChatID: chatID, AppName: "Subscription SaaS", DesignDirection: "Subscription landing page", PrimaryColor: "#4f46e5"}); err != nil {
		t.Fatal(err)
	}
	if err := bps.ApproveBlueprint(ctx, chatID); err != nil {
		t.Fatal(err)
	}

	calls := make(chan string, 10)
	var pricingAttempts atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var request llm.ChatRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil || len(request.Messages) < 2 {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		last := request.Messages[len(request.Messages)-1].Content
		var reply string
		switch {
		case strings.Contains(request.Messages[0].Content, "Build planning protocol"):
			calls <- "plan"
			reply = `{"objective":"Build the SaaS landing page","steps":[{"title":"Landing page","goal":"Build the page shell","files":["src/App.tsx"]},{"title":"Pricing","goal":"Add pricing cards","files":["src/Pricing.tsx"],"read":["src/App.tsx"]},{"title":"Free trial","goal":"Add trial signup and wire the page","files":["src/Trial.tsx","src/App.tsx"],"read":["src/Pricing.tsx"]}]}`
		case strings.Contains(last, "Current build step 1/3"):
			calls <- "shell"
			reply = `<dyad-write path="src/App.tsx">export default function App() { return "SaaS shell"; }</dyad-write>`
		case strings.Contains(last, "Current build step 2/3"):
			calls <- "pricing"
			if pricingAttempts.Add(1) == 1 {
				http.Error(w, "Model unavailable", http.StatusServiceUnavailable)
				return
			}
			if !strings.Contains(last, "SaaS shell") {
				http.Error(w, "Missing completed stage source", http.StatusBadRequest)
				return
			}
			reply = `<dyad-write path="src/Pricing.tsx">export const price = 19;</dyad-write>`
		case strings.Contains(last, "Current build step 3/3"):
			calls <- "trial"
			reply = `<dyad-write path="src/Trial.tsx">export const trial = "Start free trial";</dyad-write><dyad-write path="src/App.tsx">import { price } from "./Pricing"; import { trial } from "./Trial"; export default function App() { return trial + price; }</dyad-write>`
		default:
			calls <- "unexpected"
			http.Error(w, "Expected a build plan or a single build step", http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "text/event-stream")
		delta, _ := json.Marshal(map[string]any{"choices": []any{map[string]any{"delta": map[string]string{"content": reply}}}})
		fmt.Fprintf(w, "data: %s\n\ndata: [DONE]\n\n", delta)
	}))
	defer server.Close()
	settings := db.NewSettingsRepository(database)
	if err := settings.SetMany(ctx, map[string]string{"llm.base_url": server.URL, "llm.model": "saas-test"}); err != nil {
		t.Fatal(err)
	}
	service := testBuildService(database)
	req := StreamChatRequest{ChatID: chatID, Mode: "build", Prompt: "Build a SaaS website with subscription pricing and a free trial button."}
	if err := service.StreamChat(ctx, req); err == nil || !strings.Contains(err.Error(), "Model unavailable") {
		t.Fatalf("应在完成首页后遇到可恢复的模型错误：%v", err)
	}
	if data, err := os.ReadFile(filepath.Join(root, "src", "App.tsx")); err != nil || !strings.Contains(string(data), "SaaS shell") {
		t.Fatalf("第一阶段没有完整落盘：%s, %v", data, err)
	}
	if history, err := db.NewMessageRepository(database).ListByChatID(ctx, chatID); err != nil || len(history) != 0 {
		t.Fatalf("中断不能登记一轮成功的构建：%+v, %v", history, err)
	}
	if progress, err := service.GetBuildProgress(ctx, chatID); err != nil || progress == nil || progress.Completed != 1 || progress.Total != 3 {
		t.Fatalf("已完成步骤数没有正确持久化：%+v, %v", progress, err)
	}
	if err := database.Close(); err != nil {
		t.Fatal(err)
	}
	database, err = db.Open(ctx, dbPath)
	if err != nil {
		t.Fatal(err)
	}
	service = testBuildService(database)
	if err := service.StreamChat(ctx, StreamChatRequest{ChatID: chatID, Mode: "build", Resume: true}); err != nil {
		t.Fatal(err)
	}

	var invoked []string
	for len(calls) != 0 {
		invoked = append(invoked, <-calls)
	}
	if expected := []string{"plan", "shell", "pricing", "pricing", "trial"}; !reflect.DeepEqual(invoked, expected) {
		t.Fatalf("恢复时应跳过计划和已完成的阶段：%v", invoked)
	}
	if data, err := os.ReadFile(filepath.Join(root, "src", "App.tsx")); err != nil || !strings.Contains(string(data), "return trial + price") {
		t.Fatalf("恢复后未完成站点：%s, %v", data, err)
	}
	if history, err := db.NewMessageRepository(database).ListByChatID(ctx, chatID); err != nil || len(history) != 2 || history[0].Content != req.Prompt {
		t.Fatalf("恢复后的完整构建应只记录一轮历史：%+v, %v", history, err)
	}
	if progress, err := service.GetBuildProgress(ctx, chatID); err != nil || progress != nil {
		t.Fatalf("构建完成后应清除检查点：%+v, %v", progress, err)
	}
}

func testBuildService(database *db.DB) *ChatService {
	apps := db.NewAppRepository(database)
	chats := db.NewChatRepository(database)
	bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)
	service := NewChatService(chats, apps, bps, nil)
	service.SetModelRepositories(db.NewSettingsRepository(database), db.NewMessageRepository(database))
	return service
}
