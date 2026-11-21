package agent

import (
	"context"
	"io"
	"os/exec"
	"strings"
	"time"

	"buildui/internal/blueprint"
	"buildui/internal/db"
	"buildui/internal/errs"
)

// EventEmitter 运行时事件推送抽象
type EventEmitter interface {
	Emit(eventName string, optionalData ...interface{})
}

// ChatService 负责智能会话流与代码增量生成的协调服务
type ChatService struct {
	chatRepo    *db.ChatRepository
	appRepo     *db.AppRepository
	bpService   *blueprint.BlueprintService
	versionRepo *db.VersionRepository
	emitter     EventEmitter
}

// NewChatService 创建会话服务
func NewChatService(chatRepo *db.ChatRepository, appRepo *db.AppRepository, bpService *blueprint.BlueprintService, emitter EventEmitter) *ChatService {
	return &ChatService{
		chatRepo:  chatRepo,
		appRepo:   appRepo,
		bpService: bpService,
		emitter:   emitter,
	}
}

// SetEmitter 设置事件分发器
func (s *ChatService) SetEmitter(emitter EventEmitter) {
	s.emitter = emitter
}

// SetVersionRepo 设置版本审计数据访问仓库
func (s *ChatService) SetVersionRepo(r *db.VersionRepository) {
	s.versionRepo = r
}

// ProcessStream 处理流式 Token 输入、状态机解析、门禁校验及文件落盘
func (s *ChatService) ProcessStream(ctx context.Context, chatID int64, appPath string, r io.Reader) error {
	// 初始门禁预检：若有写盘意图，蓝图必须预先审批
	fileWriter := NewFileWriter(appPath)
	depManager := NewDependencyManager(appPath, nil)
	filesWrittenCount := 0

	parser := NewXMLStreamParser(ParserCallbacks{
		OnChunk: func(chunk string) {
			if s.emitter != nil {
				s.emitter.Emit("chat:chunk", map[string]interface{}{
					"chatId": chatID,
					"chunk":  chunk,
				})
			}
		},
		OnToolStart: func(event ToolStartEvent) {
			if s.emitter != nil {
				s.emitter.Emit("chat:tool-start", map[string]interface{}{
					"chatId": chatID,
					"tool":   event.Tool,
					"path":   event.Path,
				})
			}
		},
		OnToolEnd: func(event ToolEndEvent) {
			if s.emitter != nil {
				s.emitter.Emit("chat:tool-end", map[string]interface{}{
					"chatId":  chatID,
					"tool":    event.Tool,
					"success": event.Success,
				})
			}
		},
		OnWriteFile: func(path, description, content string) error {
			// 写盘门禁拦截：检查蓝图是否已审批
			if err := s.bpService.EnsureWriteAllowed(ctx, chatID); err != nil {
				if s.emitter != nil {
					s.emitter.Emit("chat:error", map[string]interface{}{
						"chatId":  chatID,
						"kind":    "Precondition",
						"message": err.Error(),
					})
				}
				return err
			}
			filesWrittenCount++
			return fileWriter.WriteFile(path, content)
		},
		OnAddDependency: func(packages []string) error {
			return depManager.EnsureDependencies(ctx, packages)
		},
	})

	buf := make([]byte, 1024)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		n, err := r.Read(buf)
		if n > 0 {
			feedErr := parser.Feed(string(buf[:n]))
			if feedErr != nil {
				return feedErr
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return errs.NewInternalError("failed to read stream", err)
		}
	}

	if err := parser.Flush(); err != nil {
		return err
	}

	commitHash := ""
	if filesWrittenCount > 0 {
		commitHash = s.commitWorkspaceChanges(ctx, chatID, appPath)
	}

	if s.emitter != nil {
		s.emitter.Emit("chat:end", map[string]interface{}{
			"chatId":     chatID,
			"commitHash": commitHash,
		})
	}

	return nil
}

// commitWorkspaceChanges 自动将轮次改动执行 Git 提交并持久化至 versions 表
func (s *ChatService) commitWorkspaceChanges(ctx context.Context, chatID int64, appPath string) string {
	statusCmd := exec.CommandContext(ctx, "git", "status", "--porcelain")
	statusCmd.Dir = appPath
	statusOut, err := statusCmd.Output()
	if err != nil || len(strings.TrimSpace(string(statusOut))) == 0 {
		revCmd := exec.CommandContext(ctx, "git", "rev-parse", "HEAD")
		revCmd.Dir = appPath
		if out, err := revCmd.Output(); err == nil {
			return strings.TrimSpace(string(out))
		}
		return ""
	}

	addCmd := exec.CommandContext(ctx, "git", "add", "-A")
	addCmd.Dir = appPath
	_ = addCmd.Run()

	commitCmd := exec.CommandContext(ctx, "git", "commit", "-m", "Turn update from Agent: automated commit")
	commitCmd.Dir = appPath
	_ = commitCmd.Run()

	revCmd := exec.CommandContext(ctx, "git", "rev-parse", "HEAD")
	revCmd.Dir = appPath
	hashBytes, err := revCmd.Output()
	if err != nil {
		return ""
	}
	commitHash := strings.TrimSpace(string(hashBytes))

	if s.versionRepo != nil && commitHash != "" {
		var appID int64
		if s.chatRepo != nil {
			if chat, err := s.chatRepo.GetByID(ctx, chatID); err == nil && chat != nil {
				appID = chat.AppID
			}
		}
		_, _ = s.versionRepo.Create(ctx, &db.VersionEntity{
			AppID:      appID,
			ChatID:     &chatID,
			CommitHash: commitHash,
			Message:    "Turn update from Agent: automated commit",
			CreatedAt:  time.Now(),
		})
	}

	return commitHash
}

// StreamChatRequest 请求体
type StreamChatRequest struct {
	ChatID      int64    `json:"chatId"`
	Prompt      string   `json:"prompt"`
	Attachments []string `json:"attachments"`
}

// StreamChat 暴露给前端的流式调用方法
func (s *ChatService) StreamChat(ctx context.Context, req StreamChatRequest) error {
	if req.ChatID <= 0 {
		return errs.NewValidationError("chat id must be positive", nil)
	}

	chat, err := s.chatRepo.GetByID(ctx, req.ChatID)
	if err != nil {
		return err
	}

	app, err := s.appRepo.GetByID(ctx, chat.AppID)
	if err != nil {
		return err
	}

	// 模拟流式大模型生成或透传
	// 实际落地中对接 LLM API（如 Claude / Gemini），此处使用 PromptAssembler 与 ProcessStream 组合
	assembler := NewPromptAssembler()
	sysPrompt := assembler.AssembleSystemPrompt()
	_ = sysPrompt

	// 本地预览与测试时，直接通过 ProcessStream 驱动
	return s.ProcessStream(ctx, req.ChatID, app.Path, strings.NewReader(req.Prompt))
}
