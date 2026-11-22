package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"slices"
	"strings"

	"buildui/internal/config"
	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/llm"
)

const buildPlanPrompt = `Build planning protocol
Plan how to implement the user's request and approved blueprint. Return one JSON object only, with this shape:
{"objective":"Concise requirements for the whole build","steps":[{"title":"Short English action","goal":"Concrete scope and acceptance for this step","files":["relative/path/to/write"],"read":["related/existing/file"]}]}
Use between 1 and %d ordered steps. For a small edit, use one step. Each of the files and read lists can have up to %d entries per step. Put only files that must be written into files, and only relevant context paths into read. Use [] for steps that need no file changes. Do not emit code or tool calls. Sequence the steps so each has a bounded scope and the final step completes the requested behavior.`

type BuildProgress struct {
	Completed int `json:"completed"`
	Total     int `json:"total"`
}

func (s *ChatService) GetBuildProgress(ctx context.Context, chatID int64) (*BuildProgress, error) {
	state, err := s.messageRepo.GetBuildCheckpoint(ctx, chatID)
	if err != nil || state == nil {
		return nil, err
	}
	return &BuildProgress{Completed: state.Next, Total: len(state.Steps)}, nil
}

func (s *ChatService) streamPlannedBuild(ctx context.Context, req StreamChatRequest, root, contextPrompt string, client *llm.OpenAIClient, request llm.ChatRequest) error {
	state, err := s.messageRepo.GetBuildCheckpoint(ctx, req.ChatID)
	if err != nil {
		return err
	}
	if req.Resume && state == nil {
		return errs.NewPreconditionError("There is no unfinished build to resume.", nil)
	}
	if !req.Resume && (state == nil || state.Prompt != req.Prompt || !slices.Equal(state.Attachments, req.Attachments)) {
		state, err = s.planBuild(ctx, req, contextPrompt, client, request)
		if err != nil {
			return err
		}
		if err := s.messageRepo.SaveBuildCheckpoint(ctx, req.ChatID, state); err != nil {
			return err
		}
	}

	for state.Next < len(state.Steps) {
		step := state.Steps[state.Next]
		s.emitProgress(req.ChatID, fmt.Sprintf("Build step %d/%d — %s", state.Next+1, len(state.Steps), step.Title))
		stepRequest := buildStepRequest(request, root, state, step)
		var reply strings.Builder
		changed, err := s.streamBuildStep(ctx, req.ChatID, root, client, stepRequest, step.Files, func(text string) { reply.WriteString(text) })
		if err != nil {
			return err
		}
		// 完整步骤才更新检查点，失败或重启后从同一步重新执行。
		state.Changed = state.Changed || changed
		state.Next++
		if text := strings.TrimSpace(reply.String()); text != "" {
			state.Reply = strings.TrimSpace(state.Reply + "\n\n" + text)
		}
		if err := s.messageRepo.SaveBuildCheckpoint(ctx, req.ChatID, state); err != nil {
			return err
		}
	}

	req.Prompt = state.Prompt
	display := state.Reply
	if display == "" {
		display = fmt.Sprintf("Completed %d build steps.", len(state.Steps))
	}
	return s.finalizeModelBuild(ctx, req, root, request.Model, display, state.Changed, true)
}

func (s *ChatService) planBuild(ctx context.Context, req StreamChatRequest, contextPrompt string, client *llm.OpenAIClient, request llm.ChatRequest) (*db.BuildCheckpoint, error) {
	s.emitProgress(req.ChatID, "Planning build steps…")
	request.MaxTokens = config.ModelBuildPlanMaxTokens
	request.Messages = slices.Clone(request.Messages)
	request.Messages[0].Content = fmt.Sprintf(buildPlanPrompt, config.ModelBuildMaxSteps, config.ModelBuildMaxFilesPerStep) + "\n" + contextPrompt
	var reply strings.Builder
	receive := func(chunk string) error {
		reply.WriteString(chunk)
		return nil
	}
	err := streamModelResponse(ctx, client, request, receive)
	if errors.Is(err, llm.ErrOutputLimit) {
		reply.Reset()
		s.emitProgress(req.ChatID, "Retrying with a shorter build plan…")
		request.Messages[0].Content += "\nKeep the objective and each goal to one sentence. Use the fewest steps that cover the requirements."
		err = streamModelResponse(ctx, client, request, receive)
	}
	if err != nil {
		return nil, err
	}
	state, err := decodeBuildPlan(reply.String())
	if err != nil {
		return nil, err
	}
	state.Prompt = req.Prompt
	state.Attachments = req.Attachments
	return state, nil
}

func decodeBuildPlan(text string) (*db.BuildCheckpoint, error) {
	// 只接受规划字段，忽略模型附带的运行状态。
	var plan struct {
		Objective string         `json:"objective"`
		Steps     []db.BuildStep `json:"steps"`
	}
	invalid := errs.NewExternalError("The model did not return a valid build plan. Try again.", nil)
	first, last := strings.IndexByte(text, '{'), strings.LastIndexByte(text, '}')
	if first < 0 || last < first || json.Unmarshal([]byte(text[first:last+1]), &plan) != nil ||
		strings.TrimSpace(plan.Objective) == "" || len(plan.Steps) == 0 || len(plan.Steps) > config.ModelBuildMaxSteps {
		return nil, invalid
	}
	for i := range plan.Steps {
		step := &plan.Steps[i]
		step.Title = strings.Join(strings.Fields(step.Title), " ")
		if step.Title == "" || strings.TrimSpace(step.Goal) == "" || step.Files == nil ||
			len(step.Files) > config.ModelBuildMaxFilesPerStep || len(step.Read) > config.ModelBuildMaxFilesPerStep ||
			!normalizeBuildPaths(step.Files) || !normalizeBuildPaths(step.Read) {
			return nil, invalid
		}
	}
	return &db.BuildCheckpoint{Objective: plan.Objective, Steps: plan.Steps}, nil
}

func normalizeBuildPaths(paths []string) bool {
	for i, name := range paths {
		name = strings.TrimPrefix(strings.TrimSpace(name), "./")
		if !fs.ValidPath(name) || name == "." || strings.ContainsAny(name, "\\:") {
			return false
		}
		paths[i] = name
	}
	return true
}

func buildStepRequest(request llm.ChatRequest, root string, state *db.BuildCheckpoint, step db.BuildStep) llm.ChatRequest {
	completed := make([]string, 0, state.Next)
	for _, previous := range state.Steps[:state.Next] {
		completed = append(completed, previous.Title)
	}
	paths := append(slices.Clone(step.Files), step.Read...)
	prompt := fmt.Sprintf("Build objective: %s\nOriginal user request: %s\nCompleted build steps: %q\nCurrent build step %d/%d: %s\nStep goal: %s\nFiles required in this step: %q\nImplement only the current step. Emit complete tool blocks for its files and keep other steps out of this reply.",
		state.Objective, state.Prompt, completed, state.Next+1, len(state.Steps), step.Title, step.Goal, step.Files)
	request.Messages = []llm.ChatMessage{
		request.Messages[0],
		{Role: "user", Content: prompt + sourceFilesContext(root, paths), Images: state.Attachments},
	}
	return request
}
