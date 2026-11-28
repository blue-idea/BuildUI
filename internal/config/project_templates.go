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
	NextPreviewTimeout       = 90 * time.Second
	NextPreviewReuseTimeout  = 15 * time.Second
	NextPreviewRetryInterval = 200 * time.Millisecond
	NextPreviewLogLimit      = 4 << 10
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

const (
	ReactPreviewInspectorPath  = "src/preview-inspector.js"
	ReactPreviewInspectorAsset = ReactTemplateDir + "/" + ReactPreviewInspectorPath
)

// LegacyReactPreviewInspectorHashes 记录随旧版脚手架分发的检查脚本校验值（LF）。
var LegacyReactPreviewInspectorHashes = []string{
	"c2c6ea15d18aedb5bddef011634937a576cd9ff32f9a7a90c81e2f01b08bad1b",
	"3634a29cd4136dec49ffb8355c7629a8d81fbd06cfcf7c09037e1f1cf78d2d12",
	"e3851a10f930e672a348522b1b32868f3bceebb1955e57410ca31ce44b30dbe6",
}
