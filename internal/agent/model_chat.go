package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"buildui/internal/blueprint"
	"buildui/internal/config"
	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/llm"
	"buildui/internal/workspace"
)

const blueprintPrompt = `Propose the blueprint for the user's requested app. Reply with only one JSON object, without Markdown fences, using these fields:
{"appName":"...", "designDirection":"...", "primaryColor":"#123456", "themeId":"default", "visuals":[{"id":"...", "type":"icon", "description":"...", "prompt":"..."}]}.
Use the language of the user's request for human-readable values. Do not write code or install dependencies. Approval is required before implementation.`

var sourceMention = regexp.MustCompile(`@([a-zA-Z0-9_./-]+)[:\s]`)

// StreamChat 使用当前保存的模型发起一轮真实对话。
func (s *ChatService) StreamChat(ctx context.Context, req StreamChatRequest) error {
	if req.ChatID <= 0 || (strings.TrimSpace(req.Prompt) == "" && len(req.Attachments) == 0) {
		return errs.NewValidationError("A chat and a prompt or attachment are required.", nil)
	}
	if s.settingsRepo == nil || s.messageRepo == nil {
		return errs.NewPreconditionError("Model settings are unavailable.", nil)
	}
	return s.runSession(ctx, req.ChatID, func(runCtx context.Context) error {
		return s.streamModel(runCtx, req)
	})
}

