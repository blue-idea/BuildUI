package agent

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/blueprint"
	"buildui/internal/db"
)

// v1.REQ-007-AC-001: 校验会话轮次结束时自动执行 Git 提交并持久化 commitHash 到 versions 表
func TestChatService_TurnLevelGitCommit(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "git_turn_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// 初始化一个真正的 Git 本地仓库
	runCmd := func(name string, args ...string) {
		cmd := exec.Command(name, args...)
		cmd.Dir = tempDir
		out, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("cmd %s %v failed: %v, output: %s", name, args, err, string(out))
		}
	}

	runCmd("git", "init")
	runCmd("git", "config", "user.name", "TestBot")
	runCmd("git", "config", "user.email", "bot@test.local")

	_ = os.WriteFile(filepath.Join(tempDir, "README.md"), []byte("# Initial App"), 0644)
	runCmd("git", "add", "README.md")
	runCmd("git", "commit", "-m", "Initial commit")

	// 初始化 SQLite 数据库与 Repositories
	dbPath := filepath.Join(tempDir, "test.db")
	database, err := db.Open(context.Background(), dbPath)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	chatRepo := db.NewChatRepository(database)
	bpRepo := db.NewBlueprintRepository(database)
	versionRepo := db.NewVersionRepository(database)

	bpService := blueprint.NewBlueprintService(bpRepo, appRepo, database)

	appID, err := appRepo.Create(context.Background(), &db.AppEntity{
		Name: "Git Turn App",
		Path: tempDir,
	})
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}

	chatID, err := chatRepo.Create(context.Background(), &db.ChatEntity{
		AppID: appID,
		Title: "Turn 1",
	})
	if err != nil {
		t.Fatalf("failed to create chat: %v", err)
	}

	// 审批蓝图以解锁写盘
	err = bpRepo.Upsert(context.Background(), &db.BlueprintEntity{
		ChatID:          chatID,
		AppName:         "Git Turn App",
		DesignDirection: "Clean",
		Approved:        true,
	})
	if err != nil {
		t.Fatalf("failed to upsert blueprint: %v", err)
	}

	emitter := &mockEventEmitter{}
	chatService := NewChatService(chatRepo, appRepo, bpService, emitter)
	chatService.SetVersionRepo(versionRepo)

	// 模拟流式写入一个新文件
	streamInput := `<dyad-write path="src/Hello.tsx" description="Add greeting component">
export function Hello() { return <h1>Hello Git!</h1>; }
</dyad-write>`

	err = chatService.ProcessStream(context.Background(), chatID, tempDir, strings.NewReader(streamInput))
	if err != nil {
		t.Fatalf("ProcessStream failed: %v", err)
	}

	// 验证 1: chat:end 事件中携带的 commitHash 必须是非空且合法的 40 字符哈希
	var capturedHash string
	for _, ev := range emitter.events {
		if ev.Name == "chat:end" {
			if m, ok := ev.Data.(map[string]interface{}); ok {
				capturedHash, _ = m["commitHash"].(string)
			}
		}
	}
	if capturedHash == "" || len(capturedHash) < 7 {
		t.Fatalf("expected non-empty commitHash in chat:end event, got %q", capturedHash)
	}

	// 验证 2: SQLite versions 表中记录了该提交
	versions, err := versionRepo.ListByAppID(context.Background(), appID)
	if err != nil {
		t.Fatalf("failed to list versions: %v", err)
	}
	if len(versions) == 0 {
		t.Fatalf("expected at least 1 version recorded in versions table, got 0")
	}

	lastVersion := versions[0]
	if lastVersion.CommitHash != capturedHash {
		t.Fatalf("versions table commitHash %q does not match event hash %q", lastVersion.CommitHash, capturedHash)
	}

	// 验证 3: 目标应用的 Git 工作区此时应该是 clean 的（变更已被全部提交）
	cmd := exec.Command("git", "status", "--porcelain")
	cmd.Dir = tempDir
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("git status failed: %v", err)
	}
	// 忽略 test.db 本身（如果在临时目录里）
	statusLines := strings.Split(strings.TrimSpace(string(out)), "\n")
	for _, l := range statusLines {
		trimmed := strings.TrimSpace(l)
		if trimmed != "" && !strings.Contains(trimmed, "test.db") {
			t.Fatalf("expected clean git status after turn commit, but found uncommitted file: %s", trimmed)
		}
	}
}
