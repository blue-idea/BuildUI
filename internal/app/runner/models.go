package runner

// RunAppRequest 启动应用请求
type RunAppRequest struct {
	AppID   int64 `json:"appId"`
	Restart bool  `json:"restart,omitempty"`
}

// RunAppResponse 启动应用响应
type RunAppResponse struct {
	PreviewURL        string `json:"previewUrl"`
	ProcessID         int    `json:"processId"`
	Status            string `json:"status"` // "running" | "error"
	TypeScriptChecked bool   `json:"typeScriptChecked,omitempty"`
	RepairAttempts    int    `json:"repairAttempts,omitempty"`
}

// StopAppRequest 停止应用请求
type StopAppRequest struct {
	AppID int64 `json:"appId"`
}

// ConsoleEvent 前端预览控制台错误事件
type ConsoleEvent struct {
	AppID   int64  `json:"appId"`
	Level   string `json:"level"` // "error" | "warn" | "info"
	Message string `json:"message"`
}

// EventEmitter 运行时事件推送接口
type EventEmitter interface {
	Emit(eventName string, optionalData ...interface{})
}
