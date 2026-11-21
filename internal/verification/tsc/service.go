package tsc

import (
	"context"

	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/workspace"
)

// TscRunner 抽象 TypeScript 执行器
type TscRunner interface {
	RunTsc(ctx context.Context, appPath string) (string, error)
}

// defaultTscRunner 默认执行器：在目标应用路径执行 pnpm exec tsc --noEmit
type defaultTscRunner struct{}

func (d *defaultTscRunner) RunTsc(ctx context.Context, appPath string) (string, error) {
	cmd := workspace.PnpmCommand(ctx, appPath, "exec", "tsc", "--noEmit")
	out, err := cmd.CombinedOutput()
	// tsc 在报错时通常返回 exit code 2，我们仍需返回完整的错误输出
	return string(out), err
}

// ProblemsService 提供 TypeScript 问题诊断与自愈验证服务
type ProblemsService struct {
	appRepo *db.AppRepository
	runner  TscRunner
}

// NewProblemsService 创建服务实例
func NewProblemsService(appRepo *db.AppRepository, runner TscRunner) *ProblemsService {
	if runner == nil {
		runner = &defaultTscRunner{}
	}
	return &ProblemsService{
		appRepo: appRepo,
		runner:  runner,
	}
}

// CheckTypeScript 执行 TypeScript 静态类型检查并返回诊断结果
func (s *ProblemsService) CheckTypeScript(ctx context.Context, req CheckTypeScriptRequest) (*ProblemsResponse, error) {
	if req.AppID <= 0 {
		return nil, errs.NewValidationError("app id must be positive", nil)
	}

	app, err := s.appRepo.GetByID(ctx, req.AppID)
	if err != nil {
		return nil, err
	}

	rawOutput, runErr := s.runner.RunTsc(ctx, app.Path)
	allProblems := ParseDiagnostics(rawOutput)
	if runErr != nil && len(allProblems) == 0 {
		return nil, errs.NewExternalError("TypeScript check could not run: "+rawOutput, runErr)
	}
	filtered := FilterDiagnostics(allProblems, req.Paths)

	hasErrors := false
	for _, p := range filtered {
		if p.Severity == "error" {
			hasErrors = true
			break
		}
	}

	return &ProblemsResponse{
		HasErrors: hasErrors,
		Problems:  filtered,
	}, nil
}

// RunSelfHealingLoop 驱动自愈循环直至类型错误清零或达到轮次上限
func (s *ProblemsService) RunSelfHealingLoop(
	ctx context.Context,
	appID int64,
	paths []string,
	maxAttempts int,
	fixHandler func(ctx context.Context, prompt string) error,
) (*RemediationResult, error) {
	if maxAttempts <= 0 {
		maxAttempts = 3
	}

	attempts := 0
	for attempts < maxAttempts {
		resp, err := s.CheckTypeScript(ctx, CheckTypeScriptRequest{
			AppID: appID,
			Paths: paths,
		})
		if err != nil {
			return nil, err
		}

		if !resp.HasErrors {
			// 零错误，自愈成功或首次即通过
			return &RemediationResult{
				Success:       true,
				Attempts:      attempts,
				FinalProblems: resp.Problems,
			}, nil
		}

		attempts++

		// 构造自愈修复 Prompt
		prompt := BuildRemediationPrompt(resp.Problems)
		if fixHandler != nil {
			if err := fixHandler(ctx, prompt); err != nil {
				return nil, errs.NewInternalError("remediation handler failed during self-healing loop", err)
			}
		}
	}

	// 达到最大轮次后进行最后一次检查确认
	finalResp, err := s.CheckTypeScript(ctx, CheckTypeScriptRequest{
		AppID: appID,
		Paths: paths,
	})
	if err != nil {
		return nil, err
	}

	return &RemediationResult{
		Success:       !finalResp.HasErrors,
		Attempts:      attempts,
		FinalProblems: finalResp.Problems,
	}, nil
}
