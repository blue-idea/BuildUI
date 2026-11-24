package llm

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"buildui/internal/errs"
)

// ErrOutputLimit 区分模型截断和其他流式请求错误。
var ErrOutputLimit = errs.NewExternalError("The model reached its output limit before completing the response.", nil)

// ErrStreamIdle 表示服务商未能在等待窗口内返回新的正文。
var ErrStreamIdle = errs.NewExternalError("The model stopped sending output. Resume the build to continue from the saved progress.", nil)

// OpenAIClient 兼容 OpenAI 协议的大模型流式客户端
type OpenAIClient struct {
	baseURL    string
	apiKey     string
	model      string
	httpClient *http.Client
}

// NormalizeBaseURL 规范化大模型端点 URL，自动剥离末尾可能误填的 /chat/completions 或 /models 路径与多余斜杠
func NormalizeBaseURL(rawURL string) string {
	u := strings.TrimSpace(rawURL)
	for {
		u = strings.TrimRight(u, "/")
		if strings.HasSuffix(u, "/chat/completions") {
			u = strings.TrimSuffix(u, "/chat/completions")
			continue
		}
		if strings.HasSuffix(u, "/models") {
			u = strings.TrimSuffix(u, "/models")
			continue
		}
		break
	}
	return u
}

// NewOpenAIClient 创建兼容 OpenAI 协议的流式客户端
func NewOpenAIClient(baseURL, apiKey, model string) *OpenAIClient {
	cleanBaseURL := NormalizeBaseURL(baseURL)
	if cleanBaseURL == "" {
		cleanBaseURL = "https://api.openai.com/v1"
	}
	return &OpenAIClient{
		baseURL: cleanBaseURL,
		apiKey:  apiKey,
		model:   model,
		httpClient: &http.Client{
			Timeout: 0, // 流式 SSE 响应不设总超时，通过 Transport 超时与 context 取消控制
			Transport: &http.Transport{
				ResponseHeaderTimeout: 300 * time.Second,
			},
		},
	}
}

type sseChunk struct {
	Choices []struct {
		Delta struct {
			Content string      `json:"content"`
			Tools   []toolDelta `json:"tool_calls"`
		} `json:"delta"`
		FinishReason *string `json:"finish_reason"`
	} `json:"choices"`
}

