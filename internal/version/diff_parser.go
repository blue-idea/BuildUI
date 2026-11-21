package version

import (
	"strings"
)

// ParseGitDiff 解析 git show / git diff 的输出文本为结构化的 FileDiff 列表
func ParseGitDiff(diffText string) []FileDiff {
	var results []FileDiff
	if strings.TrimSpace(diffText) == "" {
		return results
	}

	rawBlocks := strings.Split(diffText, "diff --git ")
	for _, block := range rawBlocks {
		trimmedBlock := strings.TrimSpace(block)
		if trimmedBlock == "" {
			continue
		}

		lines := strings.Split(trimmedBlock, "\n")
		firstLine := lines[0]
		// 形如 a/src/App.tsx b/src/App.tsx
		parts := strings.Fields(firstLine)
		if len(parts) < 2 {
			continue
		}

		filePath := parts[1]
		if strings.HasPrefix(filePath, "b/") {
			filePath = strings.TrimPrefix(filePath, "b/")
		}

		status := "modified"
		var hunks []string
		var currentHunk strings.Builder
		inHunk := false
		additions := 0
		deletions := 0

		for _, line := range lines[1:] {
			if strings.HasPrefix(line, "new file mode") {
				status = "added"
			} else if strings.HasPrefix(line, "deleted file mode") {
				status = "deleted"
			}

			if strings.HasPrefix(line, "@@") {
				if inHunk && currentHunk.Len() > 0 {
					hunks = append(hunks, currentHunk.String())
					currentHunk.Reset()
				}
				inHunk = true
				currentHunk.WriteString(line + "\n")
				continue
			}

			if inHunk {
				currentHunk.WriteString(line + "\n")
				if strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") {
					additions++
				} else if strings.HasPrefix(line, "-") && !strings.HasPrefix(line, "---") {
					deletions++
				}
			}
		}

		if inHunk && currentHunk.Len() > 0 {
			hunks = append(hunks, currentHunk.String())
		}

		results = append(results, FileDiff{
			Path:      filePath,
			Status:    status,
			Hunks:     hunks,
			Additions: additions,
			Deletions: deletions,
		})
	}

	return results
}
