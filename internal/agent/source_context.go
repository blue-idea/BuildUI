package agent

import (
	"path"
	"regexp"
	"slices"
	"strings"

	"buildui/internal/workspace"
)

var sourceMention = regexp.MustCompile(`@([a-zA-Z0-9_./-]+)[:\s]`)
var localSourceImport = regexp.MustCompile(`(?:\bfrom\s+|\bimport\s+)["']((?:@/|\.\.?/)[^"']+)["']`)

func sourceContext(root, prompt string) string {
	return sourceFilesContext(root, requestedSourcePaths(prompt))
}

func requestedSourcePaths(prompt string) []string {
	// 先加载首页依赖，避免其他路由的源码占满上下文后遗漏首页组件。
	paths := []string{"src/pages/Index.tsx", "src/App.tsx", "package.json"}
	for _, match := range sourceMention.FindAllStringSubmatch(prompt+" ", 5) {
		paths = append([]string{match[1]}, paths...)
	}
	return paths
}

func sourceFilesContext(root string, paths []string) string {
	var out strings.Builder
	seen := make(map[string]bool)
	for _, name := range paths {
		if seen[name] {
			continue
		}
		seen[name] = true
		if source, err := workspace.ReadSource(root, name); err == nil && len(source)+out.Len() < 64*1024 {
			out.WriteString("\nCurrent source: " + name + "\n" + source + "\n")
		}
	}
	return out.String()
}

func sourcePathsWithLocalImports(root string, files, all []string) []string {
	available := make(map[string]string, len(all))
	for _, name := range all {
		available[name] = name
		available[strings.TrimSuffix(name, path.Ext(name))] = name
	}
	result := slices.Clone(files)
	// 提供直接依赖的真实定义，避免模型猜测组件位置或接口。
	for _, name := range files {
		source, err := workspace.ReadSource(root, name)
		if err != nil {
			continue
		}
		for _, match := range localSourceImport.FindAllStringSubmatch(source, -1) {
			target := match[1]
			if rest, alias := strings.CutPrefix(target, "@/"); alias {
				target = path.Join("src", rest)
			} else {
				target = path.Join(path.Dir(name), target)
			}
			resolved := available[target]
			if resolved == "" {
				resolved = available[path.Join(target, "index")]
			}
			if resolved != "" {
				result = append(result, resolved)
			}
		}
	}
	return result
}
