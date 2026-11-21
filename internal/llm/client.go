package llm

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"buildui/internal/errs"
)

// OpenAIClient 兼容 OpenAI 协议的大模型流式客户端
type OpenAIClient struct {
	baseURL    string
	apiKey     string
	model      string
	httpClient *http.Client
}

// NewOpenAIClient 创建兼容 OpenAI 协议的流式客户端
func NewOpenAIClient(baseURL, apiKey, model string) *OpenAIClient {
	cleanBaseURL := strings.TrimRight(baseURL, "/")
	if cleanBaseURL == "" {
		cleanBaseURL = "https://api.openai.com/v1"
	}
	return &OpenAIClient{
		baseURL: cleanBaseURL,
		apiKey:  apiKey,
		model:   model,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

type sseChunk struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		FinishReason *string `json:"finish_reason"`
	} `json:"choices"`
}

// StreamChat 发起流式请求并解析 SSE 数据
func (c *OpenAIClient) StreamChat(ctx context.Context, req ChatRequest, onChunk StreamChunkHandler) error {
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

	jsonBytes, err := json.Marshal(bodyMap)
	if err != nil {
		return errs.NewInternalError("failed to marshal chat request body", err)
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
			return ctx.Err()
		}
		return errs.NewExternalError("network failure while connecting to LLM provider", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
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
	completed := false
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return ctx.Err()
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
			completed = true
			break
		}

		var chunk sseChunk
		if err := json.Unmarshal([]byte(dataContent), &chunk); err != nil {
			// 忽略可能夹杂的无法解析行
			continue
		}

		if len(chunk.Choices) > 0 {
			choice := chunk.Choices[0]
			if choice.Delta.Content != "" {
				if err := onChunk(choice.Delta.Content); err != nil {
					return err
				}
			}
			if choice.FinishReason != nil && *choice.FinishReason != "" {
				if *choice.FinishReason == "length" {
					return errs.NewExternalError("The model reached its output limit before completing the response.", nil)
				}
				completed = true
			}
		}
	}

	if err := scanner.Err(); err != nil {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		return errs.NewExternalError("error occurred while reading SSE stream", err)
	}

	if !completed {
		if err := ctx.Err(); err != nil {
			return err
		}
		return errs.NewExternalError("The model stream ended before completion.", nil)
	}
	return nil
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
		return c.StreamChat(ctx, testReq, func(chunk string) error { return nil })
	}

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return errs.NewPreconditionError(fmt.Sprintf("authentication failed: %s", string(respBytes)), nil)
	}
	return errs.NewExternalError(fmt.Sprintf("LLM endpoint responded with status %d: %s", resp.StatusCode, string(respBytes)), nil)
}
