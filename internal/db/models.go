package db

import "time"

// AppEntity 应用数据模型
type AppEntity struct {
	ID                int64     `json:"id"`
	Name              string    `json:"name"`
	Path              string    `json:"path"`
	ThemeID           string    `json:"themeId"`
	NeedsAppBlueprint bool      `json:"needsAppBlueprint"`
	TestingEnabled    bool      `json:"testingEnabled"`
	InstallCommand    string    `json:"installCommand"`
	StartCommand      string    `json:"startCommand"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// ChatEntity 会话数据模型
type ChatEntity struct {
	ID        int64     `json:"id"`
	AppID     int64     `json:"appId"`
	Title     string    `json:"title"`
	ChatMode  string    `json:"chatMode"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// MessageEntity 消息数据模型
type MessageEntity struct {
	ID               int64     `json:"id"`
	ChatID           int64     `json:"chatId"`
	Role             string    `json:"role"`
	Content          string    `json:"content"`
	Model            string    `json:"model"`
	SourceCommitHash string    `json:"sourceCommitHash"`
	CommitHash       string    `json:"commitHash"`
	CreatedAt        time.Time `json:"createdAt"`
}

// BlueprintEntity 蓝图数据模型
type BlueprintEntity struct {
	ID              int64     `json:"id"`
	ChatID          int64     `json:"chatId"`
	AppName         string    `json:"appName"`
	DesignDirection string    `json:"designDirection"`
	PrimaryColor    string    `json:"primaryColor"`
	ThemeID         string    `json:"themeId"`
	VisualsJSON     string    `json:"visualsJson"`
	Approved        bool      `json:"approved"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// VersionEntity 版本快照审计模型
type VersionEntity struct {
	ID         int64     `json:"id"`
	AppID      int64     `json:"appId"`
	ChatID     *int64    `json:"chatId,omitempty"`
	CommitHash string    `json:"commitHash"`
	Message    string    `json:"message"`
	CreatedAt  time.Time `json:"createdAt"`
}
