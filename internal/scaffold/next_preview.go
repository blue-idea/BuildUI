package scaffold

import "embed"

//go:embed next-preview/*.cjs
var nextPreviewFS embed.FS

// PrepareNextPreview 将预览适配器放入项目的构建缓存，正常的 Next.js 配置和源码继续由项目维护。
func PrepareNextPreview(project string) (string, func(), error) {
	return preparePreviewAssets(project, ".next", nextPreviewFS, "next-preview/preload.cjs", "next-preview/tagger.cjs")
}
