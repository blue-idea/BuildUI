package runner

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"

	"buildui/internal/errs"
)

// ProcessLauncher 抽象子应用进程启动器，支持测试 Mock
type ProcessLauncher interface {
	Launch(ctx context.Context, appPath string, onOutput func(string)) (int, error)
	Kill(pid int) error
}

// defaultProcessLauncher 默认启动器（执行 pnpm run dev）
type defaultProcessLauncher struct{}

func (d *defaultProcessLauncher) Launch(ctx context.Context, appPath string, onOutput func(string)) (int, error) {
	cmd := exec.CommandContext(ctx, "pnpm", "run", "dev")
	cmd.Dir = appPath

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return 0, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return 0, err
	}

	if err := cmd.Start(); err != nil {
		return 0, err
	}

	readPipe := func(r io.Reader) {
		scanner := bufio.NewScanner(r)
		for scanner.Scan() {
			text := scanner.Text() + "\n"
			onOutput(text)
		}
	}

	go readPipe(stdout)
	go readPipe(stderr)

	return cmd.Process.Pid, nil
}

func (d *defaultProcessLauncher) Kill(pid int) error {
	p, err := os.FindProcess(pid)
	if err != nil {
		return err
	}
	// 优先尝试杀灭进程树
	return p.Kill()
}

// activeInstance 活跃的应用运行实例
type activeInstance struct {
	appID      int64
	pid        int
	previewURL string
	cancel     context.CancelFunc
	readyChan  chan string
}

// AppRunner 负责本地开发服务器的监管、端口捕获与关停
type AppRunner struct {
	launcher ProcessLauncher
	emitter  EventEmitter
	mu       sync.RWMutex
	active   map[int64]*activeInstance
}

// NewAppRunner 创建 AppRunner 实例
func NewAppRunner(emitter EventEmitter) *AppRunner {
	return NewAppRunnerWithLauncher(&defaultProcessLauncher{}, emitter)
}

// NewAppRunnerWithLauncher 允许注入自定义启动器的构造函数
func NewAppRunnerWithLauncher(launcher ProcessLauncher, emitter EventEmitter) *AppRunner {
	return &AppRunner{
		launcher: launcher,
		emitter:  emitter,
		active:   make(map[int64]*activeInstance),
	}
}

// StartApp 启动子应用开发服务器并动态捕获预览 URL
func (r *AppRunner) StartApp(ctx context.Context, appID int64, appPath string) (*RunAppResponse, error) {
	r.mu.Lock()
	if inst, exists := r.active[appID]; exists && inst.previewURL != "" {
		r.mu.Unlock()
		return &RunAppResponse{
			PreviewURL: inst.previewURL,
			ProcessID:  inst.pid,
			Status:     "running",
		}, nil
	}

	procCtx, cancel := context.WithCancel(context.Background())
	inst := &activeInstance{
		appID:     appID,
		cancel:    cancel,
		readyChan: make(chan string, 1),
	}
	r.active[appID] = inst
	r.mu.Unlock()

	onOutput := func(text string) {
		r.HandleProcessOutput(appID, text)

		// 尝试从日志中提取 URL
		if url := ExtractPreviewURL(text); url != "" {
			select {
			case inst.readyChan <- url:
			default:
			}
		}
	}

	pid, err := r.launcher.Launch(procCtx, appPath, onOutput)
	if err != nil {
		cancel()
		r.mu.Lock()
		delete(r.active, appID)
		r.mu.Unlock()
		return nil, errs.NewInternalError(fmt.Sprintf("failed to spawn dev server for app %d", appID), err)
	}

	inst.pid = pid

	// 等待端口捕获就绪或超时
	select {
	case url := <-inst.readyChan:
		r.mu.Lock()
		inst.previewURL = url
		r.mu.Unlock()
		return &RunAppResponse{
			PreviewURL: url,
			ProcessID:  pid,
			Status:     "running",
		}, nil
	case <-time.After(15 * time.Second):
		// 超时但进程在跑，返回预估默认端口
		fallbackURL := "http://localhost:5173"
		r.mu.Lock()
		inst.previewURL = fallbackURL
		r.mu.Unlock()
		return &RunAppResponse{
			PreviewURL: fallbackURL,
			ProcessID:  pid,
			Status:     "running",
		}, nil
	case <-ctx.Done():
		_ = r.StopApp(context.Background(), appID)
		return nil, ctx.Err()
	}
}

// StopApp 停止子应用开发服务器并释放端口
func (r *AppRunner) StopApp(ctx context.Context, appID int64) error {
	r.mu.Lock()
	inst, exists := r.active[appID]
	if !exists {
		r.mu.Unlock()
		return nil
	}
	delete(r.active, appID)
	r.mu.Unlock()

	if inst.cancel != nil {
		inst.cancel()
	}

	if inst.pid > 0 {
		_ = r.launcher.Kill(inst.pid)
	}

	return nil
}

// IsRunning 检查应用是否处于运行中
func (r *AppRunner) IsRunning(appID int64) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, exists := r.active[appID]
	return exists
}

// HandleProcessOutput 检查并转发控制台异常日志
func (r *AppRunner) HandleProcessOutput(appID int64, text string) {
	lower := strings.ToLower(text)
	if strings.Contains(lower, "internal server error") || strings.Contains(lower, "[vite] error") || strings.Contains(lower, "syntax error") {
		if r.emitter != nil {
			r.emitter.Emit("preview:console", map[string]interface{}{
				"appId":   appID,
				"level":   "error",
				"message": strings.TrimSpace(text),
			})
		}
	}
}
