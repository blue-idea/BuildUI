package inspector

import (
	"context"
	"path/filepath"
	"strings"
)

// ResolveComponentRequest 元素逆向解析请求
type ResolveComponentRequest struct {
	AppID       int64  `json:"appId"`
	TagName     string `json:"tagName"`
	ClassName   string `json:"className"`
	ElementText string `json:"elementText"`
	DataPath    string `json:"dataPath"`
}

// ResolvedComponentResponse 组件逆向解析结果
type ResolvedComponentResponse struct {
	ComponentPath   string `json:"componentPath"`
	ComponentName   string `json:"componentName"`
	SuggestedPrompt string `json:"suggestedPrompt"`
}

// InspectorService 负责从运行时 DOM 元素推导工程源代码组件
type InspectorService struct{}

func NewInspectorService() *InspectorService {
	return &InspectorService{}
}

func (s *InspectorService) ResolveComponent(ctx context.Context, req ResolveComponentRequest) (*ResolvedComponentResponse, error) {
	tag := strings.ToLower(strings.TrimSpace(req.TagName))
	classes := strings.ToLower(req.ClassName)
	dataPath := strings.TrimSpace(req.DataPath)

	var compPath string
	if dataPath != "" {
		compPath = dataPath
	} else if tag == "nav" || strings.Contains(classes, "navbar") || strings.Contains(classes, "navigation") {
		compPath = "src/components/Navbar.tsx"
	} else if tag == "header" || strings.Contains(classes, "header") {
		compPath = "src/components/Header.tsx"
	} else if tag == "footer" || strings.Contains(classes, "footer") {
		compPath = "src/components/Footer.tsx"
	} else if tag == "button" || strings.Contains(classes, "btn") {
		compPath = "src/components/ui/button.tsx"
	} else if tag == "aside" || strings.Contains(classes, "sidebar") {
		compPath = "src/components/Sidebar.tsx"
	} else if strings.Contains(classes, "card") {
		compPath = "src/components/ui/card.tsx"
	} else if tag == "table" || strings.Contains(classes, "table") {
		compPath = "src/components/ui/table.tsx"
	} else {
		compPath = "src/App.tsx"
	}

	base := filepath.Base(compPath)
	compName := strings.TrimSuffix(base, filepath.Ext(base))

	return &ResolvedComponentResponse{
		ComponentPath:   compPath,
		ComponentName:   compName,
		SuggestedPrompt: "@" + compPath + ": ",
	}, nil
}
