package inspector_test

import (
	"context"
	"testing"

	"buildui/internal/inspector"
)

// v3.REQ-002-AC-001: 逆向解析 DOM 元素至组件源码路径与生成建议 Prompt
func TestInspectorService_ResolveComponent(t *testing.T) {
	ctx := context.Background()
	svc := inspector.NewInspectorService()

	// 1. 带明确 DataPath 属性
	req1 := inspector.ResolveComponentRequest{
		AppID:       1,
		TagName:     "div",
		ClassName:   "dashboard-stats",
		ElementText: "Total Revenue",
		DataPath:    "src/components/StatsCard.tsx",
	}
	res1, err := svc.ResolveComponent(ctx, req1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res1.ComponentPath != "src/components/StatsCard.tsx" {
		t.Errorf("expected 'src/components/StatsCard.tsx', got '%s'", res1.ComponentPath)
	}
	if res1.ComponentName != "StatsCard" {
		t.Errorf("expected 'StatsCard', got '%s'", res1.ComponentName)
	}
	if res1.SuggestedPrompt != "@src/components/StatsCard.tsx: " {
		t.Errorf("expected '@src/components/StatsCard.tsx: ', got '%s'", res1.SuggestedPrompt)
	}

	// 2. 语义化标签 nav 推导为 Navbar.tsx
	req2 := inspector.ResolveComponentRequest{
		AppID:     1,
		TagName:   "nav",
		ClassName: "flex items-center space-x-4",
	}
	res2, err := svc.ResolveComponent(ctx, req2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res2.ComponentPath != "src/components/Navbar.tsx" {
		t.Errorf("expected 'src/components/Navbar.tsx', got '%s'", res2.ComponentPath)
	}

	// 3. 语义化标签 button 推导为 ui/button.tsx
	req3 := inspector.ResolveComponentRequest{
		AppID:     1,
		TagName:   "button",
		ClassName: "bg-blue-600 text-white",
	}
	res3, err := svc.ResolveComponent(ctx, req3)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res3.ComponentPath != "src/components/ui/button.tsx" {
		t.Errorf("expected 'src/components/ui/button.tsx', got '%s'", res3.ComponentPath)
	}

	// 4. 普通元素 fallback 推导为 src/App.tsx
	req4 := inspector.ResolveComponentRequest{
		AppID:     1,
		TagName:   "main",
		ClassName: "container mx-auto",
	}
	res4, err := svc.ResolveComponent(ctx, req4)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res4.ComponentPath != "src/App.tsx" {
		t.Errorf("expected fallback 'src/App.tsx', got '%s'", res4.ComponentPath)
	}
}
