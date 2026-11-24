package plugins

import (
	"context"
	"crypto/cipher"
	"database/sql"
	"encoding/json"
	"errors"
	"maps"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"sync"

	"buildui/internal/db"
	"golang.org/x/net/http/httpguts"
)

type Input struct {
	ID          int64    `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Transport   string   `json:"transport"`
	Endpoint    string   `json:"endpoint"`
	Args        []string `json:"args"`
	Enabled     bool     `json:"enabled"`
	CatalogID   string   `json:"catalogId"`
	AppID       *int64   `json:"appId"`
}

type Plugin struct {
	Input
	Headers               []string `json:"headers"`
	Env                   []string `json:"env"`
	CredentialsUnreadable bool     `json:"credentialsUnreadable"`
	OAuthConnected        bool     `json:"oauthConnected"`
}

type CredentialEdit struct {
	PluginID int64  `json:"pluginId"`
	OldKey   string `json:"oldKey"`
	Key      string `json:"key"`
	Value    string `json:"value"`
}

type Service struct {
	db      *sql.DB
	cipher  cipher.AEAD
	oauthMu sync.Mutex
}

const pluginColumns = "id, name, description, transport, endpoint, args, enabled, catalog_id, app_id, credentials, EXISTS (SELECT 1 FROM mcp_plugin_oauth WHERE plugin_id=mcp_plugins.id AND credentials<>'')"

func NewService(database *db.DB, dataDir string) (*Service, error) {
	key, err := openCipher(dataDir)
	if err != nil {
		return nil, errors.New("Plugin credential storage is unavailable.")
	}
	return &Service{db: database.SQLDB(), cipher: key}, nil
}

type rowScanner interface{ Scan(...any) error }

func scanPlugin(row rowScanner) (Plugin, string, error) {
	var p Plugin
	var args, credentials string
	var catalogID sql.NullString
	if err := row.Scan(&p.ID, &p.Name, &p.Description, &p.Transport, &p.Endpoint, &args, &p.Enabled, &catalogID, &p.AppID, &credentials, &p.OAuthConnected); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = errors.New("Plugin not found.")
		}
		return p, "", err
	}
	p.CatalogID = catalogID.String
	if err := json.Unmarshal([]byte(args), &p.Args); err != nil {
		return p, "", err
	}
	return p, credentials, nil
}

func (s *Service) publicPlugin(p Plugin, stored string) Plugin {
	values, err := s.decrypt(p.ID, stored)
	p.CredentialsUnreadable = err != nil
	if p.Transport == "http" {
		p.Headers = slices.Sorted(maps.Keys(values))
	}
	if p.Transport == "stdio" {
		p.Env = slices.Sorted(maps.Keys(values))
	}
	return p
}

func (s *Service) List(ctx context.Context) ([]Plugin, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT "+pluginColumns+" FROM mcp_plugins ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	plugins := []Plugin{}
	for rows.Next() {
		p, values, err := scanPlugin(rows)
		if err != nil {
			return nil, err
		}
		plugins = append(plugins, s.publicPlugin(p, values))
	}
	return plugins, rows.Err()
}

func (s *Service) Get(ctx context.Context, id int64) (Plugin, error) {
	p, stored, err := s.get(ctx, id)
	if err != nil {
		return Plugin{}, err
	}
	return s.publicPlugin(p, stored), nil
}

func validateInput(in Input) (Input, error) {
	in.Name = strings.TrimSpace(in.Name)
	in.Endpoint = strings.TrimSpace(in.Endpoint)
	if in.Name == "" {
		return in, errors.New("Plugin name is required.")
	}
	if in.Endpoint == "" {
		return in, errors.New("A server URL or command is required.")
	}
	switch in.Transport {
	case "http":
		endpoint, err := url.Parse(in.Endpoint)
		if err != nil || (endpoint.Scheme != "http" && endpoint.Scheme != "https") || endpoint.Hostname() == "" || endpoint.User != nil || endpoint.Fragment != "" {
			return in, errors.New("Enter an HTTP or HTTPS URL without embedded credentials or a fragment.")
		}
		in.Args = nil
	case "stdio":
		if strings.ContainsRune(in.Endpoint, 0) {
			return in, errors.New("Invalid command.")
		}
	default:
		return in, errors.New("Unsupported MCP transport.")
	}
	return in, nil
}

func (s *Service) Save(ctx context.Context, input Input) (Plugin, error) {
	in, err := validateInput(input)
	if err != nil {
		return Plugin{}, err
	}
	args, err := json.Marshal(in.Args)
	if err != nil {
		return Plugin{}, err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Plugin{}, err
	}
	defer tx.Rollback()
	query := "SELECT " + pluginColumns + " FROM mcp_plugins WHERE id = ?"
	if in.ID == 0 {
		res, err := tx.ExecContext(ctx, `INSERT INTO mcp_plugins
			(name, description, transport, endpoint, args, enabled, catalog_id, app_id)
			VALUES (?, ?, ?, ?, ?, ?, NULLIF(?, ''), ?) ON CONFLICT(catalog_id) DO NOTHING`,
			in.Name, in.Description, in.Transport, in.Endpoint, string(args), in.Enabled, in.CatalogID, in.AppID)
		if err != nil {
			return Plugin{}, err
		}
		count, err := res.RowsAffected()
		if err != nil {
			return Plugin{}, err
		}
		if count == 0 {
			query = "SELECT " + pluginColumns + " FROM mcp_plugins WHERE catalog_id = ?"
		} else if in.ID, err = res.LastInsertId(); err != nil {
			return Plugin{}, err
		}
	} else {
		prior, stored, err := scanPlugin(tx.QueryRowContext(ctx, query, in.ID))
		if err != nil {
			return Plugin{}, err
		}
		if prior.Transport != in.Transport || prior.Endpoint != in.Endpoint || !slices.Equal(prior.Args, in.Args) {
			// 连接地址或命令改变后，旧凭据和授权不能迁移到另一个服务。
			stored = ""
			if _, err := tx.ExecContext(ctx, "DELETE FROM mcp_plugin_oauth WHERE plugin_id = ?", in.ID); err != nil {
				return Plugin{}, err
			}
			if _, err := tx.ExecContext(ctx, "DELETE FROM mcp_tool_permissions WHERE plugin_id = ?", in.ID); err != nil {
				return Plugin{}, err
			}
		}
		if _, err := tx.ExecContext(ctx, `UPDATE mcp_plugins SET name=?, description=?, transport=?,
			endpoint=?, args=?, enabled=?, app_id=?, credentials=? WHERE id=?`,
			in.Name, in.Description, in.Transport, in.Endpoint, string(args), in.Enabled, in.AppID, stored, in.ID); err != nil {
			return Plugin{}, err
		}
	}
	argument := any(in.ID)
	if in.ID == 0 {
		argument = in.CatalogID
	}
	p, stored, err := scanPlugin(tx.QueryRowContext(ctx, query, argument))
	if err != nil {
		return Plugin{}, err
	}
	if err := tx.Commit(); err != nil {
		return Plugin{}, err
	}
	return s.publicPlugin(p, stored), nil
}

func (s *Service) Delete(ctx context.Context, id int64) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM mcp_plugins WHERE id = ?", id)
	return err
}

func credentialKey(transport, key string) string {
	key = strings.TrimSpace(key)
	if transport == "http" {
		return http.CanonicalHeaderKey(key)
	}
	return key
}

func validateCredential(transport, key, value string) error {
	if key == "" || value == "" {
		return errors.New("Both a key and value are required.")
	}
	if transport == "http" {
		switch key {
		case "Host", "Content-Length", "Transfer-Encoding", "Connection", "Upgrade", "Proxy-Authorization", "Accept", "Content-Type", "Mcp-Session-Id", "Mcp-Protocol-Version":
			return errors.New("This header is managed by the MCP transport.")
		}
		if !httpguts.ValidHeaderFieldName(key) || !httpguts.ValidHeaderFieldValue(value) {
			return errors.New("Invalid HTTP header name or value.")
		}
	} else if strings.ContainsAny(key, "=\x00") || strings.ContainsRune(value, 0) {
		return errors.New("Invalid environment variable name or value.")
	}
	return nil
}

func (s *Service) SaveCredential(ctx context.Context, edit CredentialEdit) (Plugin, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Plugin{}, err
	}
	defer tx.Rollback()
	p, stored, err := scanPlugin(tx.QueryRowContext(ctx, "SELECT "+pluginColumns+" FROM mcp_plugins WHERE id = ?", edit.PluginID))
	if err != nil {
		return Plugin{}, err
	}
	values, err := s.decrypt(p.ID, stored)
	if err != nil {
		return Plugin{}, err
	}
	old, key := credentialKey(p.Transport, edit.OldKey), credentialKey(p.Transport, edit.Key)
	if key != "" || old == "" {
		value := strings.TrimSpace(edit.Value)
		if err := validateCredential(p.Transport, key, value); err != nil {
			return Plugin{}, err
		}
		if _, duplicate := values[key]; duplicate && old != key {
			return Plugin{}, errors.New("This key already exists.")
		}
		delete(values, old)
		values[key] = value
	} else {
		delete(values, old)
	}
	stored, err = s.encrypt(p.ID, values)
	if err != nil {
		return Plugin{}, err
	}
	if _, err = tx.ExecContext(ctx, "UPDATE mcp_plugins SET credentials=? WHERE id=?", stored, p.ID); err != nil {
		return Plugin{}, err
	}
	if err = tx.Commit(); err != nil {
		return Plugin{}, err
	}
	return s.publicPlugin(p, stored), nil
}
