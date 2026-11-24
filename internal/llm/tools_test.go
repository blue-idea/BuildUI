package llm_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"buildui/internal/llm"
)

func TestStreamChatReturnsToolResultToModel(t *testing.T) {
	requestCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount++
		var body struct {
			Messages []struct {
				Role, Content string
				CallID        string `json:"tool_call_id"`
			}
			Tools []json.RawMessage
		}
		// 忽略 assistant 工具调用的独立字段，验证末尾的 tool 消息。
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Error(err)
		}
		if len(body.Tools) != 1 {
			t.Errorf("unexpected tool definitions: %v", body.Tools)
		}
		w.Header().Set("Content-Type", "text/event-stream")
		if requestCount == 1 {
			fmt.Fprintln(w, `data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"lookup","arguments":"{\"query\":"}}]}}]}`)
			fmt.Fprintln(w, `data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\"go\"}"}}]},"finish_reason":"tool_calls"}]}`)
			return
		}
		last := body.Messages[len(body.Messages)-1]
		if last.Role != "tool" || last.CallID != "call_1" || last.Content != "Go docs" {
			t.Errorf("unexpected tool reply: %#v", last)
		}
		fmt.Fprintln(w, `data: {"choices":[{"delta":{"content":"Found the docs."},"finish_reason":"stop"}]}`)
	}))
	defer server.Close()
	var output strings.Builder
	client := llm.NewOpenAIClient(server.URL, "", "test")
	err := client.StreamChat(context.Background(), llm.ChatRequest{
		Messages: []llm.ChatMessage{{Role: "user", Content: "Find Go docs"}},
		Tools:    []llm.ToolDefinition{{Name: "lookup", Parameters: json.RawMessage(`{"type":"object"}`)}},
		OnToolCall: func(_ context.Context, call llm.ToolCall) (string, error) {
			if call.Function.Name != "lookup" || call.Function.Arguments != `{"query":"go"}` {
				t.Errorf("wrong invocation: %#v", call)
			}
			return "Go docs", nil
		},
	}, func(chunk string) error { output.WriteString(chunk); return nil })
	if err != nil || output.String() != "Found the docs." || requestCount != 2 {
		t.Fatalf("count=%d output=%q error=%v", requestCount, output.String(), err)
	}
}
