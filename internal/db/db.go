package db

import (
	"context"
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"

	"buildui/internal/errs"
)

// DB 封装纯 Go SQLite 数据库连接
type DB struct {
	db *sql.DB
}

// Open 打开指定路径的 SQLite 数据库文件并执行自动迁移
func Open(ctx context.Context, dsn string) (*DB, error) {
	conn, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, errs.NewInternalError(fmt.Sprintf("failed to open sqlite database at %s", dsn), err)
	}

	if err := conn.PingContext(ctx); err != nil {
		conn.Close()
		return nil, errs.NewInternalError("failed to ping sqlite database", err)
	}

	// 开启外键支持
	if _, err := conn.ExecContext(ctx, "PRAGMA foreign_keys = ON;"); err != nil {
		conn.Close()
		return nil, errs.NewInternalError("failed to enable foreign keys", err)
	}

	database := &DB{db: conn}
	if err := database.Migrate(ctx); err != nil {
		conn.Close()
		return nil, err
	}

	return database, nil
}

// OpenMemory 打开内存数据库（用于单元测试与集成测试）
func OpenMemory(ctx context.Context) (*DB, error) {
	// 使用共享缓存内存数据库，确保在连接生命周期内数据持久
	return Open(ctx, ":memory:?cache=shared")
}

// SQLDB 返回底层 *sql.DB
func (d *DB) SQLDB() *sql.DB {
	return d.db
}

// Close 关闭数据库连接
func (d *DB) Close() error {
	if d.db != nil {
		return d.db.Close()
	}
	return nil
}

// Migrate 执行建表与结构初始化 DDL
func (d *DB) Migrate(ctx context.Context) error {
	if _, err := d.db.ExecContext(ctx, schemaDDL); err != nil {
		return errs.NewInternalError("failed to execute database migrations", err)
	}
	return nil
}

// TableExists 检查指定数据表是否存在
func (d *DB) TableExists(ctx context.Context, tableName string) (bool, error) {
	query := "SELECT count(*) FROM sqlite_master WHERE type='table' AND name = ?;"
	var count int
	if err := d.db.QueryRowContext(ctx, query, tableName).Scan(&count); err != nil {
		return false, errs.NewInternalError(fmt.Sprintf("failed to query table %s existence", tableName), err)
	}
	return count > 0, nil
}
