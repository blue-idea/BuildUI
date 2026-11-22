package db

const schemaDDL = `
-- 启用外键完整性约束
PRAGMA foreign_keys = ON;

-- 1. 应用表
CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    theme_id TEXT DEFAULT 'default',
    needs_app_blueprint INTEGER NOT NULL DEFAULT 1,
    testing_enabled INTEGER NOT NULL DEFAULT 0,
    install_command TEXT,
    start_command TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 2. 对话表
CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    chat_mode TEXT NOT NULL DEFAULT 'agent',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 3. 消息表
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    source_commit_hash TEXT,
    commit_hash TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 4. 应用蓝图表
CREATE TABLE IF NOT EXISTS blueprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL UNIQUE REFERENCES chats(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL,
    design_direction TEXT NOT NULL,
    primary_color TEXT NOT NULL,
    theme_id TEXT NOT NULL DEFAULT 'default',
    visuals_json TEXT NOT NULL DEFAULT '[]',
    approved INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 5. 版本快照审计表
CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    chat_id INTEGER REFERENCES chats(id) ON DELETE SET NULL,
    commit_hash TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 6. 系统配置项表
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 7. 未完成构建的检查点，随所属对话一起删除
CREATE TABLE IF NOT EXISTS build_checkpoints (
    chat_id INTEGER PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
    state_json TEXT NOT NULL
);

-- 辅助索引
CREATE INDEX IF NOT EXISTS idx_chats_app_id ON chats(app_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_versions_app_id ON versions(app_id);
`
