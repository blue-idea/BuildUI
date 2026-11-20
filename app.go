package main

import (
	"context"
	"path/filepath"
	"os"

	"buildui/internal/db"
)

// App Wails 应用主结构体
type App struct {
	ctx      context.Context
	db       *db.DB
	appRepo  *db.AppRepository
	chatRepo *db.ChatRepository
}

// NewApp 创建 App 实例
func NewApp() *App {
	return &App{}
}

// startup 在应用启动时调用
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// 确定数据存储目录（默认在用户配置目录下的 buildui 目录）
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "."
	}
	appDataDir := filepath.Join(configDir, "buildui")
	_ = os.MkdirAll(appDataDir, 0755)

	dbPath := filepath.Join(appDataDir, "buildui.db")
	database, err := db.Open(ctx, dbPath)
	if err == nil {
		a.db = database
		a.appRepo = db.NewAppRepository(database)
		a.chatRepo = db.NewChatRepository(database)
	}
}

// shutdown 在应用退出时调用
func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		_ = a.db.Close()
	}
}
