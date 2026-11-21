package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"buildui/internal/errs"
)

// AppRepository 应用数据访问接口实现
type AppRepository struct {
	db *DB
}

func NewAppRepository(db *DB) *AppRepository {
	return &AppRepository{db: db}
}

// Create 插入新应用记录
func (r *AppRepository) Create(ctx context.Context, app *AppEntity) (int64, error) {
	if app.Name == "" {
		return 0, errs.NewValidationError("app name cannot be empty", nil)
	}
	if app.Path == "" {
		return 0, errs.NewValidationError("app path cannot be empty", nil)
	}

	themeID := app.ThemeID
	if themeID == "" {
		themeID = "default"
	}

	needsBlueprintInt := 0
	if app.NeedsAppBlueprint {
		needsBlueprintInt = 1
	}

	testingEnabledInt := 0
	if app.TestingEnabled {
		testingEnabledInt = 1
	}

	now := time.Now().Unix()
	query := `
		INSERT INTO apps (name, path, theme_id, needs_app_blueprint, testing_enabled, install_command, start_command, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
	`
	res, err := r.db.SQLDB().ExecContext(ctx, query,
		app.Name,
		app.Path,
		themeID,
		needsBlueprintInt,
		testingEnabledInt,
		app.InstallCommand,
		app.StartCommand,
		now,
		now,
	)
	if err != nil {
		return 0, errs.NewInternalError(fmt.Sprintf("failed to insert app: %s", app.Name), err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, errs.NewInternalError("failed to get last insert id for app", err)
	}
	app.ID = id
	return id, nil
}

// GetByID 根据 ID 查询应用
func (r *AppRepository) GetByID(ctx context.Context, id int64) (*AppEntity, error) {
	query := `
		SELECT id, name, path, theme_id, needs_app_blueprint, testing_enabled, install_command, start_command, created_at, updated_at
		FROM apps
		WHERE id = ?;
	`
	row := r.db.SQLDB().QueryRowContext(ctx, query, id)

	var app AppEntity
	var needsBpInt, testingInt int
	var createdAtSec, updatedAtSec int64
	var installCmd, startCmd sql.NullString

	err := row.Scan(
		&app.ID,
		&app.Name,
		&app.Path,
		&app.ThemeID,
		&needsBpInt,
		&testingInt,
		&installCmd,
		&startCmd,
		&createdAtSec,
		&updatedAtSec,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errs.NewNotFoundError(fmt.Sprintf("app with id %d not found", id), err)
		}
		return nil, errs.NewInternalError(fmt.Sprintf("failed to query app %d", id), err)
	}

	app.NeedsAppBlueprint = (needsBpInt == 1)
	app.TestingEnabled = (testingInt == 1)
	if installCmd.Valid {
		app.InstallCommand = installCmd.String
	}
	if startCmd.Valid {
		app.StartCommand = startCmd.String
	}
	app.CreatedAt = time.Unix(createdAtSec, 0)
	app.UpdatedAt = time.Unix(updatedAtSec, 0)

	return &app, nil
}

// List 列出所有应用
func (r *AppRepository) List(ctx context.Context) ([]*AppEntity, error) {
	query := `
		SELECT id, name, path, theme_id, needs_app_blueprint, testing_enabled, install_command, start_command, created_at, updated_at
		FROM apps
		ORDER BY updated_at DESC;
	`
	rows, err := r.db.SQLDB().QueryContext(ctx, query)
	if err != nil {
		return nil, errs.NewInternalError("failed to query app list", err)
	}
	defer rows.Close()

	var apps []*AppEntity
	for rows.Next() {
		var app AppEntity
		var needsBpInt, testingInt int
		var createdAtSec, updatedAtSec int64
		var installCmd, startCmd sql.NullString

		if err := rows.Scan(
			&app.ID,
			&app.Name,
			&app.Path,
			&app.ThemeID,
			&needsBpInt,
			&testingInt,
			&installCmd,
			&startCmd,
			&createdAtSec,
			&updatedAtSec,
		); err != nil {
			return nil, errs.NewInternalError("failed to scan app row", err)
		}

		app.NeedsAppBlueprint = (needsBpInt == 1)
		app.TestingEnabled = (testingInt == 1)
		if installCmd.Valid {
			app.InstallCommand = installCmd.String
		}
		if startCmd.Valid {
			app.StartCommand = startCmd.String
		}
		app.CreatedAt = time.Unix(createdAtSec, 0)
		app.UpdatedAt = time.Unix(updatedAtSec, 0)

		apps = append(apps, &app)
	}

	if err := rows.Err(); err != nil {
		return nil, errs.NewInternalError("app row iteration error", err)
	}

	return apps, nil
}

