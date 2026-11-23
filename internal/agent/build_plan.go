package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"buildui/internal/config"
	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/llm"
	"buildui/internal/workspace"
)

const buildPlanPrompt = `Build planning protocol
Plan the latest user request. Use the approved blueprint and conversation history as background. For an edit, inspect the current source, list the files that actually render the requested behavior, and preserve unrelated features.
For a request to remove a button, locate the visible label in the requested screen's navigation and content. Include button-styled links and desktop/mobile variants of the same control. Remove only the requested control and keep the surrounding sections and destinations. When a standalone link opens a form with its own submit button, remove the link and preserve the form unless the user specifically asks to change the form.
Return one JSON object only, with this shape:
{"objective":"Concise requirements for the whole build","steps":[{"title":"Short English action","goal":"Concrete scope and acceptance for this step","files":["relative/path/to/write"],"read":["related/existing/file"]}]}
Use between 1 and %d ordered steps. Use one step for a small change. Use the fewest steps that keep each response short enough to finish. Group closely related files and prefer one to three focused files per step. Each of the files and read lists can have up to %d entries per step. Put only files that must be written into files. Only include source files whose actual contents are necessary in read. Use [] for steps that need no file changes. Do not emit code or tool calls. Sequence the steps so later steps can reuse earlier work and the final step completes the requested behavior.`

var errInvalidBuildPlan = errs.NewExternalError("The model did not return a valid build plan. Try again.", nil)

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

