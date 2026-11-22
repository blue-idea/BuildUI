package config

import "strings"

const (
	ModelBlueprintMaxTokens     = 4096
	ModelBuildMaxTokens         = 12288
	ModelDeepSeekBuildMaxTokens = 32768
	ModelBuildContinuations     = 4
	ModelBuildPlanMaxTokens     = 2048
	ModelBuildMaxSteps          = 8
	ModelBuildMaxFilesPerStep   = 6
)

// SupportsDeepSeekThinking 识别官方模型名和中转服务常用的 V4 模型别名。
func SupportsDeepSeekThinking(model string) bool {
	model = strings.ToLower(strings.TrimSpace(model))
	model = model[strings.LastIndexByte(model, '/')+1:]
	return model == "deepseek-flash" || strings.HasPrefix(model, "deepseek-v4")
}
