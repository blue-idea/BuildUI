package tsc

import (
	"context"
	"strings"

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
	if err := workspace.EnsureProjectDependencies(ctx, appPath, "tsc"); err != nil {
		return "", err
	}
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
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		message := "TypeScript check could not run"
		if output := strings.TrimSpace(rawOutput); output != "" {
			message += ": " + output
		}
		return nil, errs.NewExternalError(message, runErr)
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
	fixHandler func(ctx context.Context, problems []DiagnosticItem) error,
	checkBundle ...func(context.Context) ([]DiagnosticItem, error),
) (*RemediationResult, error) {
	if maxAttempts <= 0 {
		maxAttempts = 3
	}

	// 每次修复后从类型检查重新开始，避免打包修复引入新的类型错误。
	for attempts := 0; ; attempts++ {
		resp, err := s.CheckTypeScript(ctx, CheckTypeScriptRequest{AppID: appID, Paths: paths})
		if err != nil {
			return nil, err
		}
		if !resp.HasErrors && len(checkBundle) > 0 {
			problems, err := checkBundle[0](ctx)
			if err != nil {
				return nil, err
			}
			if len(problems) > 0 {
				resp = &ProblemsResponse{HasErrors: true, Problems: problems}
			}
		}
		if !resp.HasErrors || attempts == maxAttempts {
			return &RemediationResult{
				Success:       !resp.HasErrors,
				Attempts:      attempts,
				FinalProblems: resp.Problems,
			}, nil
		}
		if fixHandler != nil {
			if err := fixHandler(ctx, resp.Problems); err != nil {
				return nil, err
			}
		}
	}
}
