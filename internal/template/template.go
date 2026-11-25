package template

import (
	"context"
	"os"
	"path/filepath"

	"buildui/internal/errs"
	"buildui/internal/scaffold"
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
	Source      string   `json:"source"`
	Platform    string   `json:"platform"`
	GitHubURL   string   `json:"githubUrl,omitempty"`
	ImageURL    string   `json:"imageUrl,omitempty"`
}

// 示例代码叠加到完整的 React 脚手架中。
var exampleSources = map[string]string{
	"saas-dashboard": `import React from 'react';

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
	"portfolio": `import React from 'react';

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
	"landing-page": `import React from 'react';

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
	"storefront": `import React from 'react';

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

// InstantiateTemplate ?????????????????
func (s *TemplateService) InstantiateTemplate(ctx context.Context, req CreateFromTemplateRequest) (*TemplateInstanceResult, error) {
	if req.DestPath == "" {
		return nil, errs.NewValidationError("destination path cannot be empty", nil)
	}
	entry, err := s.Lookup(ctx, req.TemplateID)
	if err != nil {
		return nil, err
	}
	if entry.Source == SourceCommunity {
		err = s.copyCommunity(ctx, entry, req.DestPath)
	} else {
		err = scaffold.ExtractForTemplate(req.DestPath, req.AppName, entry.ID)
		if code, ok := exampleSources[entry.ID]; ok && err == nil {
			err = os.WriteFile(filepath.Join(req.DestPath, "src", "App.tsx"), []byte(code), 0644)
		}
	}
	if err != nil {
		return nil, err
	}
	return &TemplateInstanceResult{
		TemplateID: entry.ID,
		AppName:    req.AppName,
		DestPath:   req.DestPath,
		ThemeID:    entry.ThemeID,
	}, nil
}
