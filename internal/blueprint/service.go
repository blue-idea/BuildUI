package blueprint

import (
	"context"
	"encoding/json"

	"buildui/internal/db"
	"buildui/internal/errs"
)

// EventEmitter 抽象事件推送接口（解耦 Wails runtime）
type EventEmitter interface {
	Emit(eventName string, optionalData ...interface{})
}

// BlueprintService 负责蓝图前置审批与代码写盘门禁治理
type BlueprintService struct {
	bpRepo  *db.BlueprintRepository
	appRepo *db.AppRepository
	db      *db.DB
	emitter EventEmitter
}

// NewBlueprintService 创建服务实例
func NewBlueprintService(bpRepo *db.BlueprintRepository, appRepo *db.AppRepository, database *db.DB) *BlueprintService {
	return &BlueprintService{
		bpRepo:  bpRepo,
		appRepo: appRepo,
		db:      database,
	}
}

// SetEmitter 设置事件分发器
func (s *BlueprintService) SetEmitter(emitter EventEmitter) {
	s.emitter = emitter
}

// EnsureWriteAllowed 门禁判定：在蓝图未获审批前彻底阻断代码写盘
func (s *BlueprintService) EnsureWriteAllowed(ctx context.Context, chatID int64) error {
	bp, err := s.bpRepo.GetByChatID(ctx, chatID)
	if err != nil {
		// 若蓝图不存在，亦必须先完成蓝图设计与审批
		return errs.NewPreconditionError("blueprint approval required before modifying codebase: no blueprint found", err)
	}

	if !bp.Approved {
		return errs.NewPreconditionError("blueprint approval required before modifying codebase: pending approval", nil)
	}

	return nil
}

// SaveBlueprint 保存或更新大模型生成的蓝图元数据
func (s *BlueprintService) SaveBlueprint(ctx context.Context, dto BlueprintDTO) error {
	if dto.ChatID <= 0 {
		return errs.NewValidationError("chat id must be positive", nil)
	}
	if dto.AppName == "" {
		return errs.NewValidationError("app name cannot be empty", nil)
	}

	visualsBytes, err := json.Marshal(dto.Visuals)
	if err != nil {
		return errs.NewInternalError("failed to serialize visuals json", err)
	}

	entity := &db.BlueprintEntity{
		ChatID:          dto.ChatID,
		AppName:         dto.AppName,
		DesignDirection: dto.DesignDirection,
		PrimaryColor:    dto.PrimaryColor,
		ThemeID:         dto.ThemeID,
		VisualsJSON:     string(visualsBytes),
		Approved:        dto.Approved,
	}

	if err := s.bpRepo.Upsert(ctx, entity); err != nil {
		return err
	}

	if s.emitter != nil {
		s.emitter.Emit("app-blueprint:update", dto)
	}

	return nil
}

// GetBlueprint 查询会话关联的蓝图详情
func (s *BlueprintService) GetBlueprint(ctx context.Context, chatID int64) (*BlueprintDTO, error) {
	entity, err := s.bpRepo.GetByChatID(ctx, chatID)
	if err != nil {
		return nil, err
	}

	var visuals []VisualItem
	if entity.VisualsJSON != "" {
		_ = json.Unmarshal([]byte(entity.VisualsJSON), &visuals)
	}

	return &BlueprintDTO{
		ChatID:          entity.ChatID,
		AppName:         entity.AppName,
		DesignDirection: entity.DesignDirection,
		PrimaryColor:    entity.PrimaryColor,
		ThemeID:         entity.ThemeID,
		Visuals:         visuals,
		Approved:        entity.Approved,
	}, nil
}

// ApproveBlueprint 审批蓝图并解锁写盘工具
func (s *BlueprintService) ApproveBlueprint(ctx context.Context, chatID int64) error {
	// 1. 审批蓝图
	if err := s.bpRepo.Approve(ctx, chatID); err != nil {
		return err
	}

	// 2. 查询所属 app_id 并将 needs_app_blueprint 设为 false
	query := `SELECT app_id FROM chats WHERE id = ?;`
	var appID int64
	if err := s.db.SQLDB().QueryRowContext(ctx, query, chatID).Scan(&appID); err == nil && appID > 0 {
		updateAppQuery := `UPDATE apps SET needs_app_blueprint = 0, updated_at = (strftime('%s', 'now')) WHERE id = ?;`
		_, _ = s.db.SQLDB().ExecContext(ctx, updateAppQuery, appID)
	}

	// 3. 广播事件
	if s.emitter != nil {
		s.emitter.Emit("app-blueprint:approved", map[string]interface{}{
			"chatId": chatID,
		})
	}

	return nil
}
