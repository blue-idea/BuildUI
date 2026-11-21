package blueprint_test

import (
	"context"
	"testing"

	"buildui/internal/blueprint"
	"buildui/internal/db"
	"buildui/internal/errs"
)

// v1.REQ-002-AC-001: 需求澄清问卷 1~5 个问题校验
func TestBlueprintService_ValidateQuestionnaire(t *testing.T) {
	// 空问卷或超过5个问题必须被拒绝
	emptyQ := blueprint.Questionnaire{Questions: []blueprint.QuestionItem{}}
	if err := emptyQ.Validate(); err == nil {
		t.Fatal("expected error for empty questionnaire, got nil")
	}

	tooManyQ := blueprint.Questionnaire{
		Questions: make([]blueprint.QuestionItem, 6),
	}
	if err := tooManyQ.Validate(); err == nil {
		t.Fatal("expected error for questionnaire with >5 questions, got nil")
	}

	validQ := blueprint.Questionnaire{
		Questions: []blueprint.QuestionItem{
			{
				ID:       "q1",
				Question: "What is the primary target audience?",
				Type:     "single_choice",
				Options:  []string{"Developers", "Business Users", "Students"},
			},
			{
				ID:       "q2",
				Question: "Do you require dark mode support?",
				Type:     "single_choice",
				Options:  []string{"Yes", "No"},
			},
		},
	}
	if err := validQ.Validate(); err != nil {
		t.Fatalf("unexpected validation error for valid questionnaire: %v", err)
	}
}

// v1.REQ-002-AC-002 & v1.REQ-002-AC-003: 蓝图前置审批门禁与写盘状态机测试
func TestBlueprintService_GatingAndApproval(t *testing.T) {
	ctx := context.Background()

	// 1. 初始化数据库
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	defer database.Close()

	appRepo := db.NewAppRepository(database)
	chatRepo := db.NewChatRepository(database)
	bpRepo := db.NewBlueprintRepository(database)

	// 创建 App 和 Chat
	appID, err := appRepo.Create(ctx, &db.AppEntity{
		Name:              "Gating Test App",
		Path:              "/workspace/gating-test",
		NeedsAppBlueprint: true,
	})
	if err != nil {
		t.Fatalf("failed to create app: %v", err)
	}

	chatID, err := chatRepo.Create(ctx, &db.ChatEntity{
		AppID: appID,
		Title: "Blueprint Test Chat",
	})
	if err != nil {
		t.Fatalf("failed to create chat: %v", err)
	}

	svc := blueprint.NewBlueprintService(bpRepo, appRepo, database)

	// 2. 验证初始状态：没有审批，写盘必须被拦截
	err = svc.EnsureWriteAllowed(ctx, chatID)
	if err == nil {
		t.Fatal("expected write to be blocked before blueprint approval, got nil")
	}
	blotErr, ok := err.(*errs.BlotError)
	if !ok || blotErr.Kind != errs.KindPrecondition {
		t.Fatalf("expected BlotError KindPrecondition, got %v", err)
	}

	// 3. 提交蓝图（write_app_blueprint），初始状态未批准
	dto := blueprint.BlueprintDTO{
		ChatID:          chatID,
		AppName:         "Modern E-Commerce",
		DesignDirection: "Clean, high-contrast, card-based layout",
		PrimaryColor:    "#2563eb",
		ThemeID:         "light",
		Visuals: []blueprint.VisualItem{
			{
				ID:          "v1",
				Type:        "logo",
				Description: "Minimalist geometric store logo",
				Prompt:      "modern flat vector logo on transparent background",
			},
		},
		Approved: false,
	}

	if err := svc.SaveBlueprint(ctx, dto); err != nil {
		t.Fatalf("failed to save blueprint: %v", err)
	}

	// 再次验证：保存了但未批准，依然拦截
	if err := svc.EnsureWriteAllowed(ctx, chatID); err == nil {
		t.Fatal("expected write still blocked before approval")
	}

	// 读取蓝图信息
	fetched, err := svc.GetBlueprint(ctx, chatID)
	if err != nil {
		t.Fatalf("failed to get blueprint: %v", err)
	}
	if fetched.AppName != "Modern E-Commerce" || fetched.Approved {
		t.Fatalf("unexpected fetched blueprint: %+v", fetched)
	}
	if len(fetched.Visuals) != 1 || fetched.Visuals[0].ID != "v1" {
		t.Fatalf("unexpected visuals: %+v", fetched.Visuals)
	}

	// 4. 用户点击 Approve 审批蓝图
	if err := svc.ApproveBlueprint(ctx, chatID); err != nil {
		t.Fatalf("ApproveBlueprint failed: %v", err)
	}

	// 5. 验证写盘门禁解锁
	if err := svc.EnsureWriteAllowed(ctx, chatID); err != nil {
		t.Fatalf("expected write to be allowed after approval, got %v", err)
	}

	// 验证数据库状态更新
	approvedBp, err := svc.GetBlueprint(ctx, chatID)
	if err != nil || !approvedBp.Approved {
		t.Fatalf("expected blueprint to be approved, got: %+v", approvedBp)
	}

	updatedApp, err := appRepo.GetByID(ctx, appID)
	if err != nil {
		t.Fatalf("failed to query app: %v", err)
	}
	if updatedApp.NeedsAppBlueprint {
		t.Fatalf("expected app needs_app_blueprint to be false after approval")
	}
}
