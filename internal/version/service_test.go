package version_test

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"buildui/internal/db"
	"buildui/internal/version"
)

// initGitRepo 辅助初始化本地真实测试仓库并配置 user
func initGitRepo(t *testing.T, dir string) {
	cmds := [][]string{
		{"git", "init"},
		{"git", "config", "user.name", "TestAgent"},
		{"git", "config", "user.email", "test@example.com"},
	}
	for _, args := range cmds {
		cmd := exec.Command(args[0], args[1:]...)
		cmd.Dir = dir
		if out, err := cmd.CombinedOutput(); err != nil {
			t.Fatalf("failed to run %v: %s, err: %v", args, string(out), err)
		}
	}
}

func commitFile(t *testing.T, dir, filename, content, message string) string {
	filePath := filepath.Join(dir, filename)
	_ = os.MkdirAll(filepath.Dir(filePath), 0755)
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		t.Fatalf("failed to write file: %v", err)
	}

	cmdAdd := exec.Command("git", "add", "-A")
	cmdAdd.Dir = dir
	if out, err := cmdAdd.CombinedOutput(); err != nil {
		t.Fatalf("git add failed: %s, err: %v", string(out), err)
	}

	cmdCommit := exec.Command("git", "commit", "-m", message)
	cmdCommit.Dir = dir
	if out, err := cmdCommit.CombinedOutput(); err != nil {
		t.Fatalf("git commit failed: %s, err: %v", string(out), err)
	}

	cmdRev := exec.Command("git", "rev-parse", "HEAD")
	cmdRev.Dir = dir
	out, err := cmdRev.Output()
	if err != nil {
		t.Fatalf("git rev-parse failed: %v", err)
	}
	return strings.TrimSpace(string(out))
}

func TestVersionService_ListAndDiffAndRollback(t *testing.T) {
	appDir := t.TempDir()
	initGitRepo(t, appDir)

	dbDir := t.TempDir()
	dbPath := filepath.Join(dbDir, "test.db")
	database, err := db.Open(context.Background(), dbPath)
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	versionRepo := db.NewVersionRepository(database)
	svc := version.NewVersionService(versionRepo, appRepo, nil)
	ctx := context.Background()

	// 创建应用实体
	appID, err := appRepo.Create(ctx, &db.AppEntity{
		Name: "TestApp",
		Path: appDir,
	})
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}

	// 1. 创建提交 1
	c1 := commitFile(t, appDir, "src/App.tsx", "export const App = () => <div>Version 1</div>;\n", "feat: initial App")
	_, err = versionRepo.Create(ctx, &db.VersionEntity{
		AppID:      appID,
		CommitHash: c1,
		Message:    "feat: initial App",
		CreatedAt:  time.Now(),
	})
	if err != nil {
		t.Fatalf("failed to create version record: %v", err)
	}

	// 2. 创建提交 2 (修改 App.tsx，新增 utils.ts)
	_ = commitFile(t, appDir, "src/App.tsx", "export const App = () => <div>Version 2</div>;\n", "feat: update App")
	_ = commitFile(t, appDir, "src/utils.ts", "export const add = (a: number, b: number) => a + b;\n", "feat: add utils")
	c3 := commitFile(t, appDir, "src/App.tsx", "export const App = () => <div>Version 3 Final</div>;\n", "feat: version 3")

	_, err = versionRepo.Create(ctx, &db.VersionEntity{
		AppID:      appID,
		CommitHash: c3,
		Message:    "feat: version 3",
		CreatedAt:  time.Now(),
	})
	if err != nil {
		t.Fatalf("failed to create version record 3: %v", err)
	}

	// 3. 测试 ListVersions
	versions, err := svc.ListVersions(ctx, appID)
	if err != nil {
		t.Fatalf("ListVersions failed: %v", err)
	}
	if len(versions) != 2 {
		t.Fatalf("expected 2 versions, got %d", len(versions))
	}
	if versions[0].CommitHash != c3 {
		t.Fatalf("expected latest version first, got %s", versions[0].CommitHash)
	}

	// 4. 测试 GetVersionDiff (对 c3 进行 Diff 解析)
	diffResult, err := svc.GetVersionDiff(ctx, appID, c3)
	if err != nil {
		t.Fatalf("GetVersionDiff failed: %v", err)
	}
	if diffResult.CommitHash != c3 {
		t.Fatalf("expected commit hash %s, got %s", c3, diffResult.CommitHash)
	}
	if len(diffResult.Files) == 0 {
		t.Fatalf("expected file diffs, got 0")
	}
	foundApp := false
	for _, f := range diffResult.Files {
		if f.Path == "src/App.tsx" {
			foundApp = true
			if f.Additions == 0 {
				t.Fatalf("expected additions > 0 for src/App.tsx")
			}
			break
		}
	}
	if !foundApp {
		t.Fatalf("expected src/App.tsx in diff files, got %v", diffResult.Files)
	}

	// 5. 测试 RollbackVersion (回滚到 c1)
	err = svc.RollbackVersion(ctx, appID, c1)
	if err != nil {
		t.Fatalf("RollbackVersion failed: %v", err)
	}

	// 验证磁盘上的 App.tsx 内容恢复为 Version 1
	appBytes, err := os.ReadFile(filepath.Join(appDir, "src", "App.tsx"))
	if err != nil {
		t.Fatalf("failed to read App.tsx: %v", err)
	}
	if !strings.Contains(string(appBytes), "Version 1") {
		t.Fatalf("expected App.tsx to contain 'Version 1', got:\n%s", string(appBytes))
	}

	// 验证 versions 审计表新增了回滚记录
	afterRollbackVersions, err := svc.ListVersions(ctx, appID)
	if err != nil {
		t.Fatalf("ListVersions after rollback failed: %v", err)
	}
	if len(afterRollbackVersions) != 3 {
		t.Fatalf("expected 3 versions after rollback, got %d", len(afterRollbackVersions))
	}
	if !strings.Contains(afterRollbackVersions[0].Message, "Rollback") {
		t.Fatalf("expected latest version message to mention Rollback, got: %s", afterRollbackVersions[0].Message)
	}
}
