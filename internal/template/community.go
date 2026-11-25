package template

import (
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"buildui/internal/config"
	"buildui/internal/errs"
	"buildui/internal/sysutil"
)

func (s *TemplateService) copyCommunity(ctx context.Context, entry AppTemplate, target string) error {
	if s.cacheRoot == "" {
		return errs.NewPreconditionError("The community template cache is unavailable.", nil)
	}
	s.repoMu.Lock()
	defer s.repoMu.Unlock()
	cache := filepath.Join(s.cacheRoot, config.CommunityTemplateCache)
	if err := os.MkdirAll(cache, 0755); err != nil {
		return err
	}
	key := sha256.Sum256([]byte(strings.ToLower(entry.ID)))
	repo := filepath.Join(cache, fmt.Sprintf("%x", key))
	if _, err := os.Stat(repo); err != nil {
		if !os.IsNotExist(err) {
			return err
		}
		staging, err := os.MkdirTemp(cache, "clone-")
		if err != nil {
			return err
		}
		defer os.RemoveAll(staging)
		sourceDir := filepath.Join(staging, "git")
		if err := templateGit(ctx, "clone", "--depth", "1", "--", entry.GitHubURL, sourceDir); err != nil {
			// HTTPS 归档兼容 Git 传输受限的网络环境。
			sourceDir = filepath.Join(staging, "archive")
			if err := downloadCommunityArchive(ctx, entry.ID, sourceDir); err != nil {
				return errs.NewExternalError("Could not download the community template.", err)
			}
		}
		if err := os.Rename(sourceDir, repo); err != nil {
			return err
		}
	} else if _, err := os.Stat(filepath.Join(repo, ".git")); err == nil {
		// 离线时继续使用此前成功下载的工作树。
		if err := templateGit(ctx, "-C", repo, "fetch", "--depth", "1", "origin", "HEAD"); err == nil {
			if err := templateGit(ctx, "-C", repo, "reset", "--hard", "FETCH_HEAD"); err != nil {
				return errs.NewExternalError("Could not update the community template cache.", err)
			}
		}
	}
	return copyRepository(repo, target)
}

func templateGit(ctx context.Context, args ...string) error {
	ctx, cancel := context.WithTimeout(ctx, config.TemplateGitTimeout)
	defer cancel()
	cmd := sysutil.CommandContext(ctx, "git", args...)
	cmd.Env = append(os.Environ(), "GIT_TERMINAL_PROMPT=0")
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("git %s: %w: %s", args[0], err, strings.TrimSpace(string(output)))
	}
	return nil
}

func copyRepository(source, target string) error {
	return filepath.WalkDir(source, func(name string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if name != source && skipTemplatePath(entry.Name()) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		rel, err := filepath.Rel(source, name)
		if err != nil {
			return err
		}
		dest := filepath.Join(target, rel)
		if entry.IsDir() {
			return os.MkdirAll(dest, 0755)
		}
		// 仅复制常规文件，避免模板链接指向工作区之外。
		if !entry.Type().IsRegular() {
			return nil
		}
		return copyTemplateFile(name, dest)
	})
}

func copyTemplateFile(source, target string) error {
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()
	info, err := input.Stat()
	if err != nil {
		return err
	}
	return writeTemplateFile(input, target, info.Mode().Perm())
}

func writeTemplateFile(input io.Reader, target string, mode fs.FileMode) error {
	output, err := os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, mode)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(output, input)
	closeErr := output.Close()
	if copyErr != nil {
		return copyErr
	}
	return closeErr
}
