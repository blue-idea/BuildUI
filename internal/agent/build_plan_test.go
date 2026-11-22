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
	"buildui/internal/verification/tsc"
)

// v12.REQ-004-AC-001、v2.REQ-002-AC-001：规划失败后重新定位并编辑首页引用的组件。
func TestPlannedHomepageEditRetriesInvalidPlan(t *testing.T) {
	const (
		header = "src/components/SiteHeader.tsx"
		index  = "src/pages/Index.tsx"
		app    = "src/App.tsx"
		extra  = "src/pages/Dashboard.tsx"
		prompt = "删除首页订阅按钮"
		before = `export function SiteHeader() { return <header><a href="/login">登录</a><button>订阅</button></header>; }`
		after  = `export function SiteHeader() { return <header><a href="/login">登录</a></header>; }`
		page   = `import { SiteHeader } from "@/components/SiteHeader"; export default function Index() { return <SiteHeader />; }`
	)
	for _, retrySucceeds := range []bool{true, false} {
		t.Run(fmt.Sprintf("retry_succeeds=%t", retrySucceeds), func(t *testing.T) {
			ctx := context.Background()
			root := t.TempDir()
			sources := map[string]string{
				header: before,
				index:  page,
				app:    `import Dashboard from "./pages/Dashboard"; export default Dashboard;`,
				extra:  "// " + strings.Repeat("x", 65_150),
			}
			for name, source := range sources {
				path := filepath.Join(root, name)
				if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(path, []byte(source), 0644); err != nil {
					t.Fatal(err)
				}
			}
			database, err := db.Open(ctx, filepath.Join(t.TempDir(), "build.db"))
			if err != nil {
				t.Fatal(err)
			}
			defer database.Close()
			apps := db.NewAppRepository(database)
			appID, err := apps.Create(ctx, &db.AppEntity{Name: "Blog", Path: root, NeedsAppBlueprint: true})
			if err != nil {
				t.Fatal(err)
			}
			chatID, err := db.NewChatRepository(database).Create(ctx, &db.ChatEntity{AppID: appID, Title: "Blog"})
			if err != nil {
				t.Fatal(err)
			}
			bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)
			if err := bps.SaveBlueprint(ctx, blueprint.BlueprintDTO{ChatID: chatID, AppName: "Blog", DesignDirection: "Editorial blog", PrimaryColor: "#264653"}); err != nil {
				t.Fatal(err)
			}
			if err := bps.ApproveBlueprint(ctx, chatID); err != nil {
				t.Fatal(err)
			}

			var plans, steps atomic.Int32
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				var request llm.ChatRequest
				if json.NewDecoder(r.Body).Decode(&request) != nil || len(request.Messages) < 2 {
					http.Error(w, "Invalid request", http.StatusBadRequest)
					return
				}
				system, user := request.Messages[0].Content, request.Messages[len(request.Messages)-1].Content
				var reply string
				if strings.Contains(system, "Build planning protocol") {
					attempt := plans.Add(1)
					if attempt == 1 || !retrySucceeds {
						reply = "Completed 1 build step."
					} else {
						if !strings.Contains(system, before) || !strings.Contains(system, page) || !strings.Contains(user, prompt) ||
							!strings.Contains(system, "keep the surrounding sections and destinations") {
							http.Error(w, "Missing homepage source or control-level edit scope", http.StatusBadRequest)
							return
						}
						reply = fmt.Sprintf(`{"objective":"Remove the homepage subscription button","steps":[{"title":"Edit site header","goal":"Remove only the subscription button","files":[%q]}]}`, header)
					}
				} else {
					steps.Add(1)
					if !strings.Contains(user, before) || strings.Contains(user, page) {
						http.Error(w, "Expected only the planned component source", http.StatusBadRequest)
						return
					}
					reply = fmt.Sprintf(`<dyad-write path="%s">%s</dyad-write>`, header, after)
				}
				writeBuildReply(w, reply)
			}))
			defer server.Close()
			if err := db.NewSettingsRepository(database).SetMany(ctx, map[string]string{"llm.base_url": server.URL, "llm.model": "blog-test"}); err != nil {
				t.Fatal(err)
			}
			service := testBuildService(database)
			err = service.StreamChat(ctx, StreamChatRequest{ChatID: chatID, Mode: "build", Prompt: prompt})
			wantSource, wantSteps, wantMessages := before, int32(0), 0
			if retrySucceeds {
				if err != nil {
					t.Fatalf("有效的重试计划应继续写入首页组件：%v", err)
				}
				wantSource, wantSteps, wantMessages = after, 1, 2
			} else if err == nil || !strings.Contains(err.Error(), "did not return a valid build plan") {
				t.Fatalf("两次无效的计划应返回规划错误：%v", err)
			}
			if plans.Load() != 2 || steps.Load() != wantSteps {
				t.Fatalf("规划调用次数=%d，构建步骤调用次数=%d", plans.Load(), steps.Load())
			}
			if src, err := os.ReadFile(filepath.Join(root, header)); err != nil || strings.TrimSpace(string(src)) != wantSource {
				t.Fatalf("首页订阅按钮或其他入口未按要求处理：%s, %v", src, err)
			}
			if history, err := db.NewMessageRepository(database).ListByChatID(ctx, chatID); err != nil || len(history) != wantMessages {
				t.Fatalf("会话只应保存已成功执行的构建：%+v, %v", history, err)
			}
			if progress, err := service.GetBuildProgress(ctx, chatID); err != nil || progress != nil {
				t.Fatalf("无效或已完成的计划不应留下检查点：%+v, %v", progress, err)
			}
		})
	}
}

