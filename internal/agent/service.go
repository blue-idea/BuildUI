package agent

import (
	"context"
	"errors"
	"io"
	"strings"
	"sync"
	"time"

	"buildui/internal/blueprint"
	"buildui/internal/db"
	"buildui/internal/errs"
	"buildui/internal/plugins"
	"buildui/internal/sysutil"
	"buildui/internal/verification/tsc"
)

// EventEmitter 运行时事件推送抽象
type EventEmitter interface {
	Emit(eventName string, optionalData ...interface{})
}

// ChatService 负责智能会话流与代码增量生成的协调服务
type ChatService struct {
	chatRepo       *db.ChatRepository
	appRepo        *db.AppRepository
	bpService      *blueprint.BlueprintService
	versionRepo    *db.VersionRepository
	settingsRepo   *db.SettingsRepository
	messageRepo    *db.MessageRepository
	buildProblems  *tsc.ProblemsService
	plugins        *plugins.Service
	emitter        EventEmitter
	activeSessions sync.Map
	activeBuilds   sync.Map
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

func (s *ChatService) SetBuildProblems(problems *tsc.ProblemsService) {
	s.buildProblems = problems
}

func (s *ChatService) SetPlugins(plugins *plugins.Service) {
	s.plugins = plugins
}

func (s *ChatService) lockProjectBuild(appID int64) (func(), error) {
	if _, busy := s.activeBuilds.LoadOrStore(appID, struct{}{}); busy {
		return nil, errs.NewPreconditionError("A build or preview check is already running for this project.", nil)
	}
	return func() { s.activeBuilds.Delete(appID) }, nil
}

// SetModelRepositories 连接用户配置和会话历史。
func (s *ChatService) SetModelRepositories(settings *db.SettingsRepository, messages *db.MessageRepository) {
	s.settingsRepo = settings
	s.messageRepo = messages
}

func (s *ChatService) runSession(ctx context.Context, chatID int64, run func(context.Context) error) error {
	streamCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	if _, busy := s.activeSessions.LoadOrStore(chatID, cancel); busy {
		return errs.NewPreconditionError("A request is already running for this chat.", nil)
	}
	defer s.activeSessions.Delete(chatID)
	err := run(streamCtx)
	if errors.Is(err, context.Canceled) {
		if s.emitter != nil {
			s.emitter.Emit("chat:cancelled", map[string]any{"chatId": chatID})
		}
	}
	return err
}

// ProcessStream 处理流式 Token 输入、状态机解析、门禁校验及文件落盘
func (s *ChatService) ProcessStream(ctx context.Context, chatID int64, appPath string, r io.Reader) error {
	return s.runSession(ctx, chatID, func(streamCtx context.Context) error {
		if closer, ok := r.(io.Closer); ok {
			stop := context.AfterFunc(streamCtx, func() { _ = closer.Close() })
			defer stop()
		}
		result, err := s.processChunks(streamCtx, chatID, appPath, func(feed func(string) error) error {
			buf := make([]byte, 1024)
			for {
				if err := streamCtx.Err(); err != nil {
					return err
				}
				n, err := r.Read(buf)
				if n > 0 {
					if feedErr := feed(string(buf[:n])); feedErr != nil {
						return feedErr
					}
				}
				if err == io.EOF {
					return nil
				}
				if err != nil {
					if streamCtx.Err() != nil {
						return streamCtx.Err()
					}
					return errs.NewInternalError("Failed to read stream.", err)
				}
			}
		}, nil, nil)
		if err != nil {
			return err
		}
		s.finishBuild(streamCtx, chatID, appPath, result.changed)
		return nil
	})
}

type buildResult struct {
	files       []string
	packages    []string
	interrupted unfinishedTool
	changed     bool
}

func (s *ChatService) processChunks(streamCtx context.Context, chatID int64, appPath string, read func(func(string) error) error, onText func(string), onChange func(string) error) (buildResult, error) {
	fileWriter := NewFileWriter(appPath)
	depManager := NewDependencyManager(appPath, nil)
	var result buildResult

	var visible strings.Builder
	flushVisible := func() {
		if visible.Len() != 0 {
			if s.emitter != nil {
				s.emitter.Emit("chat:chunk", map[string]any{"chatId": chatID, "chunk": visible.String()})
			}
			if onText != nil {
				onText(visible.String())
			}
		}
		visible.Reset()
	}
	parser := NewXMLStreamParser(ParserCallbacks{
		OnChunk: func(chunk string) {
			visible.WriteString(chunk)
		},
		OnToolStart: func(event ToolStartEvent) {
			flushVisible()
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
			if err := s.bpService.EnsureWriteAllowed(streamCtx, chatID); err != nil {
				if s.emitter != nil {
					s.emitter.Emit("chat:error", map[string]interface{}{
						"chatId":  chatID,
						"kind":    "Precondition",
						"message": err.Error(),
					})
				}
				return err
			}
			if err := fileWriter.WriteFile(path, content); err != nil {
				return err
			}
			result.files = append(result.files, path)
			result.changed = true
			if onChange != nil {
				return onChange(path)
			}
			return nil
		},
		OnAddDependency: func(packages []string) error {
			if err := s.bpService.EnsureWriteAllowed(streamCtx, chatID); err != nil {
				return err
			}
			if err := depManager.EnsureDependencies(streamCtx, packages); err != nil {
				return err
			}
			result.packages = append(result.packages, packages...)
			result.changed = true
			if onChange != nil {
				return onChange("")
			}
			return nil
		},
	})

	readErr := read(func(chunk string) error {
		err := parser.Feed(chunk)
		flushVisible()
		return err
	})
	result.interrupted = parser.unfinished()
	if readErr != nil {
		parser.abort(readErr)
		return result, readErr
	}

	if err := streamCtx.Err(); err != nil {
		parser.abort(err)
		return result, err
	}

	if err := parser.Flush(); err != nil {
		return result, err
	}
	flushVisible()

	return result, nil
}

func (s *ChatService) finishBuild(ctx context.Context, chatID int64, appPath string, changed bool) {
	s.emitEnd(chatID, s.commitBuild(ctx, chatID, appPath, changed))
}

func (s *ChatService) commitBuild(ctx context.Context, chatID int64, appPath string, changed bool) string {
	if changed {
		return s.commitWorkspaceChanges(ctx, chatID, appPath)
	}
	return ""
}

func (s *ChatService) emitProgress(chatID int64, message string) {
	if s.emitter != nil {
		s.emitter.Emit("chat:progress", map[string]any{"chatId": chatID, "message": message})
	}
}

func (s *ChatService) emitEnd(chatID int64, commitHash string) {
	if s.emitter != nil {
		s.emitter.Emit("chat:end", map[string]interface{}{
			"chatId":     chatID,
			"commitHash": commitHash,
		})
	}

}

// commitWorkspaceChanges 自动将轮次改动执行 Git 提交并持久化至 versions 表
func (s *ChatService) commitWorkspaceChanges(ctx context.Context, chatID int64, appPath string) string {
	statusCmd := sysutil.CommandContext(ctx, "git", "status", "--porcelain")
	statusCmd.Dir = appPath
	statusOut, err := statusCmd.Output()
	if err != nil || len(strings.TrimSpace(string(statusOut))) == 0 {
		revCmd := sysutil.CommandContext(ctx, "git", "rev-parse", "HEAD")
		revCmd.Dir = appPath
		if out, err := revCmd.Output(); err == nil {
			return strings.TrimSpace(string(out))
		}
		return ""
	}

	addCmd := sysutil.CommandContext(ctx, "git", "add", "-A")
	addCmd.Dir = appPath
	_ = addCmd.Run()

	commitCmd := sysutil.CommandContext(ctx, "git", "commit", "-m", "Turn update from Agent: automated commit")
	commitCmd.Dir = appPath
	_ = commitCmd.Run()

	revCmd := sysutil.CommandContext(ctx, "git", "rev-parse", "HEAD")
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

// CancelChat 中止正在进行的流式生成
func (s *ChatService) CancelChat(chatID int64) error {
	val, ok := s.activeSessions.Load(chatID)
	if !ok {
		return nil
	}
	if cancel, ok := val.(context.CancelFunc); ok {
		cancel()
	}
	return nil
}

// StreamChatRequest 请求体
type StreamChatRequest struct {
	ChatID           int64                      `json:"chatId"`
	Prompt           string                     `json:"prompt"`
	Attachments      []string                   `json:"attachments"`
	Mode             string                     `json:"mode"`
	Provider         string                     `json:"provider,omitempty"`
	Model            string                     `json:"model,omitempty"`
	Resume           bool                       `json:"resume,omitempty"`
	PluginAutomation *plugins.ProjectAutomation `json:"pluginAutomation,omitempty"`
}
