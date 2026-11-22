package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"buildui/internal/errs"
)

// BuildStep 保存一次模型调用的目标，以及执行时需要读取的文件。
type BuildStep struct {
	Title string   `json:"title"`
	Goal  string   `json:"goal"`
	Files []string `json:"files"`
	Read  []string `json:"read,omitempty"`
}

// BuildCheckpoint 保存恢复生成所需的原始请求和已完成步骤。
type BuildCheckpoint struct {
	Prompt      string      `json:"prompt"`
	Attachments []string    `json:"attachments,omitempty"`
	Objective   string      `json:"objective"`
	Steps       []BuildStep `json:"steps"`
	Next        int         `json:"next"`
	Changed     bool        `json:"changed"`
	Reply       string      `json:"reply"`
}

func (r *MessageRepository) GetBuildCheckpoint(ctx context.Context, chatID int64) (*BuildCheckpoint, error) {
	var raw []byte
	err := r.db.SQLDB().QueryRowContext(ctx, "SELECT state_json FROM build_checkpoints WHERE chat_id = ?", chatID).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, errs.NewInternalError("Failed to load the build checkpoint.", err)
	}
	var state BuildCheckpoint
	if err := json.Unmarshal(raw, &state); err != nil {
		return nil, errs.NewInternalError("Failed to decode the build checkpoint.", err)
	}
	if len(state.Steps) == 0 || state.Next < 0 || state.Next > len(state.Steps) {
		return nil, errs.NewInternalError("The build checkpoint contains invalid progress.", nil)
	}
	return &state, nil
}

func (r *MessageRepository) SaveBuildCheckpoint(ctx context.Context, chatID int64, state *BuildCheckpoint) error {
	raw, err := json.Marshal(state)
	if err != nil {
		return errs.NewInternalError("Failed to encode the build checkpoint.", err)
	}
	_, err = r.db.SQLDB().ExecContext(ctx, `
		INSERT INTO build_checkpoints (chat_id, state_json) VALUES (?, ?)
		ON CONFLICT (chat_id) DO UPDATE SET state_json = excluded.state_json
	`, chatID, string(raw))
	if err != nil {
		return errs.NewInternalError("Failed to save the build checkpoint.", err)
	}
	return nil
}

// SaveTurn 将一轮对话和检查点清理作为同一个数据库事务提交。
func (r *MessageRepository) SaveTurn(ctx context.Context, user, assistant *MessageEntity, completeBuild bool) error {
	tx, err := r.db.SQLDB().BeginTx(ctx, nil)
	if err != nil {
		return errs.NewInternalError("Failed to start the chat transaction.", err)
	}
	defer tx.Rollback()
	for _, message := range []*MessageEntity{user, assistant} {
		if _, err := insertMessage(ctx, tx, message); err != nil {
			return err
		}
	}
	if completeBuild {
		if _, err := tx.ExecContext(ctx, "DELETE FROM build_checkpoints WHERE chat_id = ?", user.ChatID); err != nil {
			return errs.NewInternalError("Failed to clear the build checkpoint.", err)
		}
	}
	if err := tx.Commit(); err != nil {
		return errs.NewInternalError("Failed to save the chat turn.", err)
	}
	return nil
}
