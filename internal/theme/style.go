package theme

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"buildui/internal/errs"
	"buildui/internal/llm"
)

// ExtractStyleRequest 包含风格提取入参
type ExtractStyleRequest struct {
	Reference   string `json:"reference"`
	ImageBase64 string `json:"imageBase64,omitempty"`
	Provider    string `json:"provider,omitempty"`
	Model       string `json:"model,omitempty"`
	AppType     string `json:"appType,omitempty"` // "web" | "app" | "desktop"，默认为 "web"
}

// ColorPaletteDTO 调色板数据传输对象
type ColorPaletteDTO struct {
	Primary    string `json:"primary"`
	Accent     string `json:"accent"`
	Background string `json:"background"`
	Surface    string `json:"surface"`
	Text       string `json:"text"`
	TextMuted  string `json:"textMuted"`
	Border     string `json:"border"`
}

// ExtractedStyleDTO 风格提取返回结构体
type ExtractedStyleDTO struct {
	ID              string          `json:"id"`
	Name            string          `json:"name"`
	AppType         string          `json:"appType"`
	ReferenceSource string          `json:"referenceSource"`
	Palette         ColorPaletteDTO `json:"palette"`
	BorderRadius    string          `json:"borderRadius"`
	Typography      string          `json:"typography"`
	Tags            []string        `json:"tags"`
	StylePrompt     string          `json:"stylePrompt"`
	DesignPrompt    string          `json:"designPrompt"`
	CreatedAt       string          `json:"createdAt"`
}

// buildStyleSystemPrompt 根据目标应用类型定制专属设计规范 System Prompt
func buildStyleSystemPrompt(appType string) string {
	var platformTarget, platformDirectives string
	switch appType {
	case "app":
		platformTarget = "Mobile Application (iOS Human Interface Guidelines & Android Material 3)"
		platformDirectives = `- Touch Targets: Aim for at least 44×44 pt on iOS and 48×48 dp on Android.
- Structure: Give each screen one task and make its primary action visible on a 390×844 phone viewport. Respect device safe-area insets.
- Navigation: Use stack navigation for details and a TabBar when there are 3–5 stable top-level destinations.
- Typography and Geometry: Preserve the reference's visual character using a readable type hierarchy and consistent spacing. Allow content to wrap at larger font sizes.`
	case "desktop":
		platformTarget = "Desktop Native Application (macOS Tahoe & Windows Fluent Workstation)"
		platformDirectives = `- Workstation Structure: 3-column split workstation, collapsible left sidebar/dock, integrated titlebar with native window controls / traffic lights.
- Materials & Elevation: Flat obsidian surfaces with soft backdrop blur (backdrop-blur-md) and crisp 1px hairline dividers.
- Density & Precision: High information density suitable for mouse & keyboard productivity, with keyboard shortcut hints.
- Typography: Crisp system fonts (SF Pro / Segoe UI / Inter) with tight letter tracking.`
	default:
		platformTarget = "Modern Web Application (Responsive Browser SaaS, Portals & Dashboards)"
		platformDirectives = `- Layout Structure: Responsive desktop & tablet grid, accessible top navigation header, adaptive multi-column content.
- Cards & Containers: Systemic 'rounded-xl' cards with subtle ambient drop shadows.
- States & Interactions: Explicit hover/active cursor states, interactive table rows, micro-transitions.
- Tailwind Directives: Standard utility classes adhering to desktop and responsive browser viewports.`
	}

	return fmt.Sprintf(`You are an elite Design System Architect and Senior UI/UX Engineer specialized in %s.
Analyze the provided visual reference (brand name, URL, design aesthetic description, or screenshot image).
Extract and formalize its visual design system and return ONLY a valid JSON object matching this exact schema:
{
  "name": "Design system name, e.g. 'Linear Dark' or 'Stripe Fintech'",
  "palette": {
    "primary": "#hex (main brand accent)",
    "accent": "#hex (secondary highlight or glow)",
    "background": "#hex (main canvas background)",
    "surface": "#hex (card/panel surface)",
    "text": "#hex (high-contrast body/heading text)",
    "textMuted": "#hex (secondary subtext)",
    "border": "#hex (subtle hairline border)"
  },
  "borderRadius": "sm" | "md" | "lg" | "xl" | "2xl" | "full",
  "typography": "font family stack, e.g. 'Inter, system-ui, sans-serif'",
  "tags": ["Tag1", "Tag2"],
  "stylePrompt": "A comprehensive industrial-grade design system prompt containing: 1. Visual Language & Identity 2. Color Palette Tokens 3. Layout & Component Directives 4. Tailwind Implementation Directives."
}
[Platform Specific Design Directives]
%s
Strict Rule: Return ONLY the raw JSON object. Do not output markdown fences or conversational text outside JSON.`, platformTarget, platformDirectives)
}

