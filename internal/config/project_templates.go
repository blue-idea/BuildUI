package config

import (
	_ "embed"
	"time"
)

//go:embed project_templates.json
var ProjectTemplateCatalog []byte

const (
	NextTemplateID           = "next"
	NextTemplateDir          = "next-template"
	NextTemplatePackageName  = "buildui-next-app"
	NextTemplatePage         = "src/app/page.tsx"
	NextTemplateLayout       = "src/app/layout.tsx"
	NextTemplateConfig       = "next.config.ts"
	NextBuildTimeout         = 3 * time.Minute
	NextBuildDiagnosticLimit = 8 << 10
	ReactTemplateDir         = "template"
	ReactTemplatePackageName = "vite_react_shadcn_ts"
	NativeTemplateDir        = "native-template"
	CommunityTemplateURL     = "https://api.dyad.sh/v1/templates"
	CommunityTemplateTimeout = 8 * time.Second
	CommunityTemplateLimit   = 2 << 20
	CommunityTemplateCache   = "templates"
	TemplateGitTimeout       = 15 * time.Second
	TemplateArchiveBaseURL   = "https://codeload.github.com/"
	TemplateArchiveTimeout   = 30 * time.Second
	TemplateArchiveMaxSize   = 32 << 20
	TemplateArchiveMaxFiles  = 20_000
	TemplateArchiveMaxUnpack = 128 << 20
)