// StreamChat 发起流式请求并解析 SSE 数据
func (c *OpenAIClient) streamChatRound(ctx context.Context, req ChatRequest, onChunk StreamChunkHandler, onToolDelta func(toolDelta)) error {
	modelName := req.Model
	if modelName == "" {
		modelName = c.model
	}

	bodyMap := map[string]interface{}{
		"model":       modelName,
		"messages":    req.Messages,
		"stream":      true,
		"temperature": req.Temperature,
	}
	if req.MaxTokens > 0 {
		bodyMap["max_tokens"] = req.MaxTokens
	}
	if len(req.Tools) != 0 {
		tools := make([]map[string]any, 0, len(req.Tools))
		for _, definition := range req.Tools {
			tools = append(tools, map[string]any{"type": "function", "function": definition})
		}
		bodyMap["tools"] = tools
	}
	if req.DisableThinking {
		bodyMap["thinking"] = map[string]string{"type": "disabled"}
		// 兼容仅转发 reasoning_effort 的 OpenAI 兼容网关。
		bodyMap["reasoning_effort"] = "none"
	}

	jsonBytes, err := json.Marshal(bodyMap)
	if err != nil {
		return errs.NewInternalError("failed to marshal chat request body", err)
	}

	var idleTimer *time.Timer
	if req.IdleTimeout > 0 {
		streamCtx, cancel := context.WithCancelCause(ctx)
		defer cancel(nil)
		ctx = streamCtx
		idleTimer = time.AfterFunc(req.IdleTimeout, func() { cancel(ErrStreamIdle) })
		defer idleTimer.Stop()
	}
	contextError := func() error {
		if errors.Is(context.Cause(ctx), ErrStreamIdle) {
			return ErrStreamIdle
		}
		return ctx.Err()
	}
	endpoint := fmt.Sprintf("%s/chat/completions", c.baseURL)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(jsonBytes))
	if err != nil {
		return errs.NewInternalError("failed to create http request for llm", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "text/event-stream")
	if c.apiKey != "" {
		httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		if ctx.Err() != nil {
			return contextError()
		}
		return errs.NewExternalError("network failure while connecting to LLM provider", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		if ctx.Err() != nil {
			return contextError()
		}
		errMsg := string(respBytes)
		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return errs.NewPreconditionError(fmt.Sprintf("LLM authentication failed (%d): %s", resp.StatusCode, errMsg), nil)
		}
		if resp.StatusCode == http.StatusTooManyRequests {
			return errs.NewExternalError(fmt.Sprintf("LLM rate limit reached (%d): %s", resp.StatusCode, errMsg), nil)
		}
		return errs.NewExternalError(fmt.Sprintf("LLM endpoint returned unexpected status %d: %s", resp.StatusCode, errMsg), nil)
	}

	// 逐行解析 Server-Sent Events 流
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return contextError()
		default:
		}

		line := scanner.Text()
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, ":") {
			continue // 忽略空行或心跳注释行
		}

		if !strings.HasPrefix(line, "data:") {
			continue
		}

		dataContent := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if dataContent == "[DONE]" {
			return nil
		}

		var chunk sseChunk
		if err := json.Unmarshal([]byte(dataContent), &chunk); err != nil {
			// 忽略可能夹杂的无法解析行
			continue
		}

		if len(chunk.Choices) > 0 {
			choice := chunk.Choices[0]
			if onToolDelta != nil {
				for _, delta := range choice.Delta.Tools {
					onToolDelta(delta)
				}
				if len(choice.Delta.Tools) > 0 && idleTimer != nil {
					idleTimer.Reset(req.IdleTimeout)
				}
			}
			if choice.Delta.Content != "" {
				// 工具回调的本地执行时间不计入模型等待时间。
				if idleTimer != nil && !idleTimer.Stop() {
					<-ctx.Done()
					return contextError()
				}
				if err := onChunk(choice.Delta.Content); err != nil {
					return err
				}
				if idleTimer != nil {
					idleTimer.Reset(req.IdleTimeout)
				}
			}
			if choice.FinishReason != nil && *choice.FinishReason != "" {
				if *choice.FinishReason == "length" {
					return ErrOutputLimit
				}
				if *choice.FinishReason == "tool_calls" && onToolDelta != nil {
					return errToolCalls
				}
				return nil
			}
		}
	}

	if ctx.Err() != nil {
		return contextError()
	}
	if err := scanner.Err(); err != nil {
		return errs.NewExternalError("error occurred while reading SSE stream", err)
	}
	return errs.NewExternalError("The model stream ended before completion.", nil)
}

// TestConnection 测试与大模型端点的连通性与鉴权有效性
func (c *OpenAIClient) TestConnection(ctx context.Context) error {
	modelsEndpoint := fmt.Sprintf("%s/models", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, modelsEndpoint, nil)
	if err != nil {
		return errs.NewInternalError("failed to create test connection request", err)
	}
	if c.apiKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return errs.NewExternalError("failed to connect to LLM server", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return nil
	}

	// 如果 /models 端点不支持（如某些特定中转服务），尝试发送一个 1 token 请求
	if resp.StatusCode == http.StatusNotFound {
		testReq := ChatRequest{
			Model: c.model,
			Messages: []ChatMessage{
				{Role: "user", Content: "ping"},
			},
			MaxTokens: 1,
		}
		err := c.StreamChat(ctx, testReq, func(chunk string) error { return nil })
		if errors.Is(err, ErrOutputLimit) {
			// 探测只要求模型可调用，单 token 截断证明请求已被模型处理。
			return nil
		}
		return err
	}

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return errs.NewPreconditionError(fmt.Sprintf("authentication failed: %s", string(respBytes)), nil)
	}
	return errs.NewExternalError(fmt.Sprintf("LLM endpoint responded with status %d: %s", resp.StatusCode, string(respBytes)), nil)
}
