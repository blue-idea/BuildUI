package template

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"buildui/internal/config"
)

func downloadCommunityArchive(ctx context.Context, id, target string) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, config.TemplateArchiveBaseURL+id+"/zip/HEAD", nil)
	if err != nil {
		return err
	}
	client := http.Client{Timeout: config.TemplateArchiveTimeout}
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("GitHub archive returned HTTP %d", response.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, config.TemplateArchiveMaxSize+1))
	if err != nil {
		return err
	}
	if len(data) > config.TemplateArchiveMaxSize {
		return fmt.Errorf("community template archive exceeds the download limit")
	}
	archive, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return err
	}
	return unpackCommunityArchive(archive, target)
}

func unpackCommunityArchive(archive *zip.Reader, target string) error {
	if len(archive.File) > config.TemplateArchiveMaxFiles {
		return fmt.Errorf("community template archive contains too many entries")
	}
	remaining := uint64(config.TemplateArchiveMaxUnpack)
	for _, entry := range archive.File {
		// GitHub 将文件放在一层仓库目录下，只复制常规文件。
		_, name, _ := strings.Cut(strings.TrimSuffix(entry.Name, "/"), "/")
		if name == "" || !entry.Mode().IsRegular() {
			continue
		}
		if !portableArchivePath(name) {
			return fmt.Errorf("invalid path in community template archive")
		}
		if skipTemplatePath(name) {
			continue
		}
		if entry.UncompressedSize64 > remaining {
			return fmt.Errorf("community template archive exceeds the extraction limit")
		}
		remaining -= entry.UncompressedSize64
		dest := filepath.Join(target, name)
		if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
			return err
		}
		input, err := entry.Open()
		if err != nil {
			return err
		}
		err = writeTemplateFile(input, dest, entry.Mode().Perm())
		_ = input.Close()
		if err != nil {
			return err
		}
	}
	return nil
}

func portableArchivePath(name string) bool {
	if !fs.ValidPath(name) || !filepath.IsLocal(name) || strings.ContainsAny(name, "\\:") {
		return false
	}
	for _, part := range strings.Split(name, "/") {
		if strings.TrimRight(part, ". ") != part {
			return false
		}
	}
	return true
}

func skipTemplatePath(name string) bool {
	for _, part := range strings.Split(name, "/") {
		if strings.EqualFold(part, ".git") || strings.EqualFold(part, "node_modules") {
			return true
		}
	}
	return false
}
