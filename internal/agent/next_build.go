package agent

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"buildui/internal/config"
	"buildui/internal/errs"
	"buildui/internal/verification/tsc"
	"buildui/internal/workspace"
)

var nextBuildLocation = regexp.MustCompile(`^(?:\./)?(.+?\.(?:tsx?|jsx?|mjs|cjs|js|css|json))(?::(\d+):(\d+))?$`)
var ansiEscape = regexp.MustCompile(`\x1b\[[0-9;]*[A-Za-z]`)

// checkNextBuild 执行 Next.js 生产构建并将构建输出转换为自愈循环可消费的诊断。
func checkNextBuild(ctx context.Context, root string) ([]tsc.DiagnosticItem, error) {
	if err := workspace.EnsureProjectDependencies(ctx, root, "next"); err != nil {
		return nil, err
	}

	buildCtx, cancel := context.WithTimeout(ctx, config.NextBuildTimeout)
	defer cancel()
	cmd := workspace.PnpmCommand(buildCtx, root, "exec", "next", "build")
	cmd.Env = append(os.Environ(), "NEXT_TELEMETRY_DISABLED=1")
	out, err := cmd.CombinedOutput()
	if err == nil {
		return nil, nil
	}
	if buildCtx.Err() != nil {
		return nil, buildCtx.Err()
	}
	message := strings.TrimSpace(string(out))
	var exit *exec.ExitError
	if !errors.As(err, &exit) || message == "" {
		return nil, errs.NewExternalError("Next.js build could not run.", err)
	}
	if len(message) > config.NextBuildDiagnosticLimit {
		message = strings.ToValidUTF8(message[len(message)-config.NextBuildDiagnosticLimit:], "")
	}
	return parseNextBuildDiagnostics(root, message), nil
}

// parseNextBuildDiagnostics 解析 Next.js 的文件定位行与构建错误正文。
func parseNextBuildDiagnostics(root, output string) []tsc.DiagnosticItem {
	output = ansiEscape.ReplaceAllString(output, "")
	if parsed := tsc.ParseDiagnostics(output); len(parsed) > 0 {
		for i := range parsed {
			parsed[i].Tool = "Next.js"
		}
		return parsed
	}

	defaultFile := nextBuildDefaultFile(root, output)
	currentFile := defaultFile
	lineNumber, columnNumber := 1, 1
	var diagnostics []tsc.DiagnosticItem
	var message strings.Builder
	flush := func() {
		text := strings.TrimSpace(message.String())
		if text == "" {
			return
		}
		diagnostics = append(diagnostics, tsc.DiagnosticItem{
			Tool:     "Next.js",
			File:     currentFile,
			Line:     lineNumber,
			Column:   columnNumber,
			Message:  text,
			Severity: "error",
		})
		message.Reset()
	}

	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}
		if match := nextBuildLocation.FindStringSubmatch(line); len(match) == 4 {
			flush()
			currentFile = normalizeNextBuildFile(root, match[1], defaultFile)
			lineNumber, columnNumber = 1, 1
			if match[2] != "" {
				lineNumber, _ = strconv.Atoi(match[2])
				columnNumber, _ = strconv.Atoi(match[3])
			}
			continue
		}
		if isNextBuildErrorLine(line) {
			if message.Len() > 0 {
				message.WriteByte('\n')
			}
			message.WriteString(line)
			continue
		}
		if message.Len() > 0 && !isNextBuildProgressLine(line) {
			message.WriteByte('\n')
			message.WriteString(line)
		}
	}
	flush()
	if len(diagnostics) > 0 {
		return diagnostics
	}
	return []tsc.DiagnosticItem{{
		Tool:     "Next.js",
		File:     defaultFile,
		Line:     1,
		Column:   1,
		Message:  strings.TrimSpace(output),
		Severity: "error",
	}}
}

func isNextBuildErrorLine(line string) bool {
	return strings.HasPrefix(line, "Type error:") ||
		strings.HasPrefix(line, "Error:") ||
		strings.HasPrefix(line, "Module not found:") ||
		strings.HasPrefix(line, "Syntax error:") ||
		strings.Contains(line, "Parsing ecmascript source code failed") ||
		strings.Contains(line, "Unexpected token")
}

func isNextBuildProgressLine(line string) bool {
	return strings.HasPrefix(line, "▲") ||
		strings.HasPrefix(line, "✓") ||
		strings.HasPrefix(line, "○") ||
		strings.HasPrefix(line, "Import trace for requested module") ||
		strings.HasPrefix(line, "at ")
}

func normalizeNextBuildFile(root, name, fallback string) string {
	name = strings.TrimPrefix(filepath.ToSlash(strings.TrimSpace(name)), "./")
	if filepath.IsAbs(name) {
		if relative, err := filepath.Rel(root, name); err == nil {
			name = filepath.ToSlash(relative)
		}
	}
	name = filepath.ToSlash(filepath.Clean(name))
	if name == "." || strings.HasPrefix(name, "../") || strings.Contains(name, ":") {
		return fallback
	}
	if _, err := workspace.ReadSource(root, name); err == nil {
		return name
	}
	return fallback
}

func nextBuildDefaultFile(root, output string) string {
	for _, name := range []string{config.NextTemplatePage, config.NextTemplateLayout, config.NextTemplateConfig, "package.json"} {
		if strings.Contains(output, name) {
			if _, err := workspace.ReadSource(root, name); err == nil {
				return name
			}
		}
	}
	for _, name := range []string{config.NextTemplatePage, config.NextTemplateLayout, config.NextTemplateConfig, "package.json"} {
		if _, err := workspace.ReadSource(root, name); err == nil {
			return name
		}
	}
	return config.NextTemplatePage
}
