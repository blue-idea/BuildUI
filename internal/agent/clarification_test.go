package agent

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"

	"buildui/internal/blueprint"
	"buildui/internal/config"
	"buildui/internal/db"
	"buildui/internal/llm"
	"buildui/internal/plugins"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// v31.REQ-001 / v31.REQ-003：澄清阶段聚焦功能/UI/配色，严禁技术架构，并遵守当前语言设置与容错重试。
func TestStreamClarification_ScopeLocaleRetryAndPersistence(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	database, err := db.Open(ctx, filepath.Join(t.TempDir(), "clarify-agent.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()

	apps := db.NewAppRepository(database)
	chats := db.NewChatRepository(database)
	messages := db.NewMessageRepository(database)
	bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)

	appID, err := apps.Create(ctx, &db.AppEntity{Name: "Habit Tracker", Path: root, NeedsAppBlueprint: true})
	if err != nil {
		t.Fatal(err)
	}
	chatID, err := chats.Create(ctx, &db.ChatEntity{AppID: appID, Title: "Habit Tracker"})
	if err != nil {
		t.Fatal(err)
	}

	var calls atomic.Int32
	var seenSystem string
	model := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req llm.ChatRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.Messages) < 2 {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}
		attempt := calls.Add(1)
		seenSystem = req.Messages[0].Content
		if attempt == 1 {
			// 第一次返回非 JSON 触发自动重试
			writeBuildReply(w, "I will think about your habit tracker.")
			return
		}
		writeBuildReply(w, "```json\n"+`{
			"summary": "为了更准确地设计界面，请先确认以下功能与视觉偏好：",
			"questions": [
				{"id": "q1", "category": "features", "question": "核心页面需要包含哪些功能模块？", "type": "multi_choice", "options": ["今日打卡看板", "习惯连击日历", "数据统计图表"], "allowCustom": true},
				{"id": "q2", "category": "ui", "question": "偏好哪种界面布局风格？", "type": "single_choice", "options": ["极简卡片流", "侧栏工作台"], "allowCustom": true},
				{"id": "q3", "category": "palette", "question": "希望采用什么主色调氛围？", "type": "single_choice", "options": ["柔和森林绿", "暖阳琥珀橙"], "allowCustom": true}
			]
		}`+"\n```")
	}))
	defer model.Close()

	settings := db.NewSettingsRepository(database)
	if err := settings.SetMany(ctx, map[string]string{
		"llm.base_url": model.URL,
		"llm.model":    "clarify-test",
	}); err != nil {
		t.Fatal(err)
	}

	emitter := &mockEventEmitter{}
	service := NewChatService(chats, apps, bps, emitter)
	service.SetModelRepositories(settings, messages)

	err = service.StreamChat(ctx, StreamChatRequest{
		ChatID: chatID,
		Mode:   "build",
		Stage:  config.ChatStageClarify,
		Locale: "zh",
		Prompt: "帮我做一个习惯打卡应用",
	})
	if err != nil {
		t.Fatalf("StreamChat clarify failed: %v", err)
	}
	if calls.Load() != 2 {
		t.Fatalf("expected 2 attempts (1 retry), got %d", calls.Load())
	}

	// 验证系统提示词包含中文语言约束、聚焦功能/UI/配色（含单页/多页引导）且禁止技术架构提问
	if !strings.Contains(seenSystem, "Simplified Chinese") ||
		!strings.Contains(seenSystem, "features") ||
		!strings.Contains(seenSystem, "palette") ||
		!strings.Contains(seenSystem, "single-page") ||
		!strings.Contains(seenSystem, "multi-page") ||
		!strings.Contains(seenSystem, "Do NOT ask about technical architecture") {
		t.Fatalf("clarification system prompt missing expected guardrails:\n%s", seenSystem)
	}

	// 验证事件广播了 chat:clarification（含自动补齐的中文单页/多页题）与中文化 progress
	var gotClarification *blueprint.Questionnaire
	var progressMsgs []string
	for _, ev := range emitter.events {
		switch ev.Name {
		case "chat:clarification":
			if q, ok := ev.Data.(blueprint.Questionnaire); ok {
				gotClarification = &q
			} else if qPtr, ok := ev.Data.(*blueprint.Questionnaire); ok {
				gotClarification = qPtr
			}
		case "chat:progress":
			if m, ok := ev.Data.(map[string]any); ok {
				if msg, ok := m["message"].(string); ok {
					progressMsgs = append(progressMsgs, msg)
				}
			}
		}
	}
	if gotClarification == nil || len(gotClarification.Questions) != 4 || gotClarification.ChatID != chatID {
		t.Fatalf("expected chat:clarification payload with 4 questions (including page structure), got %+v", gotClarification)
	}
	lastQ := gotClarification.Questions[len(gotClarification.Questions)-1]
	if lastQ.ID != "page_structure" || !strings.Contains(strings.Join(lastQ.Options, ","), "单页") || !strings.Contains(strings.Join(lastQ.Options, ","), "多页") {
		t.Fatalf("expected appended Chinese single/multi page question, got %+v", lastQ)
	}
	if len(progressMsgs) == 0 || !strings.Contains(strings.Join(progressMsgs, "\n"), "澄清") {
		t.Fatalf("expected localized Chinese progress message, got %v", progressMsgs)
	}

	// 验证未创建蓝图且写盘门禁仍拦截
	if _, err := bps.GetBlueprint(ctx, chatID); err == nil {
		t.Fatal("blueprint must not exist before clarification submission")
	}
	if err := bps.EnsureWriteAllowed(ctx, chatID); err == nil {
		t.Fatal("write gate must still block before blueprint approval")
	}

	// 验证持久化到数据库
	rawClarify, err := messages.GetClarification(ctx, chatID)
	if err != nil || !strings.Contains(rawClarify, "习惯连击日历") {
		t.Fatalf("expected persisted clarification json, got %q, err=%v", rawClarify, err)
	}
}

