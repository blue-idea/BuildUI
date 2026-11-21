package version

import "time"

// VersionDTO 暴露给前端的版本快照传输模型
type VersionDTO struct {
	ID         int64     `json:"id"`
	AppID      int64     `json:"appId"`
	ChatID     *int64    `json:"chatId,omitempty"`
	CommitHash string    `json:"commitHash"`
	Message    string    `json:"message"`
	CreatedAt  time.Time `json:"createdAt"`
}

// FileDiff 单个文件的代码变动差异
type FileDiff struct {
	Path      string   `json:"path"`
	Status    string   `json:"status"` // "added" | "modified" | "deleted"
	Hunks     []string `json:"hunks"`
	Additions int      `json:"additions"`
	Deletions int      `json:"deletions"`
}

// VersionDiffResult 版本差异对比响应
type VersionDiffResult struct {
	CommitHash string     `json:"commitHash"`
	Message    string     `json:"message"`
	Files      []FileDiff `json:"files"`
}

// EventEmitter 事件发送接口
type EventEmitter interface {
	Emit(eventName string, optionalData ...interface{})
}
