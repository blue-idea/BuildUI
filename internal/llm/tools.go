package llm

import (
	"context"
	"errors"
	"maps"
	"slices"
	"strings"

	"buildui/internal/config"
)

var errToolCalls = errors.New("Model requested tool calls.")

type toolDelta struct {
	Index int `json:"index"`
	ToolCall
}

func (c *OpenAIClient) StreamChat(ctx context.Context, req ChatRequest, onChunk StreamChunkHandler) error {
	if len(req.Tools) == 0 || req.OnToolCall == nil {
		return c.streamChatRound(ctx, req, onChunk, nil)
	}
	req.Messages = slices.Clone(req.Messages)
	for round := 0; round <= config.MCPToolRounds; round++ {
		var text strings.Builder
		calls := make(map[int]ToolCall)
		err := c.streamChatRound(ctx, req, func(chunk string) error {
			text.WriteString(chunk)
			return nil
		}, func(delta toolDelta) {
			call := calls[delta.Index]
			if delta.ID != "" {
				call.ID = delta.ID
			}
			call.Type = "function"
			call.Function.Name += delta.Function.Name
			call.Function.Arguments += delta.Function.Arguments
			calls[delta.Index] = call
		})
		if err == nil {
			return onChunk(text.String())
		}
		if !errors.Is(err, errToolCalls) {
			return err
		}
		if round == config.MCPToolRounds || len(calls) == 0 || len(calls) > config.MCPDiscoveryLimit {
			return errors.New("The model exceeded the MCP tool call limit or returned no valid calls.")
		}
		ordered := make([]ToolCall, 0, len(calls))
		for _, index := range slices.Sorted(maps.Keys(calls)) {
			call := calls[index]
			if call.ID == "" || call.Function.Name == "" {
				return errors.New("The model returned an incomplete tool call.")
			}
			ordered = append(ordered, call)
		}
		// 保留完整的工具调用及配对结果，后续模型轮次可使用工具输出。
		req.Messages = append(req.Messages, ChatMessage{Role: "assistant", Content: text.String(), ToolCalls: ordered})
		for _, call := range ordered {
			if err := ctx.Err(); err != nil {
				return err
			}
			result, err := req.OnToolCall(ctx, call)
			if err != nil {
				result = err.Error()
			}
			req.Messages = append(req.Messages, ChatMessage{Role: "tool", ToolCallID: call.ID, Content: result})
		}
	}
	return errToolCalls
}