// v31.REQ-004：验证澄清 -> 蓝图 -> 规划/构建全链路不丢失 Plugin 与设计系统预设提示词注入，且遵守语言设置。
func TestClarifyToBlueprintToBuild_PreservesPluginsAndDesignSystem(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	database, err := db.Open(ctx, filepath.Join(t.TempDir(), "full-flow.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()

	apps := db.NewAppRepository(database)
	chats := db.NewChatRepository(database)
	messages := db.NewMessageRepository(database)
	bps := blueprint.NewBlueprintService(db.NewBlueprintRepository(database), apps, database)

	appID, err := apps.Create(ctx, &db.AppEntity{Name: "SaaS Studio", Path: root, NeedsAppBlueprint: true})
	if err != nil {
		t.Fatal(err)
	}
	chatID, err := chats.Create(ctx, &db.ChatEntity{AppID: appID, Title: "SaaS Studio"})
	if err != nil {
		t.Fatal(err)
	}

	pluginStore, err := plugins.NewService(database, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	remote := mcp.NewServer(&mcp.Implementation{Name: "Design MCP", Version: "1"}, nil)
	remote.AddTool(&mcp.Tool{Name: "fetch_tokens", InputSchema: map[string]string{"type": "object"}}, func(context.Context, *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		return &mcp.CallToolResult{}, nil
	})
	handler := mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server { return remote }, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true})
	mcpHTTP := httptest.NewServer(handler)
	defer mcpHTTP.Close()

	savedPlugin, err := pluginStore.Save(ctx, plugins.Input{
		Name:      "Mobbin Design",
		Transport: "http",
		Endpoint:  mcpHTTP.URL,
		Enabled:   true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := pluginStore.SetToolPermission(ctx, savedPlugin.ID, "fetch_tokens", true); err != nil {
		t.Fatal(err)
	}

	const styleInjection = "Design System & Visual Language Specification: Cyberpunk Neon (#00ffcc on #0a0a12)."
	initialPrompt := "Create a SaaS analytics studio\n\n[Design System Style Prompt]\n" + styleInjection

	var seenClarify, seenBlueprint, seenPlan, seenBuild atomic.Bool
	model := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Messages []llm.ChatMessage                       `json:"messages"`
			Tools    []struct{ Function llm.ToolDefinition } `json:"tools"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.Messages) < 2 {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}
		system := req.Messages[0].Content
		if len(req.Tools) != 1 || !strings.Contains(system, "Use the selected plugins") || !strings.Contains(system, "Mobbin Design") {
			t.Errorf("missing selected plugin tools or instructions at stage; tools=%d", len(req.Tools))
		}
		if !strings.Contains(system, "Simplified Chinese") {
			t.Errorf("missing Simplified Chinese directive in system prompt")
		}

		allMessagesText := system
		for _, m := range req.Messages {
			allMessagesText += "\n" + m.Content
		}
		if !strings.Contains(allMessagesText, styleInjection) {
			t.Errorf("lost [Design System Style Prompt] injection across stages")
		}

		switch {
		case strings.Contains(system, "Clarification Protocol"):
			seenClarify.Store(true)
			if !strings.Contains(system, "already selected a Design System") {
				t.Errorf("clarify prompt should recognize existing Design System preset")
			}
			writeBuildReply(w, `{"summary":"请确认需要展示的核心模块：","questions":[{"id":"q1","category":"features","question":"需要哪些核心功能？","type":"multi_choice","options":["实时看板","团队权限"],"allowCustom":true}]}`)
		case strings.Contains(system, "Build planning protocol"):
			seenPlan.Store(true)
			writeBuildReply(w, `{"objective":"构建SaaS工作室","steps":[{"title":"Create App","goal":"Create App page","files":["src/App.tsx"]}]}`)
		case !seenBlueprint.Load():
			seenBlueprint.Store(true)
			if !strings.Contains(allMessagesText, "实时看板") {
				t.Errorf("blueprint prompt missing user clarification answers")
			}
			writeBuildReply(w, `{"appName":"SaaS Studio","designDirection":"赛博霓虹暗黑仪表盘，含实时看板","primaryColor":"#00ffcc","themeId":"cyberpunk-neon","visuals":[]}`)
		default:
			seenBuild.Store(true)
			writeBuildReply(w, `<dyad-write path="src/App.tsx">export default function App() { return <div>SaaS</div>; }</dyad-write>`)
		}
	}))
	defer model.Close()

	if err := db.NewSettingsRepository(database).SetMany(ctx, map[string]string{
		"llm.base_url": model.URL,
		"llm.model":    "full-flow-test",
	}); err != nil {
		t.Fatal(err)
	}

	service := testBuildService(database)
	service.SetPlugins(pluginStore)

	// 1. 首页发起澄清（携带 PluginAutomation 和 [Design System Style Prompt]）
	err = service.StreamChat(ctx, StreamChatRequest{
		ChatID:           chatID,
		Mode:             "build",
		Stage:            config.ChatStageClarify,
		Locale:           "zh",
		Prompt:           initialPrompt,
		PluginAutomation: &plugins.ProjectAutomation{Enabled: true, PluginIDs: []int64{savedPlugin.ID}},
	})
	if err != nil {
		t.Fatalf("clarify stage failed: %v", err)
	}

	// 2. 提交澄清选项进入蓝图阶段（不重复传入 PluginAutomation，验证数据库自动恢复）
	err = service.StreamChat(ctx, StreamChatRequest{
		ChatID: chatID,
		Mode:   "build",
		Stage:  config.ChatStageBlueprint,
		Locale: "zh",
		Prompt: "[Clarification Answers]\n1. 需要哪些核心功能？: 实时看板",
	})
	if err != nil {
		t.Fatalf("blueprint stage failed: %v", err)
	}

	// 验证生成蓝图后自动清理澄清缓存
	if remaining, err := messages.GetClarification(ctx, chatID); err != nil || remaining != "" {
		t.Fatalf("expected clarification cache cleared after blueprint, got %q, err=%v", remaining, err)
	}

	// 3. 批准蓝图并执行代码生成
	if err := bps.ApproveBlueprint(ctx, chatID); err != nil {
		t.Fatal(err)
	}
	err = service.StreamChat(ctx, StreamChatRequest{
		ChatID: chatID,
		Mode:   "build",
		Locale: "zh",
		Prompt: "Implement the approved blueprint and the original user request.",
	})
	if err != nil {
		t.Fatalf("build stage failed: %v", err)
	}

	if !seenClarify.Load() || !seenBlueprint.Load() || !seenPlan.Load() || !seenBuild.Load() {
		t.Fatalf("not all stages executed: clarify=%v blueprint=%v plan=%v build=%v",
			seenClarify.Load(), seenBlueprint.Load(), seenPlan.Load(), seenBuild.Load())
	}
}

func TestEnsurePageStructureQuestion_LocaleAndDeduplication(t *testing.T) {
	// 1. 英文模式下缺省时自动补入英文单页/多页选项卡片
	qEN := &blueprint.Questionnaire{
		Questions: []blueprint.QuestionItem{
			{ID: "q1", Category: "features", Question: "Which modules?", Type: "multi_choice", Options: []string{"A", "B"}},
		},
	}
	ensurePageStructureQuestion(qEN, "en")
	if len(qEN.Questions) != 2 {
		t.Fatalf("expected 2 questions after appending page structure, got %d", len(qEN.Questions))
	}
	added := qEN.Questions[1]
	if added.ID != "page_structure" || !strings.Contains(strings.Join(added.Options, "|"), "Single-page") || !strings.Contains(strings.Join(added.Options, "|"), "Multi-page") {
		t.Fatalf("expected English single/multi page options, got %+v", added)
	}

	// 2. 若模型已自带单页/多页问题则不重复追加
	qAlready := &blueprint.Questionnaire{
		Questions: []blueprint.QuestionItem{
			{ID: "q1", Category: "ui", Question: "倾向单页还是多页结构？", Type: "single_choice", Options: []string{"单页布局", "多页导航"}},
		},
	}
	ensurePageStructureQuestion(qAlready, "zh")
	if len(qAlready.Questions) != 1 {
		t.Fatalf("expected no duplicate page structure question, got %d", len(qAlready.Questions))
	}

	// 3. 若已有 5 题且未含单页/多页，替换第 5 题以保持 1~5 题合法上限
	qFull := &blueprint.Questionnaire{
		Questions: []blueprint.QuestionItem{
			{ID: "q1", Question: "Q1", Type: "single_choice", Options: []string{"A", "B"}},
			{ID: "q2", Question: "Q2", Type: "single_choice", Options: []string{"A", "B"}},
			{ID: "q3", Question: "Q3", Type: "single_choice", Options: []string{"A", "B"}},
			{ID: "q4", Question: "Q4", Type: "single_choice", Options: []string{"A", "B"}},
			{ID: "q5", Question: "Q5", Type: "single_choice", Options: []string{"A", "B"}},
		},
	}
	ensurePageStructureQuestion(qFull, "zh")
	if err := qFull.Validate(); err != nil {
		t.Fatalf("expected valid <=5 questions after capping, got %v", err)
	}
	if qFull.Questions[4].ID != "page_structure" {
		t.Fatalf("expected 5th question replaced with page_structure, got %+v", qFull.Questions[4])
	}
}