func (s *ChatService) streamPlannedBuild(ctx context.Context, req StreamChatRequest, appID int64, root, contextPrompt string, client *llm.OpenAIClient, request llm.ChatRequest) error {
	state, err := s.messageRepo.GetBuildCheckpoint(ctx, req.ChatID)
	if err != nil {
		return err
	}
	if req.Resume && state == nil {
		return errs.NewPreconditionError("There is no unfinished build to resume.", nil)
	}
	if !req.Resume && (state == nil || state.Prompt != req.Prompt || !slices.Equal(state.Attachments, req.Attachments)) {
		state, err = s.planBuild(ctx, req, root, contextPrompt, client, request)
		if err != nil {
			return err
		}
		if err := s.messageRepo.SaveBuildCheckpoint(ctx, req.ChatID, state); err != nil {
			return err
		}
	}

	request.IdleTimeout = config.ModelBuildStreamIdleTimeout
	if err := restoreStepFiles(root, state); err != nil {
		return err
	}
	for state.Next < len(state.Steps) {
		step := state.Steps[state.Next]
		label := fmt.Sprintf("Build step %d/%d — %s", state.Next+1, len(state.Steps), step.Title)
		s.emitProgress(req.ChatID, label+" · Waiting for model output…")
		remaining := make([]string, 0, len(step.Files))
		for _, name := range step.Files {
			if !slices.Contains(state.StepFiles, name) {
				remaining = append(remaining, name)
			}
		}
		stepRequest := buildStepRequest(request, root, state, step, remaining)
		var reply strings.Builder
		recordChange := func(name string) error {
			name = filepath.ToSlash(filepath.Clean(name))
			newFile := slices.Contains(remaining, name) && !slices.Contains(state.StepFiles, name)
			if state.Changed && !newFile {
				return nil
			}
			state.Changed = true
			if newFile {
				state.StepFiles = append(state.StepFiles, name)
			}
			// 文件已写入后再更新检查点，恢复时只请求尚未写入的文件。
			if err := s.messageRepo.SaveBuildCheckpoint(ctx, req.ChatID, state); err != nil {
				return err
			}
			if newFile {
				s.emitProgress(req.ChatID, fmt.Sprintf("%s · %d/%d files saved", label, len(state.StepFiles), len(step.Files)))
			}
			return nil
		}
		_, err := s.streamBuildStep(ctx, req.ChatID, root, client, stepRequest, remaining, func(text string) { reply.WriteString(text) }, recordChange)
		if err != nil {
			return err
		}
		state.Next++
		state.StepFiles = nil
		if text := strings.TrimSpace(reply.String()); text != "" {
			state.Reply = strings.TrimSpace(state.Reply + "\n\n" + text)
		}
		if err := s.messageRepo.SaveBuildCheckpoint(ctx, req.ChatID, state); err != nil {
			return err
		}
	}

	if state.Changed {
		if err := s.verifyPlannedBuild(ctx, req.ChatID, appID, root, client, request); err != nil {
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

func restoreStepFiles(root string, state *db.BuildCheckpoint) error {
	if len(state.StepFiles) == 0 || state.Next >= len(state.Steps) {
		return nil
	}
	dir, err := os.OpenRoot(root)
	if err != nil {
		return err
	}
	defer dir.Close()
	// 恢复前检查文件仍在项目内，期间删除的文件重新列入生成目标。
	state.StepFiles = slices.DeleteFunc(state.StepFiles, func(name string) bool {
		if !slices.Contains(state.Steps[state.Next].Files, name) {
			return true
		}
		info, err := dir.Stat(name)
		return err != nil || !info.Mode().IsRegular()
	})
	return nil
}

func (s *ChatService) planBuild(ctx context.Context, req StreamChatRequest, root, contextPrompt string, client *llm.OpenAIClient, request llm.ChatRequest) (*db.BuildCheckpoint, error) {
	available, err := workspace.ListSources(root)
	if err != nil {
		return nil, err
	}
	// 规划时提供页面及其直接依赖，实际执行时仍只发送该步骤指定的文件。
	paths := sourcePathsWithLocalImports(root, requestedSourcePaths(root, req.Prompt), available)
	s.emitProgress(req.ChatID, "Planning build steps…")
	request.MaxTokens = config.ModelBuildPlanMaxTokens
	request.IdleTimeout = config.ModelBuildStreamIdleTimeout
	request.Messages = slices.Clone(request.Messages)
	request.Messages[0].Content = fmt.Sprintf(buildPlanPrompt, config.ModelBuildMaxSteps, config.ModelBuildMaxFilesPerStep) + projectStackContext(root) + "\n" + contextPrompt + sourceFilesContext(root, paths)
	last := &request.Messages[len(request.Messages)-1]
	last.Content += "\n\nReturn the ordered build plan as a single JSON object with objective and steps."
	readPlan := func() (*db.BuildCheckpoint, error) {
		var reply strings.Builder
		if err := streamModelResponse(ctx, client, request, func(chunk string) error {
			reply.WriteString(chunk)
			return nil
		}); err != nil {
			return nil, err
		}
		return decodeBuildPlan(reply.String())
	}
	state, err := readPlan()
	if errors.Is(err, llm.ErrOutputLimit) || errors.Is(err, errInvalidBuildPlan) {
		s.emitProgress(req.ChatID, "Retrying the build plan…")
		last.Content += "\nThe previous response could not be read as a plan. Return an object starting with { and containing objective and steps. Keep the objective and each goal to one sentence. Do not declare the work completed."
		state, err = readPlan()
	}
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
	first, last := strings.IndexByte(text, '{'), strings.LastIndexByte(text, '}')
	if first < 0 || last < first || json.Unmarshal([]byte(text[first:last+1]), &plan) != nil ||
		strings.TrimSpace(plan.Objective) == "" || len(plan.Steps) == 0 || len(plan.Steps) > config.ModelBuildMaxSteps {
		return nil, errInvalidBuildPlan
	}
	for i := range plan.Steps {
		step := &plan.Steps[i]
		step.Title = strings.Join(strings.Fields(step.Title), " ")
		if step.Title == "" || strings.TrimSpace(step.Goal) == "" || step.Files == nil ||
			len(step.Files) > config.ModelBuildMaxFilesPerStep || len(step.Read) > config.ModelBuildMaxFilesPerStep ||
			!normalizeBuildPaths(step.Files) || !normalizeBuildPaths(step.Read) {
			return nil, errInvalidBuildPlan
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

func buildStepRequest(request llm.ChatRequest, root string, state *db.BuildCheckpoint, step db.BuildStep, remaining []string) llm.ChatRequest {
	completed := make([]string, 0, state.Next)
	for _, previous := range state.Steps[:state.Next] {
		completed = append(completed, previous.Title)
	}
	paths := append(slices.Clone(step.Files), step.Read...)
	prompt := fmt.Sprintf("Build objective: %s\nOriginal user request: %s\nCompleted build steps: %q\nCurrent build step %d/%d: %s\nStep goal: %s\nFiles required in this step: %q\nAlready saved for this step: %q\nStart with complete tool blocks for the required files, one file at a time, with no preamble. Preserve already saved files. Reuse existing source, keep the code focused on the current goal, and keep other steps out of this reply.",
		state.Objective, state.Prompt, completed, state.Next+1, len(state.Steps), step.Title, step.Goal, remaining, state.StepFiles)
	request.Messages = []llm.ChatMessage{
		request.Messages[0],
		{Role: "user", Content: prompt + sourceFilesContext(root, paths), Images: state.Attachments},
	}
	return request
}
