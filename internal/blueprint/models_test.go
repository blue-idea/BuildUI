package blueprint

import "testing"

func TestQuestionnaire_Validate(t *testing.T) {
	q := Questionnaire{
		ChatID:  7,
		Summary: "Refine UI and color preferences",
		Questions: []QuestionItem{
			{
				Category:    "features",
				Question:    "Which core modules do you need?",
				Type:        "multi_choice",
				Options:     []string{"Dashboard", "Reports", "Settings"},
				AllowCustom: true,
			},
			{
				ID:       "q-palette",
				Category: "palette",
				Question: "Which visual tone fits best?",
				Type:     "single_choice",
				Options:  []string{"Warm Amber"}, // 少于 2 个选项应退化为 text 或拒绝
			},
		},
	}

	if err := q.Validate(); err != nil {
		t.Fatalf("unexpected validation error: %v", err)
	}
	if q.Questions[0].ID == "" {
		t.Fatal("expected auto-assigned question ID")
	}
	if q.Questions[1].Type != "text" {
		t.Fatalf("expected single-option choice to degrade to text, got %q", q.Questions[1].Type)
	}

	empty := Questionnaire{}
	if err := empty.Validate(); err == nil {
		t.Fatal("expected error for empty questionnaire")
	}
}
