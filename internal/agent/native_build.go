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

var (
	metroImportOrigin = regexp.MustCompile(`(?m)Unable to resolve [^\r\n]+? from ["']([^"']+)["']`)
	metroSyntaxOrigin = regexp.MustCompile(`(?m)SyntaxError: ([^\r\n]+?): [^\r\n]*\(([0-9]+):([0-9]+)\)`)
)

func checkNativeBundle(ctx context.Context, root, platform string) ([]tsc.DiagnosticItem, error) {
	if err := workspace.EnsureProjectDependencies(ctx, root, "expo"); err != nil {
		return nil, err
	}
	// 临时产物放在工作区外，构建检查和自动修复提交只包含源码。
	outputDir, err := os.MkdirTemp("", "buildui-expo-export-")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(outputDir)
	bundleCtx, cancel := context.WithTimeout(ctx, config.NativeBundleTimeout)
	defer cancel()
	cmd := workspace.ExpoCommand(bundleCtx, root, "export", "--platform", platform, "--output-dir", outputDir, "--max-workers", config.NativeMetroWorkers)
	out, err := cmd.CombinedOutput()
	if err == nil {
		return nil, nil
	}
	if bundleCtx.Err() != nil {
		return nil, bundleCtx.Err()
	}
	var exit *exec.ExitError
	message := strings.TrimSpace(string(out))
	if !errors.As(err, &exit) || message == "" {
		return nil, errs.NewExternalError("Expo Metro could not run.", err)
	}
	if len(message) > config.NativeMetroDiagnosticLimit {
		message = strings.ToValidUTF8(message[len(message)-config.NativeMetroDiagnosticLimit:], "")
	}
	return []tsc.DiagnosticItem{nativeBundleDiagnostic(root, message)}, nil
}

func nativeBundleDiagnostic(root, message string) tsc.DiagnosticItem {
	item := tsc.DiagnosticItem{Tool: "Expo Metro", Severity: "error", File: workspace.NativeEntry(root), Line: 1, Column: 1, Message: message}
	var origin string
	if match := metroSyntaxOrigin.FindStringSubmatch(message); match != nil {
		origin = match[1]
		item.Line, _ = strconv.Atoi(match[2])
		item.Column, _ = strconv.Atoi(match[3])
	} else if match := metroImportOrigin.FindStringSubmatch(message); match != nil {
		origin = match[1]
	}
	if filepath.IsAbs(origin) {
		origin, _ = filepath.Rel(root, origin)
	}
	if origin != "" {
		name := filepath.ToSlash(filepath.Clean(origin))
		if _, err := workspace.ReadSource(root, name); err == nil {
			item.File = name
		}
	} else {
		for _, name := range []string{"metro.config.js", "babel.config.js", "tailwind.config.js", "app.config.js", "package.json"} {
			if strings.Contains(message, name) {
				item.File = name
				break
			}
		}
	}
	return item
}