func (s *ChatService) streamModel(ctx context.Context, req StreamChatRequest) error {
	chat, err := s.chatRepo.GetByID(ctx, req.ChatID)
	if err != nil {
		return err
	}
	app, err := s.appRepo.GetByID(ctx, chat.AppID)
	if err != nil {
		return err
	}
	settings, err := s.settingsRepo.GetAll(ctx)
	if err != nil {
		return err
	}

	targetProvider := strings.TrimSpace(req.Provider)
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

	// 向后兼容：若独立 Provider 无配置，则回退读取旧全局配置
	if endpoint == "" && model == "" {
		legacyProvider := strings.TrimSpace(settings["llm.provider"])
		if legacyProvider == targetProvider || targetProvider == "openai" || legacyProvider == "" {
			endpoint = strings.TrimSpace(settings["llm.base_url"])
			apiKey = strings.TrimSpace(settings["llm.api_key"])
			model = strings.TrimSpace(settings["llm.model"])
		}
	}

	// 若请求显式指定了具体 Model，优先使用
	if explicitModel := strings.TrimSpace(req.Model); explicitModel != "" {
		model = explicitModel
	}

	if model == "" || endpoint == "" {
		return errs.NewPreconditionError("Configure the model and API URL in Settings.", nil)
	}
	bp, err := s.bpService.GetBlueprint(ctx, req.ChatID)
	var missing *errs.BlotError
	if err != nil && !(errors.As(err, &missing) && missing.Kind == errs.KindNotFound) {
		return err
	}

	assembler := NewPromptAssembler()
	system := blueprintPrompt
	switch {
	case bp == nil || !bp.Approved:
	case req.Mode == "plan":
		system = "Discuss the user's project and describe a plan. Do not emit tools or change any files."
	default:
		system = assembler.AssembleSystemPrompt() + "\nDo not use Markdown fences around tool output. For an app implementation, emit complete files with dyad-write. Use the language of the user's request for the interface and explanations."
	}
	tree, err := ScanWorkspaceTree(app.Path)
	if err != nil {
		return err
	}
	project := PromptContext{AppName: app.Name, WorkspaceTree: tree}
	if bp != nil {
		project.DesignDirection = bp.DesignDirection
		project.PrimaryColor = bp.PrimaryColor
		for _, visual := range bp.Visuals {
			project.Visuals = append(project.Visuals, visual.Description)
		}
	}
	system += "\n" + assembler.AssembleContextPrompt(project)
	if bp != nil && bp.Approved {
		system += sourceContext(app.Path, req.Prompt)
	}

	history, err := s.messageRepo.ListByChatID(ctx, req.ChatID)
	if err != nil {
		return err
	}
	messages := []llm.ChatMessage{{Role: "system", Content: system}}
	for _, msg := range history {
		messages = append(messages, llm.ChatMessage{Role: msg.Role, Content: msg.Content})
	}
	messages = append(messages, llm.ChatMessage{Role: "user", Content: req.Prompt, Images: req.Attachments})
	client := llm.NewOpenAIClient(endpoint, apiKey, model)
	maxTokens := config.ModelBlueprintMaxTokens
	if bp != nil && bp.Approved && req.Mode != "plan" {
		maxTokens = config.ModelBuildMaxTokens
	}
	request := llm.ChatRequest{Model: model, Messages: messages, Temperature: 0.2, MaxTokens: maxTokens}
	var reply strings.Builder
	stream := func(feed func(string) error) error {
		err := client.StreamChat(ctx, request, func(chunk string) error {
			reply.WriteString(chunk)
			return feed(chunk)
		})
		if err == nil && strings.TrimSpace(reply.String()) == "" {
			return errs.NewExternalError("The model returned an empty response.", nil)
		}
		return err
	}
	if bp != nil && bp.Approved && req.Mode != "plan" {
		var display strings.Builder
		err = s.processChunks(ctx, req.ChatID, app.Path, stream, func(text string) { display.WriteString(text) })
		if err != nil {
			return err
		}
		return s.saveTurn(ctx, req, model, strings.TrimSpace(display.String()))
	}

	err = stream(func(chunk string) error {
		if bp != nil && bp.Approved && s.emitter != nil {
			s.emitter.Emit("chat:chunk", map[string]any{"chatId": req.ChatID, "chunk": chunk})
		}
		return nil
	})
	if err != nil {
		return err
	}
	display := strings.TrimSpace(reply.String())
	if bp == nil || !bp.Approved {
		// 兼容服务商附带的 Markdown 围栏，蓝图内容仍须是有效 JSON。
		start, end := strings.IndexByte(display, '{'), strings.LastIndexByte(display, '}')
		var draft blueprint.BlueprintDTO
		if start < 0 || end < start || json.Unmarshal([]byte(display[start:end+1]), &draft) != nil ||
			strings.TrimSpace(draft.AppName) == "" || strings.TrimSpace(draft.DesignDirection) == "" {
			return errs.NewExternalError("The model did not return a valid blueprint. Try again.", nil)
		}
		draft.ChatID = req.ChatID
		draft.Approved = false
		if err := s.bpService.SaveBlueprint(ctx, draft); err != nil {
			return err
		}
		display = draft.DesignDirection
	}
	if err := s.saveTurn(ctx, req, model, display); err != nil {
		return err
	}
	s.emitEnd(req.ChatID, "")
	return nil
}

func (s *ChatService) saveTurn(ctx context.Context, req StreamChatRequest, model, reply string) error {
	if _, err := s.messageRepo.Create(ctx, &db.MessageEntity{
		ChatID: req.ChatID, Role: "user", Content: req.Prompt,
	}); err != nil {
		return err
	}
	_, err := s.messageRepo.Create(ctx, &db.MessageEntity{
		ChatID: req.ChatID, Role: "assistant", Content: reply, Model: model,
	})
	return err
}

func sourceContext(root, prompt string) string {
	paths := []string{"package.json", "src/App.tsx", "src/pages/Index.tsx"}
	for _, match := range sourceMention.FindAllStringSubmatch(prompt+" ", 5) {
		paths = append([]string{match[1]}, paths...)
	}
	var out strings.Builder
	seen := make(map[string]bool)
	for _, name := range paths {
		if seen[name] {
			continue
		}
		seen[name] = true
		if source, err := workspace.ReadSource(root, name); err == nil && len(source)+out.Len() < 64*1024 {
			out.WriteString("\nCurrent source: " + name + "\n" + source + "\n")
		}
	}
	return out.String()
}
