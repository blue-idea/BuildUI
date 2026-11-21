package settings

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"buildui/internal/db"
	"buildui/internal/llm"
)

// ProviderPresets 各服务商离线预设默认模型清单
var ProviderPresets = map[string][]string{
	"openai":   {"gpt-4o", "gpt-4o-mini", "o1", "o3-mini"},
	"deepseek": {"deepseek-chat", "deepseek-reasoner"},
	"ollama":   {"qwen2.5-coder", "llama3.2", "deepseek-r1"},
	"custom":   {"gpt-4o", "deepseek-chat"},
}

// SettingsService 系统全局配置服务
type SettingsService struct {
	repo       *db.SettingsRepository
	httpClient *http.Client
}

// NewSettingsService 实例化配置服务
func NewSettingsService(repo *db.SettingsRepository) *SettingsService {
	return &SettingsService{
		repo: repo,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetSettings 读取全部系统配置
func (s *SettingsService) GetSettings(ctx context.Context) (map[string]string, error) {
	return s.repo.GetAll(ctx)
}

// SaveSettings 批量持久化系统配置
func (s *SettingsService) SaveSettings(ctx context.Context, cfg map[string]string) error {
	return s.repo.SetMany(ctx, cfg)
}

// GetActiveProvider 获取当前活跃的大模型服务商标识
func (s *SettingsService) GetActiveProvider(ctx context.Context) (string, error) {
	all, err := s.repo.GetAll(ctx)
	if err != nil {
		return "openai", err
	}
	if active := strings.TrimSpace(all["llm.active_provider"]); active != "" {
		return active, nil
	}
	if legacy := strings.TrimSpace(all["llm.provider"]); legacy != "" {
		return legacy, nil
	}
	return "openai", nil
}

// GetProviderCredentials 获取指定服务商的独立凭据（支持自动向后兼容回退）
func (s *SettingsService) GetProviderCredentials(ctx context.Context, provider string) (baseURL, apiKey, model string, err error) {
	all, err := s.repo.GetAll(ctx)
	if err != nil {
		return "", "", "", err
	}

	provider = strings.TrimSpace(provider)
	prefix := fmt.Sprintf("llm.providers.%s.", provider)

	baseURL = strings.TrimSpace(all[prefix+"base_url"])
	apiKey = strings.TrimSpace(all[prefix+"api_key"])
	model = strings.TrimSpace(all[prefix+"model"])

	// 向后兼容：若独立 Provider 无配置，但旧全局配置为该 Provider，则回退提取
	if baseURL == "" && apiKey == "" && model == "" {
		legacyProvider := strings.TrimSpace(all["llm.provider"])
		if legacyProvider == provider || provider == "" {
			baseURL = strings.TrimSpace(all["llm.base_url"])
			apiKey = strings.TrimSpace(all["llm.api_key"])
			model = strings.TrimSpace(all["llm.model"])
		}
	}

	return baseURL, apiKey, model, nil
}

// TestConnection 测试 LLM 端点连通性
func (s *SettingsService) TestConnection(ctx context.Context, baseURL, apiKey, model string) error {
	client := llm.NewOpenAIClient(baseURL, apiKey, model)
	return client.TestConnection(ctx)
}

// ListProviderModels 动态获取指定服务商的可用模型列表（失败时优雅降级至默认预设）
func (s *SettingsService) ListProviderModels(ctx context.Context, provider, baseURL, apiKey string) ([]string, error) {
	provider = strings.ToLower(strings.TrimSpace(provider))
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")

	getFallback := func() []string {
		if list, ok := ProviderPresets[provider]; ok && len(list) > 0 {
			res := make([]string, len(list))
			copy(res, list)
			return res
		}
		return []string{"gpt-4o", "deepseek-chat"}
	}

	if baseURL == "" {
		return getFallback(), nil
	}

	// 针对 Ollama 探测 /api/tags
	if provider == "ollama" {
		endpoint := baseURL + "/api/tags"
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
		if err != nil {
			return getFallback(), nil
		}

		resp, err := s.httpClient.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			if resp != nil {
				_ = resp.Body.Close()
			}
			return getFallback(), nil
		}
		defer resp.Body.Close()

		var payload struct {
			Models []struct {
				Name string `json:"name"`
			} `json:"models"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil || len(payload.Models) == 0 {
			return getFallback(), nil
		}

		models := make([]string, 0, len(payload.Models))
		for _, m := range payload.Models {
			if name := strings.TrimSpace(m.Name); name != "" {
				models = append(models, name)
			}
		}
		if len(models) == 0 {
			return getFallback(), nil
		}
		return models, nil
	}

	// 针对 OpenAI / DeepSeek / Custom 探测 /models
	endpoint := baseURL + "/models"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return getFallback(), nil
	}
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			_ = resp.Body.Close()
		}
		return getFallback(), nil
	}
	defer resp.Body.Close()

	var payload struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil || len(payload.Data) == 0 {
		return getFallback(), nil
	}

	models := make([]string, 0, len(payload.Data))
	for _, item := range payload.Data {
		if id := strings.TrimSpace(item.ID); id != "" {
			models = append(models, id)
		}
	}
	if len(models) == 0 {
		return getFallback(), nil
	}
	return models, nil
}
