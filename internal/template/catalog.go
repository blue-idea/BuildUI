package template

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"slices"
	"strings"
	"sync"

	"buildui/internal/config"
	"buildui/internal/errs"
)

const SourceCommunity = "community"

type projectTemplateCatalog struct {
	DefaultID    string        `json:"defaultId"`
	SelectionKey string        `json:"selectionKey"`
	ConsentKey   string        `json:"consentKey"`
	Templates    []AppTemplate `json:"templates"`
}

var localCatalog = func() projectTemplateCatalog {
	var catalog projectTemplateCatalog
	if err := json.Unmarshal(config.ProjectTemplateCatalog, &catalog); err != nil {
		panic(err)
	}
	return catalog
}()

func DefaultID() string    { return localCatalog.DefaultID }
func SelectionKey() string { return localCatalog.SelectionKey }
func ConsentKey() string   { return localCatalog.ConsentKey }

func GetDefaultTemplates() []AppTemplate {
	entries := slices.Clone(localCatalog.Templates)
	for i := range entries {
		entries[i].Tags = slices.Clone(entries[i].Tags)
	}
	return entries
}

type TemplateService struct {
	cacheRoot  string
	catalogURL string
	client     *http.Client
	catalogMu  sync.Mutex
	community  []AppTemplate
	repoMu     sync.Mutex
}

func NewTemplateService() *TemplateService {
	return &TemplateService{
		catalogURL: config.CommunityTemplateURL,
		client:     &http.Client{Timeout: config.CommunityTemplateTimeout},
	}
}

func (s *TemplateService) SetCacheRoot(root string) { s.cacheRoot = root }

// List 始终返回内置目录。远端请求失败后的下一次调用可重试。
func (s *TemplateService) List(ctx context.Context) []AppTemplate {
	community, _ := s.communityCatalog(ctx)
	return append(GetDefaultTemplates(), community...)
}

func (s *TemplateService) Lookup(ctx context.Context, id string) (AppTemplate, error) {
	for _, entry := range localCatalog.Templates {
		if entry.ID == id {
			return entry, nil
		}
	}
	if IsCommunityID(id) {
		entries, err := s.communityCatalog(ctx)
		if err != nil {
			return AppTemplate{}, errs.NewExternalError("The community template catalog is unavailable. Try again later.", err)
		}
		for _, entry := range entries {
			if entry.ID == id {
				return entry, nil
			}
		}
	}
	return AppTemplate{}, errs.NewValidationError(fmt.Sprintf("Unknown template ID: %s", id), nil)
}

var communityID = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$`)

func IsCommunityID(id string) bool {
	return communityID.MatchString(id) && !strings.HasSuffix(strings.ToLower(id), ".git")
}

func (s *TemplateService) communityCatalog(ctx context.Context) ([]AppTemplate, error) {
	s.catalogMu.Lock()
	defer s.catalogMu.Unlock()
	if s.community != nil {
		return s.community, nil
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.catalogURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("community catalog returned HTTP %d", resp.StatusCode)
	}
	var records []struct {
		GitHubOrg   string `json:"githubOrg"`
		GitHubRepo  string `json:"githubRepo"`
		Title       string `json:"title"`
		Description string `json:"description"`
		ImageURL    string `json:"imageUrl"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, config.CommunityTemplateLimit)).Decode(&records); err != nil {
		return nil, err
	}
	entries := make([]AppTemplate, 0, len(records))
	seen := make(map[string]bool, len(records))
	for _, record := range records {
		id := record.GitHubOrg + "/" + record.GitHubRepo
		key := strings.ToLower(id)
		if !IsCommunityID(id) || seen[key] || strings.TrimSpace(record.Title) == "" {
			continue
		}
		seen[key] = true
		platform := "web"
		if strings.Contains(key, "react-native") || strings.Contains(key, "expo-template") {
			platform = "app"
		}
		entries = append(entries, AppTemplate{
			ID: id, Name: record.Title, Description: record.Description,
			Source: SourceCommunity, Platform: platform, Category: "Community", ThemeID: "default",
			GitHubURL: "https://github.com/" + id, ImageURL: record.ImageURL, Tags: []string{},
		})
	}
	s.community = entries
	return entries, nil
}
