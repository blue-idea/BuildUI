package llm_test

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"buildui/internal/errs"
	"buildui/internal/llm"
)

func TestOpenAIClient_StreamChat_Success(t *testing.T) {
	// 模拟 OpenAI SSE 流式服务
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("Authorization") != "Bearer test-api-key" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		flusher, ok := w.(http.Flusher)
		if !ok {
			t.Fatal("expected http.ResponseWriter to be Flusher")
		}

		chunks := []string{
			`data: {"choices":[{"delta":{"content":"Hello "}}]}`,
			`data: {"choices":[{"delta":{"content":"world!"}}]}`,
			`data: [DONE]`,
		}

		for _, chunk := range chunks {
			fmt.Fprintf(w, "%s\n\n", chunk)
			flusher.Flush()
			time.Sleep(10 * time.Millisecond)
		}
	}))
	defer server.Close()

	client := llm.NewOpenAIClient(server.URL, "test-api-key", "gpt-4o")

	var received strings.Builder
	req := llm.ChatRequest{
		Model: "gpt-4o",
		Messages: []llm.ChatMessage{
			{Role: "user", Content: "Hi"},
		},
	}

	err := client.StreamChat(context.Background(), req, func(chunk string) error {
		received.WriteString(chunk)
		return nil
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if received.String() != "Hello world!" {
		t.Fatalf("expected 'Hello world!', got '%s'", received.String())
	}
}

func TestOpenAIClient_StreamChat_Errors(t *testing.T) {
	t.Run("401 Unauthorized maps to Precondition", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, `{"error":{"message":"Invalid API key"}}`, http.StatusUnauthorized)
		}))
		defer server.Close()

		client := llm.NewOpenAIClient(server.URL, "invalid-key", "gpt-4o")
		err := client.StreamChat(context.Background(), llm.ChatRequest{}, func(chunk string) error { return nil })
		if err == nil {
			t.Fatal("expected error, got nil")
		}

		var bErr *errs.BlotError
		if !errors.As(err, &bErr) || bErr.Kind != errs.KindPrecondition {
			t.Fatalf("expected KindPrecondition, got %v", err)
		}
	})

	t.Run("429 RateLimit maps to External", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, `{"error":{"message":"Rate limit reached"}}`, http.StatusTooManyRequests)
		}))
		defer server.Close()

		client := llm.NewOpenAIClient(server.URL, "test-key", "gpt-4o")
		err := client.StreamChat(context.Background(), llm.ChatRequest{}, func(chunk string) error { return nil })
		if err == nil {
			t.Fatal("expected error, got nil")
		}

		var bErr *errs.BlotError
		if !errors.As(err, &bErr) || bErr.Kind != errs.KindExternal {
			t.Fatalf("expected KindExternal, got %v", err)
		}
	})
}

func TestOpenAIClient_StreamChat_CancelContext(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		flusher := w.(http.Flusher)
		for i := 0; i < 10; i++ {
			fmt.Fprintf(w, "data: {\"choices\":[{\"delta\":{\"content\":\"chunk%d\"}}]}\n\n", i)
			flusher.Flush()
			time.Sleep(50 * time.Millisecond)
		}
	}))
	defer server.Close()

	client := llm.NewOpenAIClient(server.URL, "test-key", "gpt-4o")
	ctx, cancel := context.WithCancel(context.Background())

	count := 0
	err := client.StreamChat(ctx, llm.ChatRequest{}, func(chunk string) error {
		count++
		if count >= 2 {
			cancel() // 收到2个chunk后主动取消
		}
		return nil
	})

	if err == nil {
		t.Fatal("expected error after context cancel, got nil")
	}
}

func TestOpenAIClient_TestConnection(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/models" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"id":"gpt-4o"}]}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	client := llm.NewOpenAIClient(server.URL, "test-key", "gpt-4o")
	err := client.TestConnection(context.Background())
	if err != nil {
		t.Fatalf("TestConnection failed: %v", err)
	}
}
