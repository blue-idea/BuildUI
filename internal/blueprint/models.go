package blueprint

import (
	"buildui/internal/errs"
)

// QuestionItem 单个澄清问题
type QuestionItem struct {
	ID       string   `json:"id"`
	Question string   `json:"question"`
	Type     string   `json:"type"` // "single_choice" | "multi_choice" | "text"
	Options  []string `json:"options,omitempty"`
}

// Questionnaire 需求澄清问卷
type Questionnaire struct {
	Questions []QuestionItem `json:"questions"`
}

// Validate 校验问卷是否符合 1~5 个问题的规格约束
func (q *Questionnaire) Validate() error {
	count := len(q.Questions)
	if count < 1 || count > 5 {
		return errs.NewValidationError("questionnaire must contain between 1 and 5 questions", nil)
	}
	for i, item := range q.Questions {
		if item.Question == "" {
			return errs.NewValidationError("question text cannot be empty", nil)
		}
		if item.ID == "" {
			q.Questions[i].ID = string(rune('1' + i))
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
