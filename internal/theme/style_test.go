package theme

import (
	"context"
	"strings"
	"testing"

	"buildui/internal/llm"
)

// mockSettingsRepo 模拟配置存储仓储
type mockSettingsRepo struct {
	data map[string]string
}

func (m *mockSettingsRepo) GetAll(ctx context.Context) (map[string]string, error) {
	return m.data, nil
}

// mockProvider 模拟 LLM Provider
type mockProvider struct {
	capturedRequest llm.ChatRequest
	responseChunks  []string
	err             error
}

func (m *mockProvider) StreamChat(ctx context.Context, req llm.ChatRequest, onChunk llm.StreamChunkHandler) error {
	m.capturedRequest = req
	if m.err != nil {
		return m.err
	}
	for _, chunk := range m.responseChunks {
		if err := onChunk(chunk); err != nil {
			return err
		}
	}
	return nil
}

func (m *mockProvider) TestConnection(ctx context.Context) error {
	return nil
}

func TestExtractStyle_Validation(t *testing.T) {
	svc := NewThemeService(nil)
	ctx := context.Background()

	// 文本与图片均为空
	_, err := svc.ExtractStyle(ctx, ExtractStyleRequest{})
	if err == nil {
		t.Fatalf("expected validation error when reference and image are empty, got nil")
	}
}

func TestExtractStyle_NoSettings(t *testing.T) {
	svc := NewThemeService(nil)
	ctx := context.Background()

	// 未注入 settingsRepo
	_, err := svc.ExtractStyle(ctx, ExtractStyleRequest{Reference: "Linear"})
	if err == nil || !strings.Contains(err.Error(), "settings are unavailable") {
		t.Fatalf("expected settings unavailable error, got: %v", err)
	}

	// 注入了空配置
	svc.SetSettingsRepo(&mockSettingsRepo{data: map[string]string{}})
	_, err = svc.ExtractStyle(ctx, ExtractStyleRequest{Reference: "Linear"})
	if err == nil || !strings.Contains(err.Error(), "Configure the model") {
		t.Fatalf("expected unconfigured model error, got: %v", err)
	}
}

func TestExtractStyle_TextSuccess(t *testing.T) {
	svc := NewThemeService(nil)
	ctx := context.Background()

	mockRepo := &mockSettingsRepo{
		data: map[string]string{
			"llm.providers.openai.base_url": "https://api.openai.com/v1",
			"llm.providers.openai.api_key":  "sk-test",
			"llm.providers.openai.model":    "gpt-4o",
			"llm.active_provider":           "openai",
		},
	}
	svc.SetSettingsRepo(mockRepo)

	mockLLM := &mockProvider{
		responseChunks: []string{
			"```json\n{\n",
			`  "name": "Linear Dark Inspired",`,
			`  "palette": {`,
			`    "primary": "#5e6ad2",`,
			`    "accent": "#8792e8",`,
			`    "background": "#08090a",`,
			`    "surface": "#121316",`,
			`    "text": "#f7f8f8",`,
			`    "textMuted": "#8a8f98",`,
			`    "border": "#222326"`,
			`  },`,
			`  "borderRadius": "xl",`,
			`  "typography": "Inter, sans-serif",`,
			`  "tags": ["Dark Mode", "Obsidian"],`,
			`  "stylePrompt": "# Design System: Linear Dark\n- High Polish Obsidian"` + "\n",
			"}\n```",
		},
	}
	svc.SetClientFactory(func(endpoint, apiKey, model string) llm.Provider {
		return mockLLM
	})

	res, err := svc.ExtractStyle(ctx, ExtractStyleRequest{
		Reference: "Linear",
		Provider:  "openai",
		Model:     "gpt-4o",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.Name != "Linear Dark Inspired" {
		t.Errorf("expected name 'Linear Dark Inspired', got '%s'", res.Name)
	}
	if res.Palette.Primary != "#5e6ad2" {
		t.Errorf("expected primary '#5e6ad2', got '%s'", res.Palette.Primary)
	}
	if res.Palette.Background != "#08090a" {
		t.Errorf("expected background '#08090a', got '%s'", res.Palette.Background)
	}
	if res.BorderRadius != "xl" {
		t.Errorf("expected borderRadius 'xl', got '%s'", res.BorderRadius)
	}
	if len(res.Tags) != 2 || res.Tags[0] != "Dark Mode" {
		t.Errorf("unexpected tags: %v", res.Tags)
	}
	if !strings.Contains(res.StylePrompt, "Linear Dark") {
		t.Errorf("expected stylePrompt to contain 'Linear Dark', got '%s'", res.StylePrompt)
	}
	if res.DesignPrompt != res.StylePrompt {
		t.Errorf("expected designPrompt to match stylePrompt for compatibility")
	}

	// 验证请求发给了 mockLLM
	if len(mockLLM.capturedRequest.Messages) == 0 {
		t.Fatalf("expected messages in captured request")
	}
	sysMsg := mockLLM.capturedRequest.Messages[0]
	if sysMsg.Role != "system" || !strings.Contains(sysMsg.Content, "Design System Architect") {
		t.Errorf("unexpected system message: %v", sysMsg)
	}
}

func TestExtractStyle_MultimodalSuccess(t *testing.T) {
	svc := NewThemeService(nil)
	ctx := context.Background()

	mockRepo := &mockSettingsRepo{
		data: map[string]string{
			"llm.providers.gemini.base_url": "https://generativelanguage.googleapis.com",
			"llm.providers.gemini.api_key":  "gemini-key",
			"llm.providers.gemini.model":    "gemini-1.5-pro",
		},
	}
	svc.SetSettingsRepo(mockRepo)

	mockLLM := &mockProvider{
		responseChunks: []string{
			`{"name": "Visual Glow", "palette": {"primary": "#ff007f", "background": "#000000", "surface": "#111111", "text": "#ffffff", "border": "#333333"}, "borderRadius": "2xl", "typography": "system-ui", "tags": ["Neon"], "stylePrompt": "Neon UI"}`,
		},
	}
	svc.SetClientFactory(func(endpoint, apiKey, model string) llm.Provider {
		return mockLLM
	})

	testDataURL := "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

	res, err := svc.ExtractStyle(ctx, ExtractStyleRequest{
		Reference:   "My uploaded UI",
		ImageBase64: testDataURL,
		Provider:    "gemini",
		Model:       "gemini-1.5-pro",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.Name != "Visual Glow" {
		t.Errorf("expected name 'Visual Glow', got '%s'", res.Name)
	}

	// 验证包含多模态图片
	var userMsg *llm.ChatMessage
	for _, m := range mockLLM.capturedRequest.Messages {
		if m.Role == "user" {
			userMsg = &m
			break
		}
	}
	if userMsg == nil {
		t.Fatalf("expected user message in captured request")
	}
	if len(userMsg.Images) == 0 || userMsg.Images[0] != testDataURL {
		t.Errorf("expected user message to contain image data URL, got: %v", userMsg.Images)
	}
}
