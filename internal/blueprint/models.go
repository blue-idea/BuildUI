package blueprint

import (
	"fmt"
	"strings"

	"buildui/internal/errs"
)

// QuestionItem 单个澄清问题
type QuestionItem struct {
	ID          string   `json:"id"`
	Category    string   `json:"category,omitempty"` // "features" | "ui" | "palette"
	Question    string   `json:"question"`
	Type        string   `json:"type"` // "single_choice" | "multi_choice" | "text"
	Options     []string `json:"options,omitempty"`
	AllowCustom bool     `json:"allowCustom,omitempty"`
	Placeholder string   `json:"placeholder,omitempty"`
	Required    bool     `json:"required,omitempty"`
}

// Questionnaire 需求澄清问卷
type Questionnaire struct {
	ChatID    int64          `json:"chatId,omitempty"`
	Summary   string         `json:"summary,omitempty"`
	Questions []QuestionItem `json:"questions"`
}

// Validate 校验并规范化澄清问卷（1~5 个问题）
func (q *Questionnaire) Validate() error {
	count := len(q.Questions)
	if count < 1 || count > 5 {
		return errs.NewValidationError("questionnaire must contain between 1 and 5 questions", nil)
	}
	q.Summary = strings.TrimSpace(q.Summary)
	for i := range q.Questions {
		item := &q.Questions[i]
		item.Question = strings.TrimSpace(item.Question)
		if item.Question == "" {
			return errs.NewValidationError("question text cannot be empty", nil)
		}
		if strings.TrimSpace(item.ID) == "" {
			item.ID = fmt.Sprintf("q%d", i+1)
		}
		item.Category = strings.TrimSpace(item.Category)
		if item.Type == "" {
			if len(item.Options) >= 2 {
				item.Type = "single_choice"
			} else {
				item.Type = "text"
			}
		}
		if item.Type == "single_choice" || item.Type == "multi_choice" {
			cleaned := make([]string, 0, len(item.Options))
			for _, opt := range item.Options {
				if trimmed := strings.TrimSpace(opt); trimmed != "" {
					cleaned = append(cleaned, trimmed)
				}
			}
			item.Options = cleaned
			// 若选项不足 2 个，自动降级为文本输入，防止生成无效选项卡片
			if len(item.Options) < 2 {
				item.Type = "text"
				item.Options = nil
			}
		}
	}
	return nil
}

// VisualItem 蓝图视觉元素定义
type VisualItem struct {
	ID          string `json:"id"`
	Type        string `json:"type"` // "logo" | "photo" | "illustration" | "icon" | "background"
	Description string `json:"description"`
	Prompt      string `json:"prompt"`
}

// BlueprintDTO 传输对象
type BlueprintDTO struct {
	ChatID          int64        `json:"chatId"`
	AppName         string       `json:"appName"`
	DesignDirection string       `json:"designDirection"`
	PrimaryColor    string       `json:"primaryColor"`
	ThemeID         string       `json:"themeId"`
	Visuals         []VisualItem `json:"visuals"`
	Approved        bool         `json:"approved"`
}
