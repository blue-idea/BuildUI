package theme

import (
	"context"

	"buildui/internal/errs"
)

// ThemePreset 视觉主题预设元数据与颜色变量
type ThemePreset struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Primary     string `json:"primary"`
	Background  string `json:"background"`
	Surface     string `json:"surface"`
	Text        string `json:"text"`
	Border      string `json:"border"`
}

// GetDefaultThemePresets 返回系统支持的全部内置高质量主题配置
func GetDefaultThemePresets() []ThemePreset {
	return []ThemePreset{
		{
			ID:          "dark-slate",
			Name:        "Midnight Slate",
			Description: "Default sleek dark slate theme with royal blue accent",
			Primary:     "#3b82f6",
			Background:  "#020617",
			Surface:     "#0f172a",
			Text:        "#f8fafc",
			Border:      "#1e293b",
		},
		{
			ID:          "cyberpunk-neon",
			Name:        "Cyberpunk Neon",
			Description: "High-contrast neon glow theme with bright cyan & magenta accents",
			Primary:     "#00ffcc",
			Background:  "#0a0a12",
			Surface:     "#16162a",
			Text:        "#00ffcc",
			Border:      "#2a1b4e",
		},
		{
			ID:          "forest-emerald",
			Name:        "Forest Emerald",
			Description: "Calm organic theme featuring deep forest greens and emerald tones",
			Primary:     "#10b981",
			Background:  "#051b14",
			Surface:     "#0c2e22",
			Text:        "#ecfdf5",
			Border:      "#134e3a",
		},
		{
			ID:          "sunset-glow",
			Name:        "Sunset Glow",
			Description: "Warm twilight theme with amber, vibrant orange and dark chocolate tones",
			Primary:     "#f97316",
			Background:  "#1a0f0a",
			Surface:     "#2b1810",
			Text:        "#fff7ed",
			Border:      "#431407",
		},
		{
			ID:          "clean-light",
			Name:        "Minimalist Light",
			Description: "Clean, ultra-crisp daylight layout for productivity apps",
			Primary:     "#2563eb",
			Background:  "#ffffff",
			Surface:     "#f8fafc",
			Text:        "#0f172a",
			Border:      "#e2e8f0",
		},
	}
}

// ThemeRepository 抽象持久化存储接口
type ThemeRepository interface {
	UpdateTheme(ctx context.Context, appID int64, themeID string) error
}

// ThemeService 负责应用主题管理与持久化
type ThemeService struct {
	repo ThemeRepository
}

// NewThemeService 创建 ThemeService
func NewThemeService(repo ThemeRepository) *ThemeService {
	return &ThemeService{repo: repo}
}

// GetThemePresets 返回支持的主题集
func (s *ThemeService) GetThemePresets() []ThemePreset {
	return GetDefaultThemePresets()
}

// SetAppTheme 校验主题合法性并更新应用持久化记录
func (s *ThemeService) SetAppTheme(ctx context.Context, appID int64, themeID string) error {
	presets := GetDefaultThemePresets()
	valid := false
	for _, p := range presets {
		if p.ID == themeID {
			valid = true
			break
		}
	}
	if !valid {
		return errs.NewValidationError("unknown theme preset ID: "+themeID, nil)
	}

	if s.repo != nil {
		return s.repo.UpdateTheme(ctx, appID, themeID)
	}
	return nil
}
