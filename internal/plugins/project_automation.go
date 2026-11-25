package plugins

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
)

type ProjectAutomation struct {
	Enabled   bool    `json:"enabled"`
	PluginIDs []int64 `json:"pluginIds"`
}

func (s *Service) SaveProjectAutomation(ctx context.Context, appID int64, selection ProjectAutomation) error {
	if !selection.Enabled {
		selection.PluginIDs = nil
	}
	data, err := json.Marshal(selection)
	if err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx, `INSERT INTO mcp_project_automation (app_id, selection_json) VALUES (?, ?)
		ON CONFLICT(app_id) DO UPDATE SET selection_json=excluded.selection_json`, appID, string(data))
	return err
}

// ProjectAutomation 返回空指针表示该项目还没有通过首页设置自动化。
func (s *Service) ProjectAutomation(ctx context.Context, appID int64) (*ProjectAutomation, error) {
	var data string
	err := s.db.QueryRowContext(ctx, "SELECT selection_json FROM mcp_project_automation WHERE app_id=?", appID).Scan(&data)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var selection ProjectAutomation
	if err := json.Unmarshal([]byte(data), &selection); err != nil {
		return nil, err
	}
	return &selection, nil
}
