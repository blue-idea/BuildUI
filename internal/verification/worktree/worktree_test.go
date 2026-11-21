package worktree

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// v1.REQ-005-AC-001: 校验临时隔离目录名称命名规范 (^.dyad-build-[A-Za-z0-9]{6}$)
func TestWorktreeNaming_Pattern(t *testing.T) {
	for i := 0; i < 20; i++ {
		name := GenerateWorktreeName()
		if !WorktreePattern.MatchString(name) {
			t.Fatalf("generated worktree name %q does not match pattern %s", name, WorktreePattern.String())
		}
		if !strings.HasPrefix(name, ".dyad-build-") {
			t.Fatalf("generated worktree name %q must start with .dyad-build-", name)
		}
		if len(name) != len(".dyad-build-")+6 {
			t.Fatalf("expected length %d, got %d for name %s", len(".dyad-build-")+6, len(name), name)
		}
	}
}

// v1.REQ-005-AC-001: 校验 Overlay 增量覆盖复制与 node_modules / .git 排除规则
func TestOverlay_CopyAndExclusions(t *testing.T) {
	sourceDir, err := os.MkdirTemp("", "source_overlay_*")
	if err != nil {
		t.Fatalf("failed to create source dir: %v", err)
	}
	defer os.RemoveAll(sourceDir)

	destDir, err := os.MkdirTemp("", "dest_overlay_*")
	if err != nil {
		t.Fatalf("failed to create dest dir: %v", err)
	}
	defer os.RemoveAll(destDir)

	// 在源目录创建应当被复制的文件
	_ = os.MkdirAll(filepath.Join(sourceDir, "src", "components"), 0755)
	_ = os.WriteFile(filepath.Join(sourceDir, "src", "App.tsx"), []byte("export const App = 1;"), 0644)
	_ = os.WriteFile(filepath.Join(sourceDir, "src", "components", "Header.tsx"), []byte("export const Header = 2;"), 0644)
	_ = os.WriteFile(filepath.Join(sourceDir, "package.json"), []byte(`{"name":"test"}`), 0644)

	// 在源目录创建严禁被复制的文件和目录
	_ = os.MkdirAll(filepath.Join(sourceDir, "node_modules", "some-pkg"), 0755)
	_ = os.WriteFile(filepath.Join(sourceDir, "node_modules", "some-pkg", "index.js"), []byte("bad"), 0644)

	_ = os.MkdirAll(filepath.Join(sourceDir, ".git", "objects"), 0755)
	_ = os.WriteFile(filepath.Join(sourceDir, ".git", "config"), []byte("git config"), 0644)

	_ = os.MkdirAll(filepath.Join(sourceDir, "dist"), 0755)
	_ = os.WriteFile(filepath.Join(sourceDir, "dist", "bundle.js"), []byte("dist file"), 0644)

	_ = os.MkdirAll(filepath.Join(sourceDir, ".dyad-build-123456"), 0755)
	_ = os.WriteFile(filepath.Join(sourceDir, ".dyad-build-123456", "tmp.txt"), []byte("tmp"), 0644)

	// 执行 Overlay 复制
	err = CopyOverlay(sourceDir, destDir)
	if err != nil {
		t.Fatalf("unexpected copy error: %v", err)
	}

	// 验证应当复制的文件存在且内容正确
	data, err := os.ReadFile(filepath.Join(destDir, "src", "App.tsx"))
	if err != nil || string(data) != "export const App = 1;" {
		t.Errorf("App.tsx not copied properly: %v", err)
	}
	data, err = os.ReadFile(filepath.Join(destDir, "src", "components", "Header.tsx"))
	if err != nil || string(data) != "export const Header = 2;" {
		t.Errorf("Header.tsx not copied properly: %v", err)
	}

	// 验证排除项未被复制
	if _, err := os.Stat(filepath.Join(destDir, "node_modules")); !os.IsNotExist(err) {
		t.Errorf("node_modules should not be copied to destination")
	}
	if _, err := os.Stat(filepath.Join(destDir, ".git")); !os.IsNotExist(err) {
		t.Errorf(".git should not be copied to destination")
	}
	if _, err := os.Stat(filepath.Join(destDir, "dist")); !os.IsNotExist(err) {
		t.Errorf("dist should not be copied to destination")
	}
	if _, err := os.Stat(filepath.Join(destDir, ".dyad-build-123456")); !os.IsNotExist(err) {
		t.Errorf(".dyad-build-123456 should not be copied to destination")
	}
}

type mockGitRunner struct {
	commands [][]string
	err      error
}

func (m *mockGitRunner) RunGit(ctx context.Context, dir string, args ...string) (string, error) {
	m.commands = append(m.commands, args)
	return "", m.err
}

type mockBuildRunner struct {
	output   string
	exitCode int
	err      error
	calledIn string
}

func (m *mockBuildRunner) RunBuild(ctx context.Context, dir string) (string, int, error) {
	m.calledIn = dir
	return m.output, m.exitCode, m.err
}

