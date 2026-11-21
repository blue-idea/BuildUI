package theme

import (
	"context"
	"testing"
)

type mockThemeRepo struct {
	savedThemeID string
	savedAppID   int64
}

func (m *mockThemeRepo) UpdateTheme(ctx context.Context, appID int64, themeID string) error {
	m.savedAppID = appID
	m.savedThemeID = themeID
	return nil
}

func TestThemePresets_DefaultPresets(t *testing.T) {
	presets := GetDefaultThemePresets()
	if len(presets) < 4 {
		t.Fatalf("expected at least 4 default presets, got %d", len(presets))
	}

	foundDark := false
	foundCyberpunk := false
	for _, p := range presets {
		if p.ID == "dark-slate" {
			foundDark = true
		}
		if p.ID == "cyberpunk-neon" {
			foundCyberpunk = true
		}
		if p.Primary == "" || p.Background == "" {
			t.Errorf("preset %s missing required color tokens", p.ID)
		}
	}

	if !foundDark || !foundCyberpunk {
		t.Errorf("expected dark-slate and cyberpunk-neon presets to exist")
	}
}

func TestThemeService_SetAppTheme(t *testing.T) {
	mockRepo := &mockThemeRepo{}
	svc := NewThemeService(mockRepo)

	// 测试设置合法主题
	err := svc.SetAppTheme(context.Background(), 1, "cyberpunk-neon")
	if err != nil {
		t.Fatalf("unexpected error setting valid theme: %v", err)
	}
	if mockRepo.savedThemeID != "cyberpunk-neon" || mockRepo.savedAppID != 1 {
		t.Errorf("expected app 1 with theme cyberpunk-neon, got app %d with theme %s", mockRepo.savedAppID, mockRepo.savedThemeID)
	}

	// 测试设置非法主题应报错
	err = svc.SetAppTheme(context.Background(), 1, "non-existent-theme-xyz")
	if err == nil {
		t.Fatalf("expected error when setting non-existent theme, got nil")
	}
}
