package agent

import (
	"context"
	"io"
	"strings"

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
	chatRepo  *db.ChatRepository
	appRepo   *db.AppRepository
	bpService *blueprint.BlueprintService
	emitter   EventEmitter
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

// ProcessStream 处理流式 Token 输入、状态机解析、门禁校验及文件落盘
func (s *ChatService) ProcessStream(ctx context.Context, chatID int64, appPath string, r io.Reader) error {
	// 初始门禁预检：若有写盘意图，蓝图必须预先审批
	fileWriter := NewFileWriter(appPath)
	depManager := NewDependencyManager(appPath, nil)

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

	if s.emitter != nil {
		s.emitter.Emit("chat:end", map[string]interface{}{
			"chatId":     chatID,
			"commitHash": "",
		})
	}

	return nil
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