// cleanJSONResponse 从大模型响应字符串中清洗剥离 markdown 标记并截取 JSON 内容
func cleanJSONResponse(raw string) string {
	cleaned := strings.TrimSpace(raw)
	// 移除开头的 ```json 或 ```
	if strings.HasPrefix(cleaned, "```") {
		lines := strings.Split(cleaned, "\n")
		if len(lines) > 2 {
			cleaned = strings.Join(lines[1:len(lines)-1], "\n")
		}
	}
	cleaned = strings.TrimSpace(cleaned)
	firstBrace := strings.Index(cleaned, "{")
	lastBrace := strings.LastIndex(cleaned, "}")
	if firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace {
		cleaned = cleaned[firstBrace : lastBrace+1]
	}
	return cleaned
}

// loadModel 解析多服务商配置并实例化 Provider
func (s *ThemeService) loadModel(ctx context.Context, provider, explicitModel string) (llm.Provider, string, error) {
	if s.settingsRepo == nil {
		return nil, "", errs.NewPreconditionError("Model settings are unavailable.", nil)
	}
	settings, err := s.settingsRepo.GetAll(ctx)
	if err != nil {
		return nil, "", err
	}

	targetProvider := strings.TrimSpace(provider)
	if targetProvider == "" || targetProvider == "auto" {
		targetProvider = strings.TrimSpace(settings["llm.active_provider"])
		if targetProvider == "" {
			targetProvider = strings.TrimSpace(settings["llm.provider"])
		}
		if targetProvider == "" {
			targetProvider = "openai"
		}
	}

	prefix := fmt.Sprintf("llm.providers.%s.", targetProvider)
	endpoint := strings.TrimSpace(settings[prefix+"base_url"])
	apiKey := strings.TrimSpace(settings[prefix+"api_key"])
	model := strings.TrimSpace(settings[prefix+"model"])

	if endpoint == "" && model == "" {
		legacyProvider := strings.TrimSpace(settings["llm.provider"])
		if legacyProvider == targetProvider || targetProvider == "openai" || legacyProvider == "" {
			endpoint = strings.TrimSpace(settings["llm.base_url"])
			apiKey = strings.TrimSpace(settings["llm.api_key"])
			model = strings.TrimSpace(settings["llm.model"])
		}
	}

	if explicitModel := strings.TrimSpace(explicitModel); explicitModel != "" {
		model = explicitModel
	}

	if model == "" || endpoint == "" {
		return nil, "", errs.NewPreconditionError("Configure the model and API URL in Settings.", nil)
	}

	if s.clientFactory != nil {
		return s.clientFactory(endpoint, apiKey, model), model, nil
	}
	return llm.NewOpenAIClient(endpoint, apiKey, model), model, nil
}