// v12.REQ-004-AC-001 到 AC-003 验证分步生成、中断恢复和单轮历史。
func TestStagedSaaSBuildResumesAfterAServiceRestart(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "tsconfig.json"), []byte("{}"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(root, "node_modules"), 0755); err != nil {
		t.Fatal(err)
	}
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
	var pricingAttempts, repairAttempts atomic.Int32
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
			reply = `{"objective":"Build the SaaS landing page","steps":[{"title":"Landing page","goal":"Build the page shell","files":["src/App.tsx"]},{"title":"Pricing","goal":"Add pricing cards","files":["src/Prices.ts","src/Pricing.tsx"],"read":["src/App.tsx"]},{"title":"Free trial","goal":"Add trial signup and wire the page","files":["src/Trial.tsx","src/App.tsx"],"read":["src/Pricing.tsx"]}]}`
		case strings.Contains(last, "Current build step 1/3"):
			calls <- "shell"
			reply = `<dyad-write path="src/App.tsx">export default function App() { return "SaaS shell"; }</dyad-write>`
		case strings.Contains(last, "Current build step 2/3"):
			calls <- "pricing"
			if pricingAttempts.Add(1) == 1 {
				w.Header().Set("Content-Type", "text/event-stream")
				delta, _ := json.Marshal(map[string]any{"choices": []any{map[string]any{"delta": map[string]string{
					"content": `<dyad-write path="src/Prices.ts">export const starter = 19;</dyad-write><dyad-write path="src/Pricing.tsx">unfinished`,
				}}}})
				fmt.Fprintf(w, "data: %s\n\n", delta)
				return
			}
			if !strings.Contains(last, "SaaS shell") ||
				!strings.Contains(last, `Files required in this step: ["src/Pricing.tsx"]`) ||
				!strings.Contains(last, "export const starter = 19") {
				http.Error(w, "Missing completed stage source", http.StatusBadRequest)
				return
			}
			reply = `<dyad-write path="src/Pricing.tsx">export { starter as price } from "./Prices";</dyad-write>`
		case strings.Contains(last, "Current build step 3/3"):
			calls <- "trial"
			reply = `<dyad-write path="src/Trial.tsx">export const trial = "Start free trial";</dyad-write><dyad-write path="src/App.tsx">import { price } from "./Pricing"; import { trial } from "./Trial"; export default function App() { return trial + price; }</dyad-write>`
		case strings.Contains(last, "TypeScript compilation failed"):
			calls <- "repair"
			if repairAttempts.Add(1) == 1 {
				http.Error(w, "Model unavailable during repair", http.StatusServiceUnavailable)
				return
			}
			if !strings.Contains(last, "Current source: src/Trial.tsx") || !strings.Contains(last, "Current source: src/App.tsx") {
				http.Error(w, "Missing affected source or local imports", http.StatusBadRequest)
				return
			}
			reply = `<dyad-write path="src/App.tsx">import { price } from "./Pricing"; import { trial } from "./Trial"; export default function App() { return trial + String(price); }</dyad-write>`
		default:
			calls <- "unexpected"
			http.Error(w, "Expected a build plan or a single build step", http.StatusBadRequest)
			return
		}
		writeBuildReply(w, reply)
	}))
	defer server.Close()
	settings := db.NewSettingsRepository(database)
	if err := settings.SetMany(ctx, map[string]string{"llm.base_url": server.URL, "llm.model": "saas-test"}); err != nil {
		t.Fatal(err)
	}
	service := testBuildService(database)
	req := StreamChatRequest{ChatID: chatID, Mode: "build", Prompt: "Build a SaaS website with subscription pricing and a free trial button."}
	if err := service.StreamChat(ctx, req); err == nil || !strings.Contains(err.Error(), "ended before completion") {
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
	service.SetBuildProblems(tsc.NewProblemsService(db.NewAppRepository(database), stagedBuildTsc{}))
	resume := StreamChatRequest{ChatID: chatID, Mode: "build", Resume: true}
	if err := service.StreamChat(ctx, resume); err == nil || !strings.Contains(err.Error(), "Model unavailable during repair") {
		t.Fatalf("应返回修复请求的原始错误：%v", err)
	}
	if progress, err := service.GetBuildProgress(ctx, chatID); err != nil || progress == nil || progress.Completed != 3 || progress.Total != 3 {
		t.Fatalf("验证失败时应保留所有已写入的步骤：%+v, %v", progress, err)
	}
	if err := service.StreamChat(ctx, resume); err != nil {
		t.Fatal(err)
	}

	var invoked []string
	for len(calls) != 0 {
		invoked = append(invoked, <-calls)
	}
	if expected := []string{"plan", "shell", "pricing", "pricing", "trial", "repair", "repair"}; !reflect.DeepEqual(invoked, expected) {
		t.Fatalf("恢复时应跳过计划和已完成的阶段：%v", invoked)
	}
	if data, err := os.ReadFile(filepath.Join(root, "src", "App.tsx")); err != nil || !strings.Contains(string(data), "return trial + String(price)") {
		t.Fatalf("恢复后未完成站点：%s, %v", data, err)
	}
	if history, err := db.NewMessageRepository(database).ListByChatID(ctx, chatID); err != nil || len(history) != 2 || history[0].Content != req.Prompt {
		t.Fatalf("恢复后的完整构建应只记录一轮历史：%+v, %v", history, err)
	}
	if progress, err := service.GetBuildProgress(ctx, chatID); err != nil || progress != nil {
		t.Fatalf("构建完成后应清除检查点：%+v, %v", progress, err)
	}
}

type stagedBuildTsc struct{}

func writeBuildReply(w http.ResponseWriter, reply string) {
	w.Header().Set("Content-Type", "text/event-stream")
	delta, _ := json.Marshal(map[string]any{"choices": []any{map[string]any{"delta": map[string]string{"content": reply}}}})
	fmt.Fprintf(w, "data: %s\n\ndata: [DONE]\n\n", delta)
}

func (stagedBuildTsc) RunTsc(_ context.Context, root string) (string, error) {
	source, err := os.ReadFile(filepath.Join(root, "src", "App.tsx"))
	if err != nil {
		return "", err
	}
	if !strings.Contains(string(source), "String(price)") {
		return "src/App.tsx(1,45): error TS2322: Format the displayed price.", fmt.Errorf("exit code 2")
	}
	return "", nil
}

func testBuildService(database *db.DB) *ChatService {
	apps := db.NewAppRepository(database)
	chats := db.NewChatRepository(database)
	bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)
	service := NewChatService(chats, apps, bps, nil)
	service.SetModelRepositories(db.NewSettingsRepository(database), db.NewMessageRepository(database))
	return service
}