// Delete 删除指定应用（将级联删除相关会话、消息、蓝图、版本）
func (r *AppRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM apps WHERE id = ?;`
	res, err := r.db.SQLDB().ExecContext(ctx, query, id)
	if err != nil {
		return errs.NewInternalError(fmt.Sprintf("failed to delete app %d", id), err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return errs.NewInternalError("failed to get rows affected for delete app", err)
	}
	if rowsAffected == 0 {
		return errs.NewNotFoundError(fmt.Sprintf("app %d not found for deletion", id), nil)
	}
	return nil
}

// ChatRepository 会话数据访问接口
type ChatRepository struct {
	db *DB
}

func NewChatRepository(db *DB) *ChatRepository {
	return &ChatRepository{db: db}
}

func (r *ChatRepository) Create(ctx context.Context, chat *ChatEntity) (int64, error) {
	if chat.AppID <= 0 {
		return 0, errs.NewValidationError("app id must be positive", nil)
	}
	if chat.Title == "" {
		chat.Title = "New Chat"
	}
	if chat.ChatMode == "" {
		chat.ChatMode = "agent"
	}

	now := time.Now().Unix()
	query := `
		INSERT INTO chats (app_id, title, chat_mode, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?);
	`
	res, err := r.db.SQLDB().ExecContext(ctx, query, chat.AppID, chat.Title, chat.ChatMode, now, now)
	if err != nil {
		return 0, errs.NewInternalError("failed to create chat", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, errs.NewInternalError("failed to get last insert id for chat", err)
	}
	chat.ID = id
	return id, nil
}

func (r *ChatRepository) ListByAppID(ctx context.Context, appID int64) ([]*ChatEntity, error) {
	query := `
		SELECT id, app_id, title, chat_mode, created_at, updated_at
		FROM chats
		WHERE app_id = ?
		ORDER BY updated_at DESC;
	`
	rows, err := r.db.SQLDB().QueryContext(ctx, query, appID)
	if err != nil {
		return nil, errs.NewInternalError("failed to list chats", err)
	}
	defer rows.Close()

	var chats []*ChatEntity
	for rows.Next() {
		var chat ChatEntity
		var createdAtSec, updatedAtSec int64
		if err := rows.Scan(&chat.ID, &chat.AppID, &chat.Title, &chat.ChatMode, &createdAtSec, &updatedAtSec); err != nil {
			return nil, errs.NewInternalError("failed to scan chat", err)
		}
		chat.CreatedAt = time.Unix(createdAtSec, 0)
		chat.UpdatedAt = time.Unix(updatedAtSec, 0)
		chats = append(chats, &chat)
	}
	return chats, nil
}

// GetByID 根据 ID 查询单个会话
func (r *ChatRepository) GetByID(ctx context.Context, id int64) (*ChatEntity, error) {
	query := `
		SELECT id, app_id, title, chat_mode, created_at, updated_at
		FROM chats
		WHERE id = ?;
	`
	row := r.db.SQLDB().QueryRowContext(ctx, query, id)
	var chat ChatEntity
	var createdAtSec, updatedAtSec int64
	if err := row.Scan(&chat.ID, &chat.AppID, &chat.Title, &chat.ChatMode, &createdAtSec, &updatedAtSec); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errs.NewNotFoundError(fmt.Sprintf("chat with id %d not found", id), err)
		}
		return nil, errs.NewInternalError(fmt.Sprintf("failed to query chat %d", id), err)
	}
	chat.CreatedAt = time.Unix(createdAtSec, 0)
	chat.UpdatedAt = time.Unix(updatedAtSec, 0)
	return &chat, nil
}

// MessageRepository 消息数据访问接口
type MessageRepository struct {
	db *DB
}

func NewMessageRepository(db *DB) *MessageRepository {
	return &MessageRepository{db: db}
}

func (r *MessageRepository) Create(ctx context.Context, msg *MessageEntity) (int64, error) {
	if msg.ChatID <= 0 {
		return 0, errs.NewValidationError("chat id must be positive", nil)
	}
	if msg.Role == "" {
		return 0, errs.NewValidationError("message role cannot be empty", nil)
	}

	now := time.Now().Unix()
	query := `
		INSERT INTO messages (chat_id, role, content, model, source_commit_hash, commit_hash, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?);
	`
	res, err := r.db.SQLDB().ExecContext(ctx, query,
		msg.ChatID,
		msg.Role,
		msg.Content,
		msg.Model,
		msg.SourceCommitHash,
		msg.CommitHash,
		now,
	)
	if err != nil {
		return 0, errs.NewInternalError("failed to create message", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, errs.NewInternalError("failed to get last insert id for message", err)
	}
	msg.ID = id
	return id, nil
}

func (r *MessageRepository) ListByChatID(ctx context.Context, chatID int64) ([]*MessageEntity, error) {
	query := `
		SELECT id, chat_id, role, content, model, source_commit_hash, commit_hash, created_at
		FROM messages
		WHERE chat_id = ?
		ORDER BY id ASC;
	`
	rows, err := r.db.SQLDB().QueryContext(ctx, query, chatID)
	if err != nil {
		return nil, errs.NewInternalError("failed to list messages", err)
	}
	defer rows.Close()

	var messages []*MessageEntity
	for rows.Next() {
		var msg MessageEntity
		var model, srcHash, commitHash sql.NullString
		var createdAtSec int64

		if err := rows.Scan(
			&msg.ID,
			&msg.ChatID,
			&msg.Role,
			&msg.Content,
			&model,
			&srcHash,
			&commitHash,
			&createdAtSec,
		); err != nil {
			return nil, errs.NewInternalError("failed to scan message", err)
		}

		if model.Valid {
			msg.Model = model.String
		}
		if srcHash.Valid {
			msg.SourceCommitHash = srcHash.String
		}
		if commitHash.Valid {
			msg.CommitHash = commitHash.String
		}
		msg.CreatedAt = time.Unix(createdAtSec, 0)
		messages = append(messages, &msg)
	}
	return messages, nil
}

// BlueprintRepository 蓝图数据访问接口
type BlueprintRepository struct {
	db *DB
}

func NewBlueprintRepository(db *DB) *BlueprintRepository {
	return &BlueprintRepository{db: db}
}

func (r *BlueprintRepository) Upsert(ctx context.Context, bp *BlueprintEntity) error {
	if bp.ChatID <= 0 {
		return errs.NewValidationError("chat id must be positive", nil)
	}
	if bp.AppName == "" {
		return errs.NewValidationError("app name cannot be empty", nil)
	}

	themeID := bp.ThemeID
	if themeID == "" {
		themeID = "default"
	}
	visuals := bp.VisualsJSON
	if visuals == "" {
		visuals = "[]"
	}

	approvedInt := 0
	if bp.Approved {
		approvedInt = 1
	}

	now := time.Now().Unix()
	query := `
		INSERT INTO blueprints (chat_id, app_name, design_direction, primary_color, theme_id, visuals_json, approved, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(chat_id) DO UPDATE SET
			app_name = excluded.app_name,
			design_direction = excluded.design_direction,
			primary_color = excluded.primary_color,
			theme_id = excluded.theme_id,
			visuals_json = excluded.visuals_json,
			approved = excluded.approved,
			updated_at = excluded.updated_at;
	`
	res, err := r.db.SQLDB().ExecContext(ctx, query,
		bp.ChatID,
		bp.AppName,
		bp.DesignDirection,
		bp.PrimaryColor,
		themeID,
		visuals,
		approvedInt,
		now,
		now,
	)
	if err != nil {
		return errs.NewInternalError("failed to upsert blueprint", err)
	}
	id, err := res.LastInsertId()
	if err == nil && id > 0 {
		bp.ID = id
	}
	return nil
}

func (r *BlueprintRepository) GetByChatID(ctx context.Context, chatID int64) (*BlueprintEntity, error) {
	query := `
		SELECT id, chat_id, app_name, design_direction, primary_color, theme_id, visuals_json, approved, created_at, updated_at
		FROM blueprints
		WHERE chat_id = ?;
	`
	row := r.db.SQLDB().QueryRowContext(ctx, query, chatID)

	var bp BlueprintEntity
	var approvedInt int
	var createdAtSec, updatedAtSec int64

	err := row.Scan(
		&bp.ID,
		&bp.ChatID,
		&bp.AppName,
		&bp.DesignDirection,
		&bp.PrimaryColor,
		&bp.ThemeID,
		&bp.VisualsJSON,
		&approvedInt,
		&createdAtSec,
		&updatedAtSec,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errs.NewNotFoundError(fmt.Sprintf("blueprint for chat %d not found", chatID), err)
		}
		return nil, errs.NewInternalError(fmt.Sprintf("failed to get blueprint for chat %d", chatID), err)
	}

	bp.Approved = (approvedInt == 1)
	bp.CreatedAt = time.Unix(createdAtSec, 0)
	bp.UpdatedAt = time.Unix(updatedAtSec, 0)
	return &bp, nil
}

func (r *BlueprintRepository) Approve(ctx context.Context, chatID int64) error {
	now := time.Now().Unix()
	query := `
		UPDATE blueprints
		SET approved = 1, updated_at = ?
		WHERE chat_id = ?;
	`
	res, err := r.db.SQLDB().ExecContext(ctx, query, now, chatID)
	if err != nil {
		return errs.NewInternalError("failed to approve blueprint", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return errs.NewInternalError("failed to check rows affected", err)
	}
	if affected == 0 {
		return errs.NewNotFoundError(fmt.Sprintf("blueprint for chat %d not found", chatID), nil)
	}
	return nil
}

// VersionRepository 版本审计记录访问接口
type VersionRepository struct {
	db *DB
}

func NewVersionRepository(db *DB) *VersionRepository {
	return &VersionRepository{db: db}
}

func (r *VersionRepository) Create(ctx context.Context, v *VersionEntity) (int64, error) {
	if v.AppID <= 0 {
		return 0, errs.NewValidationError("app id must be positive", nil)
	}
	if v.CommitHash == "" {
		return 0, errs.NewValidationError("commit hash cannot be empty", nil)
	}

	now := time.Now().Unix()
	query := `
		INSERT INTO versions (app_id, chat_id, commit_hash, message, created_at)
		VALUES (?, ?, ?, ?, ?);
	`
	res, err := r.db.SQLDB().ExecContext(ctx, query, v.AppID, v.ChatID, v.CommitHash, v.Message, now)
	if err != nil {
		return 0, errs.NewInternalError("failed to create version record", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, errs.NewInternalError("failed to get last insert id for version", err)
	}
	v.ID = id
	return id, nil
}

func (r *VersionRepository) ListByAppID(ctx context.Context, appID int64) ([]*VersionEntity, error) {
	query := `
		SELECT id, app_id, chat_id, commit_hash, message, created_at
		FROM versions
		WHERE app_id = ?
		ORDER BY id DESC;
	`
	rows, err := r.db.SQLDB().QueryContext(ctx, query, appID)
	if err != nil {
		return nil, errs.NewInternalError("failed to list versions", err)
	}
	defer rows.Close()

	var versions []*VersionEntity
	for rows.Next() {
		var v VersionEntity
		var chatID sql.NullInt64
		var createdAtSec int64

		if err := rows.Scan(&v.ID, &v.AppID, &chatID, &v.CommitHash, &v.Message, &createdAtSec); err != nil {
			return nil, errs.NewInternalError("failed to scan version row", err)
		}
		if chatID.Valid {
			v.ChatID = &chatID.Int64
		}
		v.CreatedAt = time.Unix(createdAtSec, 0)
		versions = append(versions, &v)
	}
	return versions, nil
}