// ExtractStyle 基于大模型（支持多模态 Vision）提取风格特征与完整设计系统规范
func (s *ThemeService) ExtractStyle(ctx context.Context, req ExtractStyleRequest) (*ExtractedStyleDTO, error) {
	ref := strings.TrimSpace(req.Reference)
	img := strings.TrimSpace(req.ImageBase64)
	if ref == "" && img == "" {
		return nil, errs.NewValidationError("reference or image must be provided", nil)
	}

	normAppType := strings.ToLower(strings.TrimSpace(req.AppType))
	if normAppType != "app" && normAppType != "desktop" {
		normAppType = "web"
	}

	client, modelName, err := s.loadModel(ctx, req.Provider, req.Model)
	if err != nil {
		return nil, err
	}

	userContent := ref
	if userContent == "" {
		userContent = "Analyze the visual aesthetics, palette, typography and design tokens from this screenshot."
	} else {
		userContent = "Reference: " + userContent
	}

	userMsg := llm.ChatMessage{
		Role:    "user",
		Content: userContent,
	}
	if img != "" {
		userMsg.Images = []string{img}
	}

	sysPrompt := buildStyleSystemPrompt(normAppType)

	chatReq := llm.ChatRequest{
		Model: modelName,
		Messages: []llm.ChatMessage{
			{Role: "system", Content: sysPrompt},
			userMsg,
		},
		Temperature: 0.2, // 保持较高确定性
	}

	var sb strings.Builder
	err = client.StreamChat(ctx, chatReq, func(chunk string) error {
		sb.WriteString(chunk)
		return nil
	})
	if err != nil {
		return nil, err
	}

	rawOutput := sb.String()
	cleaned := cleanJSONResponse(rawOutput)

	var parsed struct {
		Name         string          `json:"name"`
		Palette      ColorPaletteDTO `json:"palette"`
		BorderRadius string          `json:"borderRadius"`
		Typography   string          `json:"typography"`
		Tags         []string        `json:"tags"`
		StylePrompt  string          `json:"stylePrompt"`
	}

	if err := json.Unmarshal([]byte(cleaned), &parsed); err != nil {
		return nil, errs.NewInternalError("Failed to parse design system JSON from model output: "+err.Error(), err)
	}

	// 基础缺省补全
	if parsed.Name == "" {
		if ref != "" {
			parsed.Name = ref + " Inspired"
		} else {
			parsed.Name = "Custom Visual Inspired"
		}
	}
	if parsed.Palette.Primary == "" {
		parsed.Palette.Primary = "#3b82f6"
	}
	if parsed.Palette.Background == "" {
		parsed.Palette.Background = "#ffffff"
	}
	if parsed.Palette.Surface == "" {
		parsed.Palette.Surface = "#f8fafc"
	}
	if parsed.Palette.Text == "" {
		parsed.Palette.Text = "#0f172a"
	}
	if parsed.Palette.Border == "" {
		parsed.Palette.Border = "#e2e8f0"
	}
	if parsed.BorderRadius == "" {
		if normAppType == "app" {
			parsed.BorderRadius = "2xl"
		} else {
			parsed.BorderRadius = "xl"
		}
	}
	if parsed.Typography == "" {
		parsed.Typography = "Inter, system-ui, sans-serif"
	}
	if len(parsed.Tags) == 0 {
		parsed.Tags = []string{"AI Extracted", "Modern UI"}
	}
	if parsed.StylePrompt == "" {
		parsed.StylePrompt = fmt.Sprintf("# Design System Specification: %s\nPrimary: %s, Background: %s", parsed.Name, parsed.Palette.Primary, parsed.Palette.Background)
	}

	source := ref
	if source == "" {
		source = "Uploaded Screenshot"
	}

	id := fmt.Sprintf("style-%d-%x", time.Now().UnixMilli(), rand.Intn(0xffff))

	return &ExtractedStyleDTO{
		ID:              id,
		Name:            parsed.Name,
		AppType:         normAppType,
		ReferenceSource: source,
		Palette:         parsed.Palette,
		BorderRadius:    parsed.BorderRadius,
		Typography:      parsed.Typography,
		Tags:            parsed.Tags,
		StylePrompt:     parsed.StylePrompt,
		DesignPrompt:    parsed.StylePrompt,
		CreatedAt:       time.Now().Format(time.RFC3339),
	}, nil
}
