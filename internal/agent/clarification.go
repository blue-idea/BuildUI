package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strings"

	"buildui/internal/blueprint"
	"buildui/internal/config"
	"buildui/internal/errs"
	"buildui/internal/llm"
)

const clarificationSystemPrompt = `Clarification Protocol
Before generating the application design blueprint, analyze the user's request and propose 3 to 4 concise clarification questions in option-card format.

Focus ONLY on product features and visual/UI design:
1. "features": Core user-facing features, page sections, or key interactive workflows to include.
2. "ui": Page structure (single-page vs multi-page layout), visual layout style, navigation structure, card/information density, or aesthetic tone. Always include one clear single_choice question letting the user choose between single-page and multi-page structure (from a user/UX perspective, without mentioning router libraries).
3. "palette": Color palette mood, contrast preference, or primary accent direction.

STRICT EXCLUSIONS:
- Do NOT ask about technical architecture, programming languages, frontend frameworks, state management, databases, APIs, hosting, or code implementation details.
- Keep questions friendly, visual, and product/design oriented so a designer or product owner can quickly pick options.
- Reply with ONLY one valid JSON object, without Markdown fences, matching this exact schema:
{
  "summary": "One short sentence explaining what these choices will refine",
  "questions": [
    {
      "id": "q1",
      "category": "features",
      "question": "Short clear question",
      "type": "multi_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "allowCustom": true
    }
  ]
}
Rules:
- Provide 3 to 4 questions in total.
- Allowed question types: "single_choice", "multi_choice", "text". Prefer "single_choice" or "multi_choice" with 3-4 concrete, mutually helpful options, and set "allowCustom": true so users can optionally add details.
- Do not write code, tool tags, or install dependencies.`

const stylePresetClarifyGuidance = `
Note: The user has already selected a Design System preset (see [Design System Style Prompt] in their request). Respect its established visual direction and primary color palette—do NOT propose conflicting color schemes; instead focus on feature scope, layout composition, or subtle UI emphasis preferences.`

const noStylePresetClarifyGuidance = `
Note: The user has NOT locked a specific Design System preset yet, so include at least one "palette" question offering 3-4 distinct, appealing color/mood options.`

var errInvalidClarification = errs.NewExternalError("The model did not return valid clarification questions. Try again.", nil)

func hasDesignSystemPrompt(prompt string, history []llm.ChatMessage) bool {
	return extractDesignSystemPrompt(prompt, history) != ""
}

// extractDesignSystemPrompt 从当前输入或历史会话中提取设计系统预设提示词，防止分步构建时丢失
func extractDesignSystemPrompt(prompt string, history []llm.ChatMessage) string {
	const marker = "[Design System Style Prompt]"
	extract := func(text string) string {
		idx := strings.Index(text, marker)
		if idx < 0 {
			return ""
		}
		rest := strings.TrimSpace(text[idx+len(marker):])
		if rest == "" {
			return ""
		}
		// 若后面紧跟其他段落标记（如 [Clarification Answers]），截断至其前
		if nextSection := strings.Index(rest, "\n["); nextSection >= 0 {
			rest = strings.TrimSpace(rest[:nextSection])
		}
		return rest
	}
	if found := extract(prompt); found != "" {
		return found
	}
	for _, msg := range history {
		if found := extract(msg.Content); found != "" {
			return found
		}
	}
	return ""
}

func buildClarificationPrompt(locale string, hasStylePreset bool, stackContext string) string {
	var sb strings.Builder
	sb.WriteString(clarificationSystemPrompt)
	if hasStylePreset {
		sb.WriteString(stylePresetClarifyGuidance)
	} else {
		sb.WriteString(noStylePresetClarifyGuidance)
	}
	if directive := llmLanguageDirective(locale); directive != "" {
		sb.WriteString("\n\n")
		sb.WriteString(directive)
	}
	if strings.TrimSpace(stackContext) != "" {
		sb.WriteString("\n\nTarget Platform Context (for UI/screen ergonomics only, do NOT ask technical stack questions):\n")
		sb.WriteString(strings.TrimSpace(stackContext))
	}
	return sb.String()
}

func decodeClarification(raw string) (*blueprint.Questionnaire, error) {
	trimmed := strings.TrimSpace(raw)
	start, end := strings.IndexByte(trimmed, '{'), strings.LastIndexByte(trimmed, '}')
	if start < 0 || end < start {
		return nil, errInvalidClarification
	}
	var q blueprint.Questionnaire
	if err := json.Unmarshal([]byte(trimmed[start:end+1]), &q); err != nil {
		return nil, errInvalidClarification
	}
	if err := q.Validate(); err != nil {
		return nil, errInvalidClarification
	}
	return &q, nil
}

