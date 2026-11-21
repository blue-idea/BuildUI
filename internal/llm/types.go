package llm

import (
	"context"
	"encoding/json"
)

// StreamChunkHandler 流式响应 Chunk 回调函数
type StreamChunkHandler func(chunk string) error

// ChatMessage 大模型对话消息结构
type ChatMessage struct {
	Role    string   `json:"role"`    // system, user, assistant
	Content string   `json:"content"` // 消息内容
	Images  []string `json:"-"`
}

func (m ChatMessage) MarshalJSON() ([]byte, error) {
	type message struct {
		Role    string `json:"role"`
		Content any    `json:"content"`
	}
	if len(m.Images) == 0 {
		return json.Marshal(message{Role: m.Role, Content: m.Content})
	}
	parts := []map[string]any{{"type": "text", "text": m.Content}}
	for _, url := range m.Images {
		parts = append(parts, map[string]any{"type": "image_url", "image_url": map[string]string{"url": url}})
	}
	return json.Marshal(message{Role: m.Role, Content: parts})
}

// ChatRequest 对话补全请求
type ChatRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
}

// Provider 大模型通用流式接口
type Provider interface {
	// StreamChat 发起流式对话并逐块回调
	StreamChat(ctx context.Context, req ChatRequest, onChunk StreamChunkHandler) error
	// TestConnection 测试与大模型端点的连通性与鉴权
	TestConnection(ctx context.Context) error
}
