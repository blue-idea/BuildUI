# Wails 接口 · 分步构建

- `GetProjectChat(appId)` 在会话存在待续建计划时返回可选的 `buildProgress`，含 `completed` 和 `total`。完成数来自 SQLite 检查点。
- `StreamChat` 在 `mode: "build"` 时接受可选的 `resume: true`。续建从检查点读取原始提示和附件，调用方可发送空提示和空附件。蓝图审批仍是执行前置条件。
- `chat:progress` 沿用 `chatId` 和 `message`，在规划、每步开始、工具续写与最终保存时推送进度。
