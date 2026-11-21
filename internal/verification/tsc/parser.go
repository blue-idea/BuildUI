package tsc

import (
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

var (
	// regexFormat1: src/App.tsx(14,7): error TS2322: ...
	regexFormat1 = regexp.MustCompile(`^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(.+)$`)

	// regexFormat2: src/App.tsx:14:7 - error TS2322: ...
	regexFormat2 = regexp.MustCompile(`^(.+?):(\d+):(\d+)\s*-\s*(error|warning)\s+(.+)$`)
)

// normalizeFilePath 统一换行与路径分隔符，去除前导 ./
func normalizeFilePath(path string) string {
	clean := filepath.ToSlash(filepath.Clean(path))
	clean = strings.TrimPrefix(clean, "./")
	return clean
}

// ParseDiagnostics 将 tsc 命令行原始输出解析为结构化诊断条目
func ParseDiagnostics(rawOutput string) []DiagnosticItem {
	lines := strings.Split(rawOutput, "\n")
	var items []DiagnosticItem

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		if match := regexFormat1.FindStringSubmatch(trimmed); len(match) == 6 {
			lineNum, _ := strconv.Atoi(match[2])
			colNum, _ := strconv.Atoi(match[3])
			items = append(items, DiagnosticItem{
				File:     normalizeFilePath(match[1]),
				Line:     lineNum,
				Column:   colNum,
				Severity: strings.ToLower(match[4]),
				Message:  match[5],
			})
			continue
		}

		if match := regexFormat2.FindStringSubmatch(trimmed); len(match) == 6 {
			lineNum, _ := strconv.Atoi(match[2])
			colNum, _ := strconv.Atoi(match[3])
			items = append(items, DiagnosticItem{
				File:     normalizeFilePath(match[1]),
				Line:     lineNum,
				Column:   colNum,
				Severity: strings.ToLower(match[4]),
				Message:  match[5],
			})
			continue
		}
	}

	return items
}

// FilterDiagnostics 根据指定的文件路径或目录过滤诊断条目
func FilterDiagnostics(problems []DiagnosticItem, targetPaths []string) []DiagnosticItem {
	if len(targetPaths) == 0 {
		return problems
	}

	normalizedTargets := make([]string, len(targetPaths))
	for i, p := range targetPaths {
		normalizedTargets[i] = strings.TrimSuffix(normalizeFilePath(p), "/")
	}

	var filtered []DiagnosticItem
	for _, prob := range problems {
		normFile := prob.File
		matched := false
		for _, target := range normalizedTargets {
			// 精确文件匹配
			if normFile == target {
				matched = true
				break
			}
			// 目录前缀匹配
			if strings.HasPrefix(normFile, target+"/") {
				matched = true
				break
			}
		}
		if matched {
			filtered = append(filtered, prob)
		}
	}

	return filtered
}
