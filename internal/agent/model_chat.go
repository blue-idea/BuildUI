package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"maps"
	"path/filepath"
	"slices"
	"strings"

	"buildui/internal/blueprint"
	"buildui/internal/config"
	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/llm"
)

// BlueprintPrompt 规定大模型生成应用蓝图的标准格式与关键字段（设计方向、主色调、视觉资产清单含Logo/插图prompts）
const BlueprintPrompt = `Propose the blueprint for the user's requested app. Reply with only one JSON object, without Markdown fences, using these fields:
{
  "appName": "...",
  "designDirection": "...",
  "primaryColor": "#123456",
  "themeId": "default",
  "visuals": [
    {"id": "brand-logo", "type": "logo", "description": "Application logo mark", "prompt": "Modern minimalist vector logo for..."},
    {"id": "hero-illustration", "type": "illustration", "description": "Hero section illustration", "prompt": "Clean modern isometric illustration depicting..."},
    {"id": "feature-icon", "type": "icon", "description": "Key feature icon", "prompt": "Clean Lucide-style feature icon for..."}
  ]
}
Use the language of the user's request for human-readable values. Do not write code or install dependencies. Approval is required before implementation.`

// StreamChat 使用当前保存的模型发起一轮真实对话。
func (s *ChatService) StreamChat(ctx context.Context, req StreamChatRequest) error {
	if req.ChatID <= 0 || (!req.Resume && strings.TrimSpace(req.Prompt) == "" && len(req.Attachments) == 0) {
		return errs.NewValidationError("A chat and a prompt or attachment are required.", nil)
	}
	if req.Resume && req.Mode != "build" {
		return errs.NewValidationError("Select Build mode to resume this build.", nil)
	}
	if s.settingsRepo == nil || s.messageRepo == nil {
		return errs.NewPreconditionError("Model settings are unavailable.", nil)
	}
	return s.runSession(ctx, req.ChatID, func(runCtx context.Context) error {
		return s.streamModel(runCtx, req)
	})
}

func (s *ChatService) loadModel(ctx context.Context, provider, explicitModel string) (*llm.OpenAIClient, string, error) {
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
	if explicitModel := strings.TrimSpace(explicitModel); explicitModel != "" {
		model = explicitModel
	}

	if model == "" || endpoint == "" {
		return nil, "", errs.NewPreconditionError("Configure the model and API URL in Settings.", nil)
	}
	return llm.NewOpenAIClient(endpoint, apiKey, model), model, nil
}

