package plugins

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"buildui/internal/config"
	"github.com/modelcontextprotocol/go-sdk/auth"
	"github.com/modelcontextprotocol/go-sdk/oauthex"
	"golang.org/x/oauth2"
)

type OAuthOptions struct {
	ClientID     string `json:"clientId"`
	ClientSecret string `json:"clientSecret"`
	Scope        string `json:"scope"`
}

type oauthState struct {
	Config *oauth2.Config
	Token  *oauth2.Token
}

type oauthSource struct {
	source oauth2.TokenSource
}

func (s oauthSource) TokenSource(context.Context) (oauth2.TokenSource, error) { return s.source, nil }
func (s oauthSource) Authorize(_ context.Context, _ *http.Request, r *http.Response) error {
	_ = r.Body.Close()
	return errors.New("OAuth authorization expired. Sign in again from the plugin settings.")
}

func (s *Service) persistOAuth(ctx context.Context, id int64, attempt string, state oauthState) error {
	payload, err := json.Marshal(state)
	if err != nil {
		return err
	}
	protected, err := s.encrypt(-id, map[string]string{"oauth": string(payload)})
	if err != nil {
		return err
	}
	r, err := s.db.ExecContext(ctx, "UPDATE mcp_plugin_oauth SET credentials=? WHERE plugin_id=? AND attempt=? AND EXISTS (SELECT 1 FROM mcp_plugins WHERE id=? AND enabled)", protected, id, attempt, id)
	if err != nil {
		return err
	}
	count, err := r.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return errors.New("OAuth configuration changed. Sign in again.")
	}
	return nil
}

func (s *Service) readOAuth(ctx context.Context, id int64) (oauthState, string, error) {
	var state oauthState
	var stored, attempt string
	err := s.db.QueryRowContext(ctx, "SELECT credentials,attempt FROM mcp_plugin_oauth WHERE plugin_id=? AND credentials<>''", id).Scan(&stored, &attempt)
	if err != nil {
		return state, "", err
	}
	values, err := s.decrypt(-id, stored)
	if err != nil {
		return state, "", err
	}
	if err := json.Unmarshal([]byte(values["oauth"]), &state); err != nil || state.Token == nil || state.Config == nil {
		return state, "", errors.New("Saved OAuth credentials are unreadable. Disconnect and sign in again.")
	}
	return state, attempt, nil
}

