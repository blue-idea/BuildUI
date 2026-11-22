package tsc

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/db"
)

type mockTscRunner struct {
	outputs []string
	errors  []error
	calls   int
}

func (m *mockTscRunner) RunTsc(ctx context.Context, appPath string) (string, error) {
	idx := m.calls
	m.calls++
	if idx < len(m.outputs) {
		var err error
		if idx < len(m.errors) {
			err = m.errors[idx]
		}
		return m.outputs[idx], err
	}
	return "", nil
}

// v1.REQ-004-AC-001: 校验 TypeScript 诊断输出解析（两种主流格式）
func TestTscParser_ParseDiagnostics(t *testing.T) {
	rawOutput := `
src/components/Header.tsx(12,5): error TS2322: Type 'number' is not assignable to type 'string'.
src/App.tsx:25:9 - error TS2304: Cannot find name 'unresolvedVar'.
src/utils/math.ts(5,1): warning TS6133: 'unused' is declared but its value is never read.
`
	diagnostics := ParseDiagnostics(rawOutput)
	if len(diagnostics) != 3 {
		t.Fatalf("expected 3 diagnostics, got %d", len(diagnostics))
	}

	// 检查第一条（括号格式）
	d1 := diagnostics[0]
	if d1.File != "src/components/Header.tsx" || d1.Line != 12 || d1.Column != 5 || d1.Severity != "error" {
		t.Errorf("diagnostic 1 mismatch: %+v", d1)
	}
	if !strings.Contains(d1.Message, "Type 'number' is not assignable to type 'string'") {
		t.Errorf("diagnostic 1 message mismatch: %s", d1.Message)
	}

	// 检查第二条（冒号短横线格式）
	d2 := diagnostics[1]
	if d2.File != "src/App.tsx" || d2.Line != 25 || d2.Column != 9 || d2.Severity != "error" {
		t.Errorf("diagnostic 2 mismatch: %+v", d2)
	}
	if !strings.Contains(d2.Message, "Cannot find name 'unresolvedVar'") {
		t.Errorf("diagnostic 2 message mismatch: %s", d2.Message)
	}

	// 检查第三条（警告）
	d3 := diagnostics[2]
	if d3.Severity != "warning" {
		t.Errorf("diagnostic 3 severity expected warning, got %s", d3.Severity)
	}
}

// v1.REQ-004-AC-001: 校验按特定 paths 过滤错误
func TestTscParser_FilterDiagnostics(t *testing.T) {
	diagnostics := []DiagnosticItem{
		{File: "src/components/Header.tsx", Line: 10, Column: 2, Message: "err1", Severity: "error"},
		{File: "src/components/Button.tsx", Line: 15, Column: 4, Message: "err2", Severity: "error"},
		{File: "src/pages/Home.tsx", Line: 20, Column: 1, Message: "err3", Severity: "error"},
	}

	// 场景 1: paths 为空，返回全部
	all := FilterDiagnostics(diagnostics, nil)
	if len(all) != 3 {
		t.Errorf("expected 3 diagnostics when paths is nil, got %d", len(all))
	}

	// 场景 2: 指定单个文件路径
	fileOnly := FilterDiagnostics(diagnostics, []string{"src/components/Header.tsx"})
	if len(fileOnly) != 1 || fileOnly[0].File != "src/components/Header.tsx" {
		t.Errorf("expected 1 diagnostic for Header.tsx, got %+v", fileOnly)
	}

	// 场景 3: 指定目录前缀
	dirOnly := FilterDiagnostics(diagnostics, []string{"src/components"})
	if len(dirOnly) != 2 {
		t.Errorf("expected 2 diagnostics in src/components directory, got %d", len(dirOnly))
	}
}

// v1.REQ-004-AC-002: 校验错误反馈提示词构造
func TestRemediation_BuildPrompt(t *testing.T) {
	problems := []DiagnosticItem{
		{
			File:     "src/App.tsx",
			Line:     18,
			Column:   5,
			Message:  "TS2322: Type 'boolean' is not assignable to type 'string'",
			Severity: "error",
		},
	}

	prompt := BuildRemediationPrompt(problems)

	if !strings.Contains(prompt, "TypeScript compilation failed") {
		t.Errorf("prompt missing failure header")
	}
	if !strings.Contains(prompt, "src/App.tsx:18:5") {
		t.Errorf("prompt missing exact file and line coordinates")
	}
	if !strings.Contains(prompt, "TS2322") {
		t.Errorf("prompt missing TS error code")
	}
	if !strings.Contains(prompt, "<dyad-write") {
		t.Errorf("prompt missing instruction on how to write fixed files")
	}
}

// v1.REQ-004-AC-001: 校验 ProblemsService.CheckTypeScript 与 AppRepository 集成
func TestProblemsService_CheckTypeScript(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "tsc_service_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")
	database, err := db.Open(context.Background(), dbPath)
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	appID, err := appRepo.Create(context.Background(), &db.AppEntity{
		Name: "TSC Demo App",
		Path: tempDir,
	})
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}

	mockRunner := &mockTscRunner{
		outputs: []string{
			"src/App.tsx(10,5): error TS2322: Type 'number' is not assignable to type 'string'.",
		},
	}

	service := NewProblemsService(appRepo, mockRunner)

	res, err := service.CheckTypeScript(context.Background(), CheckTypeScriptRequest{
		AppID: appID,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !res.HasErrors {
		t.Errorf("expected HasErrors to be true")
	}
	if len(res.Problems) != 1 {
		t.Fatalf("expected 1 problem, got %d", len(res.Problems))
	}
	if res.Problems[0].File != "src/App.tsx" || res.Problems[0].Line != 10 {
		t.Errorf("unexpected problem item: %+v", res.Problems[0])
	}
}

// v1.REQ-004-AC-002: 校验自愈闭环控制逻辑（Remediation Loop）
func TestProblemsService_RunSelfHealingLoop(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "self_healing_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")
	database, err := db.Open(context.Background(), dbPath)
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	appID, err := appRepo.Create(context.Background(), &db.AppEntity{
		Name: "Self Healing App",
		Path: tempDir,
	})
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}

	// 模拟两轮检查：第 1 轮报告 TS 错误，经自愈 handler 修复后，第 2 轮编译无错误通过
	mockRunner := &mockTscRunner{
		outputs: []string{
			"src/Button.tsx(5,3): error TS2304: Cannot find name 'icon'.",
			"", // 第二次编译输出为空（无错误）
		},
	}

	service := NewProblemsService(appRepo, mockRunner)

	fixHandlerCalls := 0
	result, err := service.RunSelfHealingLoop(context.Background(), appID, nil, 3, func(ctx context.Context, problems []DiagnosticItem) error {
		fixHandlerCalls++
		if len(problems) != 1 || problems[0].File != "src/Button.tsx" {
			t.Errorf("expected affected file, got %+v", problems)
		}
		return nil
	})

	if err != nil {
		t.Fatalf("unexpected error in self-healing loop: %v", err)
	}

	if !result.Success {
		t.Errorf("expected self-healing to succeed")
	}
	if result.Attempts != 1 {
		t.Errorf("expected 1 remediation attempt, got %d", result.Attempts)
	}
	if fixHandlerCalls != 1 {
		t.Errorf("expected 1 call to fixHandler, got %d", fixHandlerCalls)
	}
}
