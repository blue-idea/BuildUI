package plugins

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"buildui/internal/db"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestOAuthSignInPersistsAndDisconnects(t *testing.T) {
	ctx := context.Background()
	database, err := db.OpenMemory(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	dir := t.TempDir()
	s, err := NewService(database, dir)
	if err != nil {
		t.Fatal(err)
	}
	mcpServer := mcp.NewServer(&mcp.Implementation{Name: "OAuth fixture", Version: "1"}, nil)
	handler := mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server { return mcpServer }, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true})
	var origin string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var body any
		switch r.URL.Path {
		case "/mcp":
			if r.Header.Get("Authorization") != "Bearer fixture-token" {
				w.Header().Set("WWW-Authenticate", `Bearer resource_metadata="`+origin+`/.well-known/oauth-protected-resource/mcp"`)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			handler.ServeHTTP(w, r)
			return
		case "/.well-known/oauth-protected-resource/mcp":
			body = map[string]any{"resource": origin + "/mcp", "authorization_servers": []string{origin}}
		case "/.well-known/oauth-authorization-server":
			body = map[string]any{"issuer": origin, "authorization_endpoint": origin + "/authorize", "token_endpoint": origin + "/token", "registration_endpoint": origin + "/register", "response_types_supported": []string{"code"}, "code_challenge_methods_supported": []string{"S256"}, "token_endpoint_auth_methods_supported": []string{"none"}}
		case "/register":
			body = map[string]any{"client_id": "fixture-client", "token_endpoint_auth_method": "none"}
		case "/token":
			if r.FormValue("code_verifier") == "" || r.FormValue("code") != "fixture-code" {
				t.Error("authorization code or PKCE verifier missing")
			}
			body = map[string]any{"access_token": "fixture-token", "token_type": "Bearer"}
		default:
			http.NotFound(w, r)
			return
		}
		_ = json.NewEncoder(w).Encode(body)
	}))
	defer server.Close()
	origin = server.URL
	p, err := s.Save(ctx, Input{Name: "OAuth fixture", Transport: "http", Endpoint: origin + "/mcp", Enabled: true})
	if err != nil {
		t.Fatal(err)
	}
	err = s.SignIn(ctx, p.ID, OAuthOptions{}, func(authURL string) error {
		login, err := url.Parse(authURL)
		if err != nil {
			return err
		}
		q := login.Query()
		if q.Get("code_challenge_method") != "S256" {
			t.Error("OAuth browser request did not use PKCE")
		}
		resp, err := http.Get(q.Get("redirect_uri") + "?code=fixture-code&state=" + url.QueryEscape(q.Get("state")))
		if err != nil {
			return err
		}
		return resp.Body.Close()
	})
	if err != nil {
		t.Fatal(err)
	}
	s, err = NewService(database, dir)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Tools(ctx, p.ID); err != nil {
		t.Fatal(err)
	}
	if err := s.Disconnect(ctx, p.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Tools(ctx, p.ID); err == nil {
		t.Fatal("MCP connected after OAuth disconnect")
	}
}
