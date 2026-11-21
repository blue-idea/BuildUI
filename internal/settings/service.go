package settings

import (
	"context"

	"buildui/internal/db"
	"buildui/internal/llm"
)

// SettingsService 系统全局配置服务
type SettingsService struct {
	repo *db.SettingsRepository
}

// NewSettingsService 实例化配置服务
func NewSettingsService(repo *db.SettingsRepository) *SettingsService {
	return &SettingsService{repo: repo}
}

// GetSettings 读取全部系统配置
func (s *SettingsService) GetSettings(ctx context.Context) (map[string]string, error) {
	return s.repo.GetAll(ctx)
}

// SaveSettings 批量持久化系统配置
func (s *SettingsService) SaveSettings(ctx context.Context, cfg map[string]string) error {
	return s.repo.SetMany(ctx, cfg)
}

// TestConnection 测试 LLM 端点连通性
func (s *SettingsService) TestConnection(ctx context.Context, baseURL, apiKey, model string) error {
	client := llm.NewOpenAIClient(baseURL, apiKey, model)
	return client.TestConnection(ctx)
}
