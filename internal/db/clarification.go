package db

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"buildui/internal/errs"
)

// SaveClarification 保存或更新当前会话的待确认澄清问卷
func (r *MessageRepository) SaveClarification(ctx context.Context, chatID int64, payloadJSON string) error {
	if chatID <= 0 {
		return errs.NewValidationError("chat id must be positive", nil)
	}
	now := time.Now().Unix()
	query := `
		INSERT INTO chat_clarifications (chat_id, payload_json, updated_at)
		VALUES (?, ?, ?)
		ON CONFLICT(chat_id) DO UPDATE SET
			payload_json = excluded.payload_json,
			updated_at = excluded.updated_at;
	`
	if _, err := r.db.SQLDB().ExecContext(ctx, query, chatID, payloadJSON, now); err != nil {
		return errs.NewInternalError("Failed to save the clarification questionnaire.", err)
	}
	return nil
}

// GetClarification 读取当前会话尚未完成蓝图转换的澄清问卷
func (r *MessageRepository) GetClarification(ctx context.Context, chatID int64) (string, error) {
	if chatID <= 0 {
		return "", nil
	}
	var payload string
	err := r.db.SQLDB().QueryRowContext(
		ctx,
		`SELECT payload_json FROM chat_clarifications WHERE chat_id = ?;`,
		chatID,
	).Scan(&payload)
	if errors.Is(err, sql.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", errs.NewInternalError("Failed to load the clarification questionnaire.", err)
	}
	return payload, nil
}

// DeleteClarification 清理已完成或已过期的澄清问卷缓存
func (r *MessageRepository) DeleteClarification(ctx context.Context, chatID int64) error {
	if chatID <= 0 {
		return nil
	}
	if _, err := r.db.SQLDB().ExecContext(ctx, `DELETE FROM chat_clarifications WHERE chat_id = ?;`, chatID); err != nil {
		return errs.NewInternalError("Failed to clear the clarification questionnaire.", err)
	}
	return nil
}
