package tsc

// CheckTypeScriptRequest 请求参数
type CheckTypeScriptRequest struct {
	AppID int64    `json:"appId"`
	Paths []string `json:"paths"`
}

// DiagnosticItem 单条编译诊断项
type DiagnosticItem struct {
	File     string `json:"file"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Message  string `json:"message"`
	Severity string `json:"severity"` // "error" | "warning"
	Tool     string `json:"tool,omitempty"`
}

// ProblemsResponse 响应结构
type ProblemsResponse struct {
	HasErrors bool             `json:"hasErrors"`
	Problems  []DiagnosticItem `json:"problems"`
}

// RemediationResult 自愈循环执行结果
type RemediationResult struct {
	Success       bool             `json:"success"`
	Attempts      int              `json:"attempts"`
	FinalProblems []DiagnosticItem `json:"finalProblems"`
}