// v1.REQ-005-AC-001: 校验 Worktree 隔离生命周期（创建 -> 覆盖 -> 构建 -> 清理）
func TestWorktreeManager_ExecuteIsolatedBuild_Success(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "wt_manager_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	mockGit := &mockGitRunner{}
	mockBuild := &mockBuildRunner{
		output:   "✓ built in 420ms",
		exitCode: 0,
	}

	manager := NewWorktreeManager(mockGit, mockBuild)

	res, err := manager.ExecuteIsolatedBuild(context.Background(), tempDir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !res.Success {
		t.Errorf("expected build success")
	}
	if res.ExitCode != 0 {
		t.Errorf("expected exit code 0, got %d", res.ExitCode)
	}
	if !strings.Contains(res.Output, "built in 420ms") {
		t.Errorf("expected build output, got %s", res.Output)
	}
	if !WorktreePattern.MatchString(res.WorktreeName) {
		t.Errorf("expected valid worktree name, got %s", res.WorktreeName)
	}

	// 验证 Git 命令调用了 worktree add 与 worktree remove
	hasAdd := false
	hasRemove := false
	for _, cmd := range mockGit.commands {
		if len(cmd) >= 2 && cmd[0] == "worktree" && cmd[1] == "add" {
			hasAdd = true
		}
		if len(cmd) >= 2 && cmd[0] == "worktree" && cmd[1] == "remove" {
			hasRemove = true
		}
	}
	if !hasAdd {
		t.Errorf("missing git worktree add command")
	}
	if !hasRemove {
		t.Errorf("missing git worktree remove command")
	}
}

// v1.REQ-005-AC-001: 校验构建失败时依然执行清理，并捕获 exitCode 与错误输出
func TestWorktreeManager_ExecuteIsolatedBuild_FailureCleanup(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "wt_fail_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	mockGit := &mockGitRunner{}
	mockBuild := &mockBuildRunner{
		output:   "ERROR: syntax error in main.tsx",
		exitCode: 1,
	}

	manager := NewWorktreeManager(mockGit, mockBuild)

	res, err := manager.ExecuteIsolatedBuild(context.Background(), tempDir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.Success {
		t.Errorf("expected build failure")
	}
	if res.ExitCode != 1 {
		t.Errorf("expected exit code 1, got %d", res.ExitCode)
	}
	if !strings.Contains(res.Output, "syntax error") {
		t.Errorf("expected output to contain syntax error, got %s", res.Output)
	}

	// 确认即使失败也必须执行 git worktree remove 清理
	hasRemove := false
	for _, cmd := range mockGit.commands {
		if len(cmd) >= 2 && cmd[0] == "worktree" && cmd[1] == "remove" {
			hasRemove = true
		}
	}
	if !hasRemove {
		t.Errorf("expected cleanup git worktree remove to be executed on failure")
	}
}

// v1.REQ-005-AC-001: 真实 Git 仓库集成测试验证隔离性与主工作区零污染
func TestWorktreeManager_RealGitIntegration(t *testing.T) {
	repoDir, err := os.MkdirTemp("", "real_git_repo_*")
	if err != nil {
		t.Fatalf("failed to create temp repo: %v", err)
	}
	defer os.RemoveAll(repoDir)

	// 初始化一个真正的本地 git 仓库并提交首个文件
	runCmd := func(name string, args ...string) {
		cmd := exec.Command(name, args...)
		cmd.Dir = repoDir
		out, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("cmd %s %v failed: %v, output: %s", name, args, err, string(out))
		}
	}

	runCmd("git", "init")
	runCmd("git", "config", "user.name", "TestAgent")
	runCmd("git", "config", "user.email", "agent@test.com")

	_ = os.WriteFile(filepath.Join(repoDir, "package.json"), []byte(`{"name":"real-test"}`), 0644)
	runCmd("git", "add", "package.json")
	runCmd("git", "commit", "-m", "Initial commit")

	// 在主工作区写入一个未提交的源文件以及一个 node_modules
	_ = os.MkdirAll(filepath.Join(repoDir, "src"), 0755)
	_ = os.WriteFile(filepath.Join(repoDir, "src", "index.ts"), []byte("const x = 100;"), 0644)
	_ = os.MkdirAll(filepath.Join(repoDir, "node_modules", "dummy"), 0755)
	_ = os.WriteFile(filepath.Join(repoDir, "node_modules", "dummy", "lib.js"), []byte("dummy"), 0644)

	// 使用默认的真实 Git 执行器与 Mock 构建执行器
	var worktreeObserved string
	customBuild := &mockBuildRunner{
		output:   "Build succeeded in worktree",
		exitCode: 0,
	}

	manager := NewWorktreeManager(nil, customBuild)
	res, err := manager.ExecuteIsolatedBuild(context.Background(), repoDir)
	if err != nil {
		t.Fatalf("unexpected error in real git integration: %v", err)
	}

	if !res.Success {
		t.Errorf("expected success")
	}
	worktreeObserved = res.WorktreePath

	// 验证构建结束后，临时 worktree 路径已被彻底清理删除
	if _, err := os.Stat(worktreeObserved); !os.IsNotExist(err) {
		t.Errorf("worktree directory %s was not cleaned up after build", worktreeObserved)
	}

	// 验证主开发目录完好无损（index.ts 与 node_modules 依然完整保留在主目录）
	mainData, err := os.ReadFile(filepath.Join(repoDir, "src", "index.ts"))
	if err != nil || string(mainData) != "const x = 100;" {
		t.Errorf("main workspace file index.ts was modified or missing")
	}
	if _, err := os.Stat(filepath.Join(repoDir, "node_modules", "dummy", "lib.js")); err != nil {
		t.Errorf("main workspace node_modules was modified or missing")
	}
}
