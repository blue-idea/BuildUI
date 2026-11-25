package runner

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"buildui/internal/config"
	"buildui/internal/errs"
	"buildui/internal/scaffold"
	"buildui/internal/workspace"
)

// ProcessLauncher 抽象子应用进程启动器，支持测试 Mock
type ProcessLauncher interface {
	Launch(ctx context.Context, appPath string, onOutput func(string), onExit func(error)) (int, error)
	Kill(pid int) error
}

// defaultProcessLauncher 默认启动器（执行 pnpm run dev）
type defaultProcessLauncher struct{}

func (d *defaultProcessLauncher) Launch(ctx context.Context, appPath string, onOutput func(string), onExit func(error)) (int, error) {
	native := workspace.UsesExpo(appPath)
	next := !native && workspace.UsesNext(appPath)
	var commands []string
	if native {
		commands = append(commands, "expo")
	} else if next {
		commands = append(commands, "next")
	}
	if err := workspace.EnsureProjectDependencies(ctx, appPath, commands...); err != nil {
		return 0, err
	}
	cmd := workspace.PnpmCommand(ctx, appPath, "run", "dev", "--host", "127.0.0.1")
	if next {
		cmd = workspace.PnpmCommand(ctx, appPath, "exec", "next", "dev", "--hostname", "127.0.0.1", "--port", "0")
	}
	cleanup := func() {}
	if native {
		previewConfig, removeAssets, err := scaffold.PrepareExpoPreview(appPath)
		if err != nil {
			return 0, err
		}
		cleanup = removeAssets
		cmd = workspace.ExpoCommand(ctx, appPath, "start", "--localhost", "--port", "0", "--max-workers", config.NativeMetroWorkers)
		cmd.Env = append(cmd.Env, config.NativeExpoMetroConfigEnv+"="+previewConfig)
	}
	started := false
	defer func() {
		if !started {
			cleanup()
		}
	}()

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return 0, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return 0, err
	}

	releaseProcess, err := startPreviewProcess(cmd)
	if err != nil {
		return 0, err
	}
	started = true

	readPipe := func(r io.Reader) {
		scanner := bufio.NewScanner(r)
		for scanner.Scan() {
			text := scanner.Text() + "\n"
			onOutput(text)
		}
	}

	go func() {
		var readers sync.WaitGroup
		for _, pipe := range []io.Reader{stdout, stderr} {
			readers.Go(func() { readPipe(pipe) })
		}
		readers.Wait()
		err := cmd.Wait()
		releaseProcess()
		cleanup()
		onExit(err)
	}()

	return cmd.Process.Pid, nil
}

func (d *defaultProcessLauncher) Kill(pid int) error {
	return killPreviewProcess(pid)
}

// activeInstance 活跃的应用运行实例
type activeInstance struct {
	appID      int64
	pid        int
	previewURL string
	cancel     context.CancelFunc
	readyChan  chan string
	done       chan struct{}
	err        error
	stopping   bool
	startupLog string
	conflict   bool
}