func configureBuildModel(request *llm.ChatRequest) {
	request.MaxTokens = config.ModelBuildMaxTokens
	if config.SupportsDeepSeekThinking(request.Model) {
		// V4 构建优先把补全预算留给完整代码，兼顾可能保留推理的中转服务。
		request.DisableThinking = true
		request.MaxTokens = config.ModelDeepSeekBuildMaxTokens
	}
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
	client, model, err := s.loadModel(ctx, req.Provider, req.Model)
	if err != nil {
		return err
	}
	bp, err := s.bpService.GetBlueprint(ctx, req.ChatID)
	var missing *errs.BlotError
	if err != nil && !(errors.As(err, &missing) && missing.Kind == errs.KindNotFound) {
		return err
	}
	if req.Resume && (bp == nil || !bp.Approved) {
		return errs.NewPreconditionError("Approve the blueprint before resuming a build.", nil)
	}

	assembler := NewPromptAssembler()
	system := BlueprintPrompt
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
	contextPrompt := assembler.AssembleContextPrompt(project)
	system += "\n" + contextPrompt
	if bp != nil && bp.Approved && req.Mode != "build" {
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
	request := llm.ChatRequest{Model: model, Messages: messages, Temperature: 0.2, MaxTokens: config.ModelBlueprintMaxTokens}
	supportsThinking := config.SupportsDeepSeekThinking(model)
	if bp != nil && bp.Approved && req.Mode != "plan" {
		unlock, err := s.lockProjectBuild(app.ID)
		if err != nil {
			return err
		}
		defer unlock()
		configureBuildModel(&request)
		if req.Mode == "build" {
			return s.streamPlannedBuild(ctx, req, app.ID, app.Path, contextPrompt, client, request)
		}
		return s.streamBuild(ctx, req, app.Path, client, request)
	}

	drafting := bp == nil || !bp.Approved
	if drafting {
		s.emitProgress(req.ChatID, "Waiting for the model to generate a blueprint…")
	} else {
		s.emitProgress(req.ChatID, "Waiting for the model to respond…")
	}
	var reply strings.Builder
	receive := func(chunk string) error {
		reply.WriteString(chunk)
		if !drafting && s.emitter != nil {
			s.emitter.Emit("chat:chunk", map[string]any{"chatId": req.ChatID, "chunk": chunk})
		}
		return nil
	}
	err = streamModelResponse(ctx, client, request, receive)
	if drafting && errors.Is(err, llm.ErrOutputLimit) {
		reply.Reset()
		s.emitProgress(req.ChatID, "The blueprint reached the model's output limit. Retrying with a shorter blueprint…")
		request.DisableThinking = supportsThinking
		request.Messages[len(request.Messages)-1].Content += "\nReturn concise valid blueprint JSON with one short sentence per field and at most three visuals."
		err = streamModelResponse(ctx, client, request, receive)
	}
	if err != nil {
		return err
	}
	display := strings.TrimSpace(reply.String())
	if drafting {
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

func streamModelResponse(ctx context.Context, client *llm.OpenAIClient, request llm.ChatRequest, receive func(string) error) error {
	hasContent := false
	err := client.StreamChat(ctx, request, func(chunk string) error {
		hasContent = hasContent || strings.TrimSpace(chunk) != ""
		return receive(chunk)
	})
	if err == nil && !hasContent {
		return errs.NewExternalError("The model returned an empty response.", nil)
	}
	return err
}

func (s *ChatService) streamBuild(ctx context.Context, req StreamChatRequest, root string, client *llm.OpenAIClient, request llm.ChatRequest) error {
	s.emitProgress(req.ChatID, "Waiting for the model to generate code…")
	var display strings.Builder
	changed, err := s.streamBuildStep(ctx, req.ChatID, root, client, request, nil, func(text string) { display.WriteString(text) }, nil)
	if err != nil {
		return err
	}
	return s.finalizeModelBuild(ctx, req, root, request.Model, display.String(), changed, false)
}

func (s *ChatService) streamBuildStep(ctx context.Context, chatID int64, root string, client *llm.OpenAIClient, request llm.ChatRequest, expectedFiles []string, onText func(string), onChange func(string) error) (bool, error) {
	lastMessage := &request.Messages[len(request.Messages)-1]
	prompt := lastMessage.Content
	completed, pendingFiles := make(map[string]bool), make(map[string]bool)
	pendingPackages := make(map[string]string)
	pendingKinds := make(map[string]bool)
	for _, name := range expectedFiles {
		pendingFiles[name] = true
	}
	changed := false

	for continuation := 0; ; continuation++ {
		result, err := s.processChunks(ctx, chatID, root, func(feed func(string) error) error {
			return streamModelResponse(ctx, client, request, feed)
		}, onText, onChange)
		for _, name := range result.files {
			name = filepath.ToSlash(filepath.Clean(name))
			completed[name] = true
			delete(pendingFiles, name)
			delete(pendingKinds, writeFileTool)
		}
		for _, pkg := range result.packages {
			delete(pendingPackages, extractBarePackageName(pkg))
			delete(pendingKinds, addDependencyTool)
		}
		changed = changed || result.changed
		if err == nil && len(pendingFiles) == 0 && len(pendingPackages) == 0 && len(pendingKinds) == 0 {
			break
		}
		hitOutputLimit := errors.Is(err, llm.ErrOutputLimit)
		if err != nil && !hitOutputLimit && !errors.Is(err, errIncompleteTool) {
			return changed, err
		}
		if err := ctx.Err(); err != nil {
			return changed, err
		}
		interrupted := result.interrupted
		switch {
		case interrupted.path != "":
			name := filepath.ToSlash(filepath.Clean(interrupted.path))
			pendingFiles[name] = true
			delete(completed, name)
		case len(interrupted.packages) > 0:
			for _, pkg := range interrupted.packages {
				pendingPackages[extractBarePackageName(pkg)] = pkg
			}
		case interrupted.kind != "":
			pendingKinds[interrupted.kind] = true
		}
		if continuation >= config.ModelBuildContinuations {
			return changed, errs.NewExternalError("The build could not finish after automatic continuation. Completed files were retained. Ask the model to finish the remaining work in smaller changes.", err)
		}
		progress := "Continuing generation to complete unfinished tools"
		reason := "Previous response ended with unfinished tool calls."
		if hitOutputLimit {
			progress = "Continuing generation after the model's output limit"
			reason = "Previous response reached the output limit."
		}
		s.emitProgress(chatID, fmt.Sprintf("%s (%d/%d)…", progress, continuation+1, config.ModelBuildContinuations))
		// 每次续写从完整工具标签开始，避免把被截断的正文拼接进文件或会话。
		written := slices.Sorted(maps.Keys(completed))
		lastMessage.Content = fmt.Sprintf("%s\n\n%s Continue the original request. Files already written in this turn: %q. Files to rewrite in full first: %q. Dependencies to finish: %q. Tools to re-emit in full if the target was lost: %q. Skip completed files unless needed for consistency. Use complete tool tags, including their closing tags. Keep each file small and prose brief.",
			prompt, reason, written, slices.Sorted(maps.Keys(pendingFiles)), slices.Sorted(maps.Values(pendingPackages)), slices.Sorted(maps.Keys(pendingKinds))) + sourceFilesContext(root, written)
	}
	return changed, nil
}

func (s *ChatService) finalizeModelBuild(ctx context.Context, req StreamChatRequest, root, model, display string, changed, completeBuild bool) error {
	s.emitProgress(req.ChatID, "Saving generated changes…")
	commitHash := s.commitBuild(ctx, req.ChatID, root, changed)
	if err := ctx.Err(); err != nil {
		return err
	}
	if err := s.storeModelTurn(ctx, req, model, strings.TrimSpace(display), commitHash, completeBuild); err != nil {
		return err
	}
	s.emitEnd(req.ChatID, commitHash)
	return nil
}

func (s *ChatService) saveTurn(ctx context.Context, req StreamChatRequest, model, reply string) error {
	return s.storeModelTurn(ctx, req, model, reply, "", false)
}

func (s *ChatService) storeModelTurn(ctx context.Context, req StreamChatRequest, model, reply, commitHash string, completeBuild bool) error {
	user := &db.MessageEntity{
		ChatID: req.ChatID, Role: "user", Content: req.Prompt,
	}
	assistant := &db.MessageEntity{
		ChatID: req.ChatID, Role: "assistant", Content: reply, Model: model, CommitHash: commitHash,
	}
	return s.messageRepo.SaveTurn(ctx, user, assistant, completeBuild)
}
