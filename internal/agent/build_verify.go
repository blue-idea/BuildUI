package agent

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"buildui/internal/config"
	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/llm"
	"buildui/internal/verification/tsc"
	"buildui/internal/workspace"
)

func (s *ChatService) verifyPlannedBuild(ctx context.Context, chatID, appID int64, root string, client *llm.OpenAIClient, request llm.ChatRequest) error {
	report := func(message string) { s.emitProgress(chatID, message) }
	_, err := s.verifyTypeScript(ctx, appID, root, report, "Resume the build to retry.", func(ctx context.Context, problems []tsc.DiagnosticItem) error {
		return s.repairBuildProblems(ctx, chatID, root, client, request, problems, report)
	})
	return err
}

// PreparePreview 先检查工作区，仅在需要修复时读取模型配置和会话。
func (s *ChatService) PreparePreview(ctx context.Context, project *db.AppEntity) (*tsc.RemediationResult, error) {
	unlock, err := s.lockProjectBuild(project.ID)
	if err != nil {
		return nil, err
	}
	defer unlock()
	report := func(message string) {
		if s.emitter != nil {
			s.emitter.Emit("preview:progress", map[string]any{"appId": project.ID, "message": message})
		}
	}
	var client *llm.OpenAIClient
	var chatID int64
	var request llm.ChatRequest
	return s.verifyTypeScript(ctx, project.ID, project.Path, report, "Start the preview again to retry.", func(ctx context.Context, problems []tsc.DiagnosticItem) error {
		if s.emitter != nil {
			s.emitter.Emit("preview:diagnostics", map[string]any{"appId": project.ID, "problems": problems})
		}
		if client == nil {
			chatID, err = s.previewRepairChat(ctx, project.ID)
			if err != nil {
				return previewRepairError(problems, err)
			}
			var model string
			client, model, err = s.loadModel(ctx, "", "")
			if err != nil {
				return previewRepairError(problems, err)
			}
			system := NewPromptAssembler().AssembleSystemPrompt()
			request = llm.ChatRequest{Model: model, Messages: []llm.ChatMessage{{Role: "system", Content: system}}, Temperature: 0.2, IdleTimeout: config.ModelBuildStreamIdleTimeout}
			configureBuildModel(&request)
		}
		if err := s.repairBuildProblems(ctx, chatID, project.Path, client, request, problems, report); err != nil {
			return previewRepairError(problems, err)
		}
		return nil
	})
}

func (s *ChatService) previewRepairChat(ctx context.Context, appID int64) (int64, error) {
	chats, err := s.chatRepo.ListByAppID(ctx, appID)
	if err != nil {
		return 0, err
	}
	var approved int64
	for _, chat := range chats {
		progress, err := s.GetBuildProgress(ctx, chat.ID)
		if err != nil {
			return 0, err
		}
		if progress != nil {
			return 0, errs.NewPreconditionError("Resume the unfinished build before repairing the preview.", nil)
		}
		if approved == 0 && s.bpService.EnsureWriteAllowed(ctx, chat.ID) == nil {
			approved = chat.ID
		}
	}
	if approved == 0 {
		return 0, errs.NewPreconditionError("Approve the project blueprint before automatic repair.", nil)
	}
	return approved, nil
}

func previewRepairError(problems []tsc.DiagnosticItem, cause error) error {
	return errs.NewExternalError("Preview check failed at "+strings.TrimSuffix(firstTypeScriptIssue(problems), "."), cause)
}

func firstTypeScriptIssue(problems []tsc.DiagnosticItem) string {
	for _, problem := range problems {
		if problem.Severity == "error" {
			return fmt.Sprintf("%s:%d %s", problem.File, problem.Line, problem.Message)
		}
	}
	return "an unknown TypeScript issue"
}

func (s *ChatService) verifyTypeScript(ctx context.Context, appID int64, root string, report func(string), retryMessage string, repair func(context.Context, []tsc.DiagnosticItem) error) (*tsc.RemediationResult, error) {
	if s.buildProblems == nil {
		return nil, nil
	}
	if _, err := os.Stat(filepath.Join(root, "tsconfig.json")); os.IsNotExist(err) {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	report("Preparing dependencies for the TypeScript check…")
	if err := workspace.EnsureProjectDependencies(ctx, root); err != nil {
		return nil, err
	}
	report("Checking project TypeScript…")
	result, err := s.buildProblems.RunSelfHealingLoop(ctx, appID, nil, config.ModelBuildRepairAttempts, func(ctx context.Context, problems []tsc.DiagnosticItem) error {
		if err := repair(ctx, problems); err != nil {
			return err
		}
		report("Checking the repaired TypeScript…")
		return nil
	})
	if err != nil {
		return nil, err
	}
	if !result.Success {
		return nil, errs.NewExternalError(fmt.Sprintf("TypeScript issues remain after repair. %s First issue: %s", retryMessage, firstTypeScriptIssue(result.FinalProblems)), nil)
	}
	return result, nil
}

func (s *ChatService) repairBuildProblems(ctx context.Context, chatID int64, root string, client *llm.OpenAIClient, request llm.ChatRequest, problems []tsc.DiagnosticItem, report func(string)) error {
	paths, err := workspace.ListSources(root)
	if err != nil {
		return err
	}
	byFile := make(map[string][]tsc.DiagnosticItem)
	var affected []string
	for _, problem := range problems {
		if problem.Severity != "error" {
			continue
		}
		name := filepath.ToSlash(filepath.Clean(problem.File))
		if len(byFile[name]) == 0 {
			affected = append(affected, name)
		}
		byFile[name] = append(byFile[name], problem)
	}
	for files := range slices.Chunk(affected, config.ModelBuildRepairBatchSize) {
		report(fmt.Sprintf("Repairing TypeScript (files affected: %d)…", len(files)))
		var batch []tsc.DiagnosticItem
		for _, file := range files {
			batch = append(batch, byFile[file]...)
		}
		sources := sourcePathsWithLocalImports(root, files, paths)
		prompt := tsc.BuildRemediationPrompt(batch) +
			"Start with complete tool blocks. Preserve the existing design and behavior. Use the exact exports, property names, and function signatures from the source below. Update only files required to fix these diagnostics.\nAvailable source paths: " +
			strings.Join(paths, ", ") + sourceFilesContext(root, sources)
		request.Messages = []llm.ChatMessage{request.Messages[0], {Role: "user", Content: prompt}}
		if _, err := s.streamBuildStep(ctx, chatID, root, client, request, nil, nil, nil); err != nil {
			return err
		}
	}
	return nil
}
