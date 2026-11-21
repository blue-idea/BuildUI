package template

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"buildui/internal/errs"
)

// AppTemplate 应用预置模版元数据
type AppTemplate struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	Icon        string   `json:"icon"`
	ThemeID     string   `json:"themeId"`
	StarterCode string   `json:"starterCode"`
}

// GetDefaultTemplates 返回系统内置的高质量应用模版清单
func GetDefaultTemplates() []AppTemplate {
	return []AppTemplate{
		{
			ID:          "saas-dashboard",
			Name:        "SaaS Analytics Dashboard",
			Description: "Production-ready metrics dashboard featuring revenue KPI cards, active users chart, and tabular data view.",
			Category:    "Analytics",
			Tags:        []string{"Charts", "KPIs", "Metrics", "Tailwind"},
			Icon:        "📊",
			ThemeID:     "dark-slate",
			StarterCode: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SaaS Analytics Dashboard</h1>
          <p className="text-xs text-slate-400">Real-time performance metrics and revenue tracking</p>
        </div>
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400 border border-blue-500/20">Live</span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs text-slate-400">Monthly Recurring Revenue</div>
          <div className="mt-2 text-2xl font-bold text-white">$48,250</div>
          <div className="mt-1 text-[11px] text-emerald-400">↑ 12.5% vs last month</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs text-slate-400">Active Subscribers</div>
          <div className="mt-2 text-2xl font-bold text-white">2,840</div>
          <div className="mt-1 text-[11px] text-emerald-400">↑ 8.2% new users</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs text-slate-400">Churn Rate</div>
          <div className="mt-2 text-2xl font-bold text-white">1.12%</div>
          <div className="mt-1 text-[11px] text-emerald-400">↓ 0.3% improvement</div>
        </div>
      </div>
    </div>
  );
}`,
		},
		{
			ID:          "portfolio",
			Name:        "Creative Developer Portfolio",
			Description: "High-contrast personal portfolio layout with glowing neon bio hero, project showcase cards, and skills matrix.",
			Category:    "Personal",
			Tags:        []string{"Cyberpunk", "Hero", "Projects", "Showcase"},
			Icon:        "⚡",
			ThemeID:     "cyberpunk-neon",
			StarterCode: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-4">
          <div className="inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400 border border-cyan-500/30">Available for hire</div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Creative Engineer & System Architect</h1>
          <p className="text-slate-400 text-sm max-w-xl">Building reactive desktop apps, distributed systems, and delightful developer experiences.</p>
        </header>
      </div>
    </div>
  );
}`,
		},
		{
			ID:          "landing-page",
			Name:        "Modern Product Landing Page",
			Description: "Clean, ultra-crisp landing page featuring sticky navigation, hero with CTA, feature grid, and pricing cards.",
			Category:    "Marketing",
			Tags:        []string{"Landing", "SaaS", "Pricing", "Conversion"},
			Icon:        "🚀",
			ThemeID:     "clean-light",
			StarterCode: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 p-8">
      <div className="max-w-5xl mx-auto text-center space-y-6 pt-12">
        <h1 className="text-5xl font-extrabold tracking-tight">Ship modern web apps 10x faster</h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">AI-native visual generation, AST-accurate code rewriting, and instant sandbox previews.</p>
        <div>
          <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500">Get Started Free</button>
        </div>
      </div>
    </div>
  );
}`,
		},
		{
			ID:          "storefront",
			Name:        "E-Commerce Showcase",
			Description: "Warm twilight storefront with product cards, category filters, interactive cart badge, and checkout drawer.",
			Category:    "Commerce",
			Tags:        []string{"Shop", "Catalog", "Cart", "Checkout"},
			Icon:        "🛍️",
			ThemeID:     "sunset-glow",
			StarterCode: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#1a0f0a] text-slate-100 p-6">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-stone-800">
        <h1 className="text-2xl font-bold text-orange-400">Craft Artisan Store</h1>
        <div className="rounded bg-orange-950 px-3 py-1 text-xs text-orange-300 border border-orange-800/40">Cart (0)</div>
      </header>
    </div>
  );
}`,
		},
	}
}

// CreateFromTemplateRequest 从模版创建应用请求结构
type CreateFromTemplateRequest struct {
	TemplateID string `json:"templateId"`
	AppName    string `json:"appName"`
	DestPath   string `json:"destPath"`
}

// TemplateInstanceResult 模版实例化返回结果
type TemplateInstanceResult struct {
	TemplateID string `json:"templateId"`
	AppName    string `json:"appName"`
	DestPath   string `json:"destPath"`
	ThemeID    string `json:"themeId"`
}

// TemplateService 负责应用模版管理与实例化生成
type TemplateService struct{}

// NewTemplateService 创建模版服务
func NewTemplateService() *TemplateService {
	return &TemplateService{}
}

// GetTemplates 获取全部内置模版
func (s *TemplateService) GetTemplates() []AppTemplate {
	return GetDefaultTemplates()
}

// InstantiateTemplate 根据模版在目标目录生成基础工程文件
func (s *TemplateService) InstantiateTemplate(ctx context.Context, req CreateFromTemplateRequest) (*TemplateInstanceResult, error) {
	if req.TemplateID == "" {
		return nil, errs.NewValidationError("template ID cannot be empty", nil)
	}
	if req.DestPath == "" {
		return nil, errs.NewValidationError("destination path cannot be empty", nil)
	}

	templates := GetDefaultTemplates()
	var selected *AppTemplate
	for _, t := range templates {
		if t.ID == req.TemplateID {
			selected = &t
			break
		}
	}
	if selected == nil {
		return nil, errs.NewValidationError(fmt.Sprintf("unknown template ID: %s", req.TemplateID), nil)
	}

	// 创建目标工作空间目录及 src 目录
	srcDir := filepath.Join(req.DestPath, "src")
	if err := os.MkdirAll(srcDir, 0755); err != nil {
		return nil, errs.NewInternalError("failed to create template workspace directory", err)
	}

	// 写入 App.tsx
	appTsxPath := filepath.Join(srcDir, "App.tsx")
	starterCode := selected.StarterCode
	if starterCode == "" {
		starterCode = "// Blank starter\nexport default function App() { return <div>App</div>; }"
	}
	if err := os.WriteFile(appTsxPath, []byte(starterCode), 0644); err != nil {
		return nil, errs.NewInternalError("failed to write template App.tsx", err)
	}

	// 写入基础 package.json
	pkgJSON := fmt.Sprintf(`{
  "name": "%s",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.5"
  }
}`, req.AppName)
	pkgPath := filepath.Join(req.DestPath, "package.json")
	if err := os.WriteFile(pkgPath, []byte(pkgJSON), 0644); err != nil {
		return nil, errs.NewInternalError("failed to write template package.json", err)
	}

	return &TemplateInstanceResult{
		TemplateID: selected.ID,
		AppName:    req.AppName,
		DestPath:   req.DestPath,
		ThemeID:    selected.ThemeID,
	}, nil
}
