package settings_test

import (
	"testing"

	"buildui/internal/config"
	"buildui/internal/settings"
)

func TestShouldRememberWindowSize(t *testing.T) {
	tests := []struct {
		name     string
		settings map[string]string
		want     bool
	}{
		{
			name:     "默认开启（空配置）",
			settings: map[string]string{},
			want:     true,
		},
		{
			name:     "默认开启（nil 配置）",
			settings: nil,
			want:     true,
		},
		{
			name: "显式开启 true",
			settings: map[string]string{
				config.KeyRememberWindowSize: "true",
			},
			want: true,
		},
		{
			name: "显式开启 1",
			settings: map[string]string{
				config.KeyRememberWindowSize: "1",
			},
			want: true,
		},
		{
			name: "显式关闭 false",
			settings: map[string]string{
				config.KeyRememberWindowSize: "false",
			},
			want: false,
		},
		{
			name: "显式关闭 0",
			settings: map[string]string{
				config.KeyRememberWindowSize: "0",
			},
			want: false,
		},
		{
			name: "包含空白字符串的 false",
			settings: map[string]string{
				config.KeyRememberWindowSize: "  false  ",
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := settings.ShouldRememberWindowSize(tt.settings)
			if got != tt.want {
				t.Errorf("ShouldRememberWindowSize() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidateAndNormalizeWindowSize(t *testing.T) {
	tests := []struct {
		name       string
		width      int
		height     int
		wantWidth  int
		wantHeight int
		wantValid  bool
	}{
		{
			name:       "标准尺寸通过校验",
			width:      1440,
			height:     900,
			wantWidth:  1440,
			wantHeight: 900,
			wantValid:  true,
		},
		{
			name:       "最小临界值",
			width:      config.MinWindowWidth,
			height:     config.MinWindowHeight,
			wantWidth:  config.MinWindowWidth,
			wantHeight: config.MinWindowHeight,
			wantValid:  true,
		},
		{
			name:       "宽度低于最小值",
			width:      config.MinWindowWidth - 1,
			height:     800,
			wantWidth:  config.DefaultWindowWidth,
			wantHeight: config.DefaultWindowHeight,
			wantValid:  false,
		},
		{
			name:       "高度低于最小值",
			width:      1280,
			height:     config.MinWindowHeight - 1,
			wantWidth:  config.DefaultWindowWidth,
			wantHeight: config.DefaultWindowHeight,
			wantValid:  false,
		},
		{
			name:       "负数尺寸",
			width:      -100,
			height:     -100,
			wantWidth:  config.DefaultWindowWidth,
			wantHeight: config.DefaultWindowHeight,
			wantValid:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			size, valid := settings.ValidateAndNormalizeWindowSize(tt.width, tt.height)
			if valid != tt.wantValid {
				t.Errorf("ValidateAndNormalizeWindowSize() valid = %v, want %v", valid, tt.wantValid)
			}
			if size.Width != tt.wantWidth || size.Height != tt.wantHeight {
				t.Errorf("ValidateAndNormalizeWindowSize() size = (%v, %v), want (%v, %v)", size.Width, size.Height, tt.wantWidth, tt.wantHeight)
			}
		})
	}
}

func TestResolveStartupWindowSize(t *testing.T) {
	tests := []struct {
		name       string
		settings   map[string]string
		wantWidth  int
		wantHeight int
	}{
		{
			name:       "空配置返回默认尺寸",
			settings:   map[string]string{},
			wantWidth:  config.DefaultWindowWidth,
			wantHeight: config.DefaultWindowHeight,
		},
		{
			name: "开启记忆且包含合法配置时恢复记忆尺寸",
			settings: map[string]string{
				config.KeyRememberWindowSize: "true",
				config.KeyWindowWidth:        "1600",
				config.KeyWindowHeight:       "1024",
			},
			wantWidth:  1600,
			wantHeight: 1024,
		},
		{
			name: "默认开启记忆（未设置 remember key）且包含合法尺寸",
			settings: map[string]string{
				config.KeyWindowWidth:  "1920",
				config.KeyWindowHeight: "1080",
			},
			wantWidth:  1920,
			wantHeight: 1080,
		},
		{
			name: "关闭记忆开关时即使有历史尺寸也回退默认尺寸",
			settings: map[string]string{
				config.KeyRememberWindowSize: "false",
				config.KeyWindowWidth:        "1920",
				config.KeyWindowHeight:       "1080",
			},
			wantWidth:  config.DefaultWindowWidth,
			wantHeight: config.DefaultWindowHeight,
		},
		{
			name: "包含非数字损坏数据时回退默认尺寸",
			settings: map[string]string{
				config.KeyWindowWidth:  "invalid-width",
				config.KeyWindowHeight: "900",
			},
			wantWidth:  config.DefaultWindowWidth,
			wantHeight: config.DefaultWindowHeight,
		},
		{
			name: "包含低于安全边界尺寸时回退默认尺寸",
			settings: map[string]string{
				config.KeyWindowWidth:  "200",
				config.KeyWindowHeight: "150",
			},
			wantWidth:  config.DefaultWindowWidth,
			wantHeight: config.DefaultWindowHeight,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			size := settings.ResolveStartupWindowSize(tt.settings)
			if size.Width != tt.wantWidth || size.Height != tt.wantHeight {
				t.Errorf("ResolveStartupWindowSize() = (%v, %v), want (%v, %v)", size.Width, size.Height, tt.wantWidth, tt.wantHeight)
			}
		})
	}
}
