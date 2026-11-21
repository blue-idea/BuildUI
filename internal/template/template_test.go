package template

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestTemplate_DefaultTemplates(t *testing.T) {
	templates := GetDefaultTemplates()
	if len(templates) < 4 {
		t.Fatalf("expected at least 4 default templates, got %d", len(templates))
	}

	foundDashboard := false
	foundPortfolio := false
	for _, tmpl := range templates {
		if tmpl.ID == "saas-dashboard" {
			foundDashboard = true
		}
		if tmpl.ID == "portfolio" {
			foundPortfolio = true
		}
		if tmpl.Name == "" || tmpl.ThemeID == "" || len(tmpl.Tags) == 0 {
			t.Errorf("template %s has invalid metadata", tmpl.ID)
		}
	}

	if !foundDashboard || !foundPortfolio {
		t.Errorf("expected saas-dashboard and portfolio templates to exist")
	}
}

func TestTemplateService_InstantiateTemplate(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "template_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	svc := NewTemplateService()

	// 场景 1: 合法模版实例化
	req := CreateFromTemplateRequest{
		TemplateID: "saas-dashboard",
		AppName:    "My Analytics",
		DestPath:   tempDir,
	}

	res, err := svc.InstantiateTemplate(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error instantiating template: %v", err)
	}
	if res.TemplateID != "saas-dashboard" || res.ThemeID != "dark-slate" {
		t.Errorf("expected saas-dashboard template with dark-slate theme, got %+v", res)
	}

	// 校验 App.tsx 是否生成
	appTsxPath := filepath.Join(tempDir, "src", "App.tsx")
	if _, err := os.Stat(appTsxPath); os.IsNotExist(err) {
		t.Errorf("expected %s to exist, but not found", appTsxPath)
	}

	// 场景 2: 未知模版 ID 应返回验证错误
	badReq := CreateFromTemplateRequest{
		TemplateID: "unknown-tmpl-123",
		AppName:    "Bad App",
		DestPath:   tempDir,
	}
	_, err = svc.InstantiateTemplate(context.Background(), badReq)
	if err == nil {
		t.Fatalf("expected error when instantiating unknown template, got nil")
	}
}
