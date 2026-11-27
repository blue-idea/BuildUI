package agent

import (
	"fmt"
	"strings"
)

const (
	localeZH = "zh"
	localeEN = "en"
)

// normalizeLocale 将前端语言设置规范化为 "zh"、"en" 或 ""（未指定时保持旧兼容行为）
func normalizeLocale(raw string) string {
	trimmed := strings.ToLower(strings.TrimSpace(raw))
	if trimmed == "" {
		return ""
	}
	if strings.HasPrefix(trimmed, "zh") {
		return localeZH
	}
	return localeEN
}

// llmLanguageDirective 生成注入大模型系统提示词的严格语言约束
func llmLanguageDirective(locale string) string {
	switch normalizeLocale(locale) {
	case localeZH:
		return "IMPORTANT: Respond strictly in Simplified Chinese (简体中文) for all user-facing text, questions, options, descriptions, UI labels, and explanations. Keep JSON keys, code identifiers, and file paths in English."
	case localeEN:
		return "IMPORTANT: Respond strictly in English for all user-facing text, questions, options, descriptions, UI labels, and explanations."
	default:
		return ""
	}
}

// localizedProgress 根据当前界面语言返回统一的阶段进度文案
func localizedProgress(locale, key string, args ...any) string {
	isZH := normalizeLocale(locale) == localeZH
	switch key {
	case "clarify_wait":
		if isZH {
			return "正在分析需求并生成澄清选项卡片…"
		}
		return "Analyzing your request and preparing clarification options…"
	case "clarify_retry":
		if isZH {
			return "正在重新整理澄清问题格式…"
		}
		return "Retrying clarification options…"
	case "blueprint_wait":
		if isZH {
			return "正在生成应用架构设计蓝图…"
		}
		return "Waiting for the model to generate a blueprint…"
	case "blueprint_retry":
		if isZH {
			return "蓝图内容超出长度限制，正在精简重试…"
		}
		return "The blueprint reached the model's output limit. Retrying with a shorter blueprint…"
	case "model_wait":
		if isZH {
			return "正在等待模型响应…"
		}
		return "Waiting for the model to respond…"
	case "code_wait":
		if isZH {
			return "正在等待模型生成代码…"
		}
		return "Waiting for the model to generate code…"
	case "plan_steps":
		if isZH {
			return "正在规划构建步骤…"
		}
		return "Planning build steps…"
	case "plan_retry":
		if isZH {
			return "正在重新规划构建步骤…"
		}
		return "Retrying the build plan…"
	case "build_step_wait":
		if isZH {
			return fmt.Sprintf("构建步骤 %d/%d — %s · 正在生成代码…", args...)
		}
		return fmt.Sprintf("Build step %d/%d — %s · Waiting for model output…", args...)
	case "build_step_saved":
		if isZH {
			return fmt.Sprintf("%s · 已保存 %d/%d 个文件", args...)
		}
		return fmt.Sprintf("%s · %d/%d files saved", args...)
	case "build_step_label":
		if isZH {
			return fmt.Sprintf("构建步骤 %d/%d — %s", args...)
		}
		return fmt.Sprintf("Build step %d/%d — %s", args...)
	case "continue_unfinished":
		if isZH {
			return fmt.Sprintf("正在继续补全未完成的工具调用 (%d/%d)…", args...)
		}
		return fmt.Sprintf("Continuing generation to complete unfinished tools (%d/%d)…", args...)
	case "continue_output_limit":
		if isZH {
			return fmt.Sprintf("模型输出达到上限，正在继续生成 (%d/%d)…", args...)
		}
		return fmt.Sprintf("Continuing generation after the model's output limit (%d/%d)…", args...)
	case "saving_changes":
		if isZH {
			return "正在保存生成的代码变更…"
		}
		return "Saving generated changes…"
	case "using_plugin":
		if isZH {
			return fmt.Sprintf("正在调用插件工具：%s", args...)
		}
		return fmt.Sprintf("Using plugin tool: %s", args...)
	default:
		return key
	}
}