// ensurePageStructureQuestion 确保澄清问卷中必定包含“单页 / 多页”页面结构单选卡片
func ensurePageStructureQuestion(q *blueprint.Questionnaire, locale string) {
	if q == nil {
		return
	}
	for _, item := range q.Questions {
		combined := strings.ToLower(item.Question + " " + strings.Join(item.Options, " "))
		hasSingle := strings.Contains(combined, "单页") || strings.Contains(combined, "single-page") || strings.Contains(combined, "single page")
		hasMulti := strings.Contains(combined, "多页") || strings.Contains(combined, "multi-page") || strings.Contains(combined, "multi page")
		if hasSingle && hasMulti {
			return
		}
	}

	pageQuestion := blueprint.QuestionItem{
		ID:          "page_structure",
		Category:    "ui",
		Question:    "How should the application pages be structured?",
		Type:        "single_choice",
		Options:     []string{"Single-page layout (all core sections on one page)", "Multi-page navigation (separate pages per section)"},
		AllowCustom: true,
	}
	if normalizeLocale(locale) == localeZH {
		pageQuestion.Question = "页面结构偏好哪种形式？"
		pageQuestion.Options = []string{"单页集中展示（一页内完成核心交互）", "多页分栏导航（按功能模块拆分独立页面）"}
	}

	// 保持 1~5 题合法上限：未满 5 题直接追加，已满 5 题时替换第 5 题
	if len(q.Questions) >= 5 {
		q.Questions[4] = pageQuestion
		return
	}
	q.Questions = append(q.Questions, pageQuestion)
}

func formatClarificationTurnSummary(q *blueprint.Questionnaire, locale string) string {
	var sb strings.Builder
	if strings.TrimSpace(q.Summary) != "" {
		sb.WriteString(q.Summary)
	} else if normalizeLocale(locale) == localeZH {
		sb.WriteString("请确认以下功能与界面设计偏好，以便为您生成更精准的应用架构蓝图：")
	} else {
		sb.WriteString("Please confirm the following feature and UI preferences to tailor your application blueprint:")
	}
	for idx, item := range q.Questions {
		sb.WriteString(fmt.Sprintf("\n%d. %s", idx+1, item.Question))
	}
	return sb.String()
}

func (s *ChatService) streamClarification(
	ctx context.Context,
	req StreamChatRequest,
	model string,
	client *llm.OpenAIClient,
	request llm.ChatRequest,
) error {
	request.MaxTokens = config.ModelClarificationMaxTokens
	s.emitProgress(req.ChatID, localizedProgress(req.Locale, "clarify_wait"))

	readOnce := func(r llm.ChatRequest) (*blueprint.Questionnaire, error) {
		var reply strings.Builder
		err := streamModelResponse(ctx, client, r, func(chunk string) error {
			reply.WriteString(chunk)
			return nil
		})
		if err != nil {
			return nil, err
		}
		return decodeClarification(reply.String())
	}

	questionnaire, err := readOnce(request)
	if errors.Is(err, llm.ErrOutputLimit) || errors.Is(err, errInvalidClarification) {
		s.emitProgress(req.ChatID, localizedProgress(req.Locale, "clarify_retry"))
		retryReq := request
		retryReq.Messages = slices.Clone(request.Messages)
		retryReq.DisableThinking = config.SupportsDeepSeekThinking(model)
		last := &retryReq.Messages[len(retryReq.Messages)-1]
		last.Content += "\nReturn strictly one valid JSON object with summary and 3 concise questions (features, ui, palette), without Markdown fences."
		questionnaire, err = readOnce(retryReq)
	}
	if err != nil {
		return err
	}

	ensurePageStructureQuestion(questionnaire, req.Locale)
	questionnaire.ChatID = req.ChatID
	payloadBytes, err := json.Marshal(questionnaire)
	if err != nil {
		return errs.NewInternalError("Failed to encode clarification questionnaire.", err)
	}
	if err := s.messageRepo.SaveClarification(ctx, req.ChatID, string(payloadBytes)); err != nil {
		return err
	}
	if s.emitter != nil {
		s.emitter.Emit("chat:clarification", *questionnaire)
	}

	// 将原始完整 Prompt（保留 [Design System Style Prompt] 等上下文）写入消息历史，助手消息记录精简摘要
	if err := s.saveTurn(ctx, req, model, formatClarificationTurnSummary(questionnaire, req.Locale)); err != nil {
		return err
	}
	s.emitEnd(req.ChatID, "")
	return nil
}