func (s *Service) savedOAuth(ctx context.Context, id int64) (auth.OAuthHandler, error) {
	state, attempt, err := s.readOAuth(ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return oauthSource{source: oauth2.ReuseTokenSource(state.Token, oauthTokenFunc(func() (*oauth2.Token, error) {
		s.oauthMu.Lock()
		defer s.oauthMu.Unlock()
		current, active, err := s.readOAuth(ctx, id)
		if err != nil || active != attempt {
			return nil, errors.New("OAuth configuration changed. Sign in again.")
		}
		if current.Token.Valid() {
			return current.Token, nil
		}
		refreshCtx := context.WithValue(ctx, oauth2.HTTPClient, &http.Client{Timeout: config.MCPRequestTimeout})
		token, err := current.Config.TokenSource(refreshCtx, current.Token).Token()
		if err != nil {
			return nil, errors.New("OAuth refresh failed. Sign in again.")
		}
		current.Token = token
		if err := s.persistOAuth(ctx, id, attempt, current); err != nil {
			return nil, err
		}
		return token, nil
	}))}, nil
}

type oauthTokenFunc func() (*oauth2.Token, error)

func (f oauthTokenFunc) Token() (*oauth2.Token, error) { return f() }

func (s *Service) SignIn(ctx context.Context, id int64, opts OAuthOptions, openBrowser func(string) error) error {
	ctx, cancel := context.WithTimeout(ctx, config.MCPOAuthTimeout)
	defer cancel()
	p, stored, err := s.get(ctx, id)
	if err != nil {
		return err
	}
	if p.Transport != "http" || !p.Enabled {
		return errors.New("Enable an HTTP plugin before signing in.")
	}
	opts.ClientID = strings.TrimSpace(opts.ClientID)
	if opts.ClientID == "" && opts.ClientSecret != "" {
		return errors.New("A client ID is required when using a client secret.")
	}
	port := 0
	if opts.ClientID != "" {
		port = config.MCPOAuthPort
	}
	listener, err := net.Listen("tcp4", net.JoinHostPort("127.0.0.1", strconv.Itoa(port)))
	if err != nil {
		return errors.New("Could not open the local OAuth callback port.")
	}
	defer listener.Close()
	redirect := "http://" + listener.Addr().String() + "/oauth/callback"
	attempt := rand.Text()
	res, err := s.db.ExecContext(ctx, `INSERT INTO mcp_plugin_oauth(plugin_id,attempt)
		SELECT id,? FROM mcp_plugins WHERE id=? AND endpoint=? AND enabled
		ON CONFLICT(plugin_id) DO UPDATE SET attempt=excluded.attempt`, attempt, id, p.Endpoint)
	if err != nil {
		return err
	}
	if count, err := res.RowsAffected(); err != nil || count != 1 {
		return errors.New("The plugin configuration changed. Try signing in again.")
	}

	var granted *oauthState
	settings := &auth.AuthorizationCodeHandlerConfig{
		RedirectURL: redirect,
		AuthorizationCodeFetcher: func(ctx context.Context, args *auth.AuthorizationArgs) (*auth.AuthorizationResult, error) {
			return receiveOAuthCallback(ctx, listener, args.URL, openBrowser)
		},
		RequestRefreshToken: true,
		NewTokenSource: func(_ context.Context, cfg *oauth2.Config, token *oauth2.Token) (oauth2.TokenSource, error) {
			granted = &oauthState{Config: cfg, Token: token}
			return oauth2.StaticTokenSource(token), nil
		},
	}
	if scope := strings.Fields(opts.Scope); len(scope) > 0 {
		settings.ScopeFilter = func([]string) []string { return append([]string(nil), scope...) }
	}
	if opts.ClientID == "" {
		settings.DynamicClientRegistrationConfig = &auth.DynamicClientRegistrationConfig{Metadata: &oauthex.ClientRegistrationMetadata{
			ClientName: "BuildUI", RedirectURIs: []string{redirect}, TokenEndpointAuthMethod: "none",
			GrantTypes: []string{"authorization_code", "refresh_token"},
		}}
	} else if strings.HasPrefix(opts.ClientID, "https://") && opts.ClientSecret == "" {
		settings.ClientIDMetadataDocumentConfig = &auth.ClientIDMetadataDocumentConfig{URL: opts.ClientID}
	} else {
		settings.PreregisteredClient = &oauthex.ClientCredentials{ClientID: opts.ClientID}
		if opts.ClientSecret != "" {
			settings.PreregisteredClient.ClientSecretAuth = &oauthex.ClientSecretAuth{ClientSecret: opts.ClientSecret}
		}
	}
	handler, err := auth.NewAuthorizationCodeHandler(settings)
	if err != nil {
		return errors.New("Invalid OAuth configuration.")
	}
	session, err := s.connectWithOAuth(ctx, p, stored, handler)
	if err != nil {
		return err
	}
	defer session.Close()
	if granted == nil {
		return errors.New("The server accepted the connection without requesting OAuth.")
	}
	return s.persistOAuth(ctx, id, attempt, *granted)
}

func OAuthRedirectURL() string {
	return "http://127.0.0.1:" + strconv.Itoa(config.MCPOAuthPort) + "/oauth/callback"
}

func receiveOAuthCallback(ctx context.Context, listener net.Listener, authURL string, openBrowser func(string) error) (*auth.AuthorizationResult, error) {
	launch, err := url.Parse(authURL)
	if err != nil || (launch.Scheme != "https" && !(launch.Scheme == "http" && launch.Hostname() == "127.0.0.1")) {
		return nil, errors.New("The OAuth provider returned an invalid authorization URL.")
	}
	state := launch.Query().Get("state")
	result := make(chan auth.AuthorizationResult, 1)
	router := http.NewServeMux()
	router.HandleFunc("GET /oauth/callback", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		if state == "" || q.Get("state") != state {
			http.Error(w, "Invalid OAuth state.", http.StatusBadRequest)
			return
		}
		if q.Get("code") == "" {
			http.Error(w, "No OAuth authorization code was received.", http.StatusBadRequest)
		}
		select {
		case result <- auth.AuthorizationResult{Code: q.Get("code"), State: q.Get("state"), Iss: q.Get("iss")}:
			if q.Get("code") != "" {
				_, _ = w.Write([]byte("Authorization received. You can return to BuildUI."))
			}
		default:
			http.Error(w, "This callback has already been used.", http.StatusGone)
		}
	})
	server := &http.Server{Handler: router, ReadHeaderTimeout: config.MCPRequestTimeout}
	defer server.Close()
	go func() { _ = server.Serve(listener) }()
	if err := openBrowser(authURL); err != nil {
		return nil, err
	}
	select {
	case grant := <-result:
		if grant.Code == "" {
			return nil, errors.New("OAuth sign-in was declined.")
		}
		return &grant, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func (s *Service) Disconnect(ctx context.Context, id int64) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM mcp_plugin_oauth WHERE plugin_id=?", id)
	return err
}