// AppRunner 负责本地开发服务器的监管、端口捕获与关停
type AppRunner struct {
	launcher ProcessLauncher
	emitter  EventEmitter
	mu       sync.RWMutex
	active   map[int64]*activeInstance
	closing  bool
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
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	r.mu.Lock()
	if r.closing {
		r.mu.Unlock()
		return nil, errs.NewPreconditionError("The preview runner is shutting down.", nil)
	}
	if inst, exists := r.active[appID]; exists {
		if inst.stopping {
			r.mu.Unlock()
			return nil, errs.NewPreconditionError("The preview is stopping.", nil)
		}
		result := &RunAppResponse{PreviewURL: inst.previewURL, ProcessID: inst.pid, Status: "running"}
		r.mu.Unlock()
		if result.PreviewURL == "" {
			return nil, errs.NewPreconditionError("The preview is already starting.", nil)
		}
		return result, nil
	}

	procCtx, cancel := context.WithCancel(context.Background())
	inst := &activeInstance{
		appID:     appID,
		cancel:    cancel,
		readyChan: make(chan string, 1),
		done:      make(chan struct{}),
	}
	r.active[appID] = inst
	r.mu.Unlock()

	next := workspace.UsesNext(appPath) && !workspace.UsesExpo(appPath)
	onOutput := func(text string) {
		r.HandleProcessOutput(appID, text)

		// 尝试从日志中提取 URL
		var url string
		if next {
			clean := ansiRegex.ReplaceAllString(text, "")
			r.mu.Lock()
			if inst.previewURL == "" {
				inst.startupLog = strings.TrimSpace(inst.startupLog + "\n" + clean)
				if len(inst.startupLog) > config.NextPreviewLogLimit {
					inst.startupLog = strings.ToValidUTF8(inst.startupLog[len(inst.startupLog)-config.NextPreviewLogLimit:], "")
				}
				inst.conflict = inst.conflict || isNextPreviewConflict(clean)
				if !inst.conflict {
					url = nextPreviewURL(clean)
				}
			}
			r.mu.Unlock()
		} else {
			url = ExtractPreviewURL(text)
		}
		if url != "" {
			select {
			case inst.readyChan <- url:
			default:
			}
		}
	}

	pid, err := r.launcher.Launch(procCtx, appPath, onOutput, func(err error) {
		r.mu.Lock()
		if r.active[appID] == inst {
			delete(r.active, appID)
			inst.err = err
			if inst.startupLog != "" {
				if err == nil {
					inst.err = fmt.Errorf("%s", inst.startupLog)
				} else {
					inst.err = fmt.Errorf("%w\n%s", err, inst.startupLog)
				}
			}
			close(inst.done)
		}
		r.mu.Unlock()
		cancel()
	})
	if err != nil {
		cancel()
		r.mu.Lock()
		if r.active[appID] == inst {
			delete(r.active, appID)
		}
		r.mu.Unlock()
		return nil, errs.NewExternalError(fmt.Sprintf("Failed to start preview: %v", err), err)
	}

	r.mu.Lock()
	inst.pid = pid
	if r.active[appID] != inst {
		stopped := inst.stopping
		r.mu.Unlock()
		if stopped {
			_ = r.launcher.Kill(pid)
		}
		return r.previewStartupExit(ctx, inst, appPath)
	}
	r.mu.Unlock()

	timeout := 15 * time.Second
	ready := inst.readyChan
	if next {
		timeout = config.NextPreviewTimeout
		probeCtx, stopProbe := context.WithCancel(ctx)
		defer stopProbe()
		ready = make(chan string, 1)
		go waitForNextPreview(probeCtx, inst.readyChan, ready)
	}
	timer := time.NewTimer(timeout)
	defer timer.Stop()

	// Next.js 的启动日志早于路由初始化，使用 HTTP 响应作为就绪信号。
	select {
	case url := <-ready:
		r.mu.Lock()
		if r.active[appID] != inst || inst.stopping {
			r.mu.Unlock()
			return r.previewStartupExit(ctx, inst, appPath)
		}
		inst.previewURL = url
		inst.startupLog = ""
		r.mu.Unlock()
		return &RunAppResponse{
			PreviewURL: url,
			ProcessID:  pid,
			Status:     "running",
		}, nil
	case <-inst.done:
		return r.previewStartupExit(ctx, inst, appPath)
	case <-timer.C:
		_ = r.StopApp(context.Background(), appID)
		if next {
			return nil, errs.NewExternalError("The Next.js preview did not respond before the startup timeout.", nil)
		}
		return nil, errs.NewExternalError("The preview did not report a listening URL.", nil)
	case <-ctx.Done():
		_ = r.StopApp(context.Background(), appID)
		return nil, ctx.Err()
	}
}

func (r *AppRunner) previewStartupExit(ctx context.Context, inst *activeInstance, appPath string) (*RunAppResponse, error) {
	r.mu.RLock()
	log, cause, stopped := inst.startupLog, inst.err, inst.stopping
	r.mu.RUnlock()
	if !stopped && cause != nil {
		if address := existingNextPreviewURL(appPath, log); address != "" {
			probeCtx, cancel := context.WithTimeout(ctx, config.NextPreviewReuseTimeout)
			defer cancel()
			if nextPreviewResponds(probeCtx, address) && ctx.Err() == nil {
				// 只返回可用地址，外部进程不纳入 StopApp 的管理范围。
				return &RunAppResponse{PreviewURL: address, Status: "running"}, nil
			}
			if ctx.Err() == nil {
				return nil, errs.NewExternalError(fmt.Sprintf("The existing Next.js server at %s is holding the project lock but did not respond. Stop that server, then start the preview again.", address), cause)
			}
		}
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return nil, errs.NewExternalError("The preview exited during startup.", cause)
}

// Shutdown 禁止新的预览启动，并关闭当前会话托管的进程。
func (r *AppRunner) Shutdown(ctx context.Context) error {
	r.mu.Lock()
	r.closing = true
	appIDs := make([]int64, 0, len(r.active))
	for appID := range r.active {
		appIDs = append(appIDs, appID)
	}
	r.mu.Unlock()

	var stopErrors []error
	for _, appID := range appIDs {
		if err := r.StopApp(ctx, appID); err != nil {
			stopErrors = append(stopErrors, err)
		}
	}
	return errors.Join(stopErrors...)
}

// StopApp 停止子应用开发服务器并释放端口
func (r *AppRunner) StopApp(ctx context.Context, appID int64) error {
	r.mu.Lock()
	inst, exists := r.active[appID]
	if !exists {
		r.mu.Unlock()
		return nil
	}
	if inst.stopping {
		r.mu.Unlock()
		return errs.NewPreconditionError("The preview is already stopping.", nil)
	}
	inst.stopping = true
	pid := inst.pid
	r.mu.Unlock()

	var killErr error
	if pid > 0 {
		killErr = r.launcher.Kill(pid)
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.active[appID] == inst {
		if killErr != nil {
			inst.stopping = false
			return errs.NewExternalError("Failed to stop the preview server.", killErr)
		}
		delete(r.active, appID)
		close(inst.done)
	}
	inst.cancel()
	return nil
}

// IsRunning 检查应用是否处于运行中
func (r *AppRunner) IsRunning(appID int64) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, exists := r.active[appID]
	return exists
}

// PreviewURL 返回实际运行的预览地址。
func (r *AppRunner) PreviewURL(appID int64) string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if inst := r.active[appID]; inst != nil {
		return inst.previewURL
	}
	return ""
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
