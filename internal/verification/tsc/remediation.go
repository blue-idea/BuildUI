package tsc

import (
	"fmt"
	"strings"
)

// BuildRemediationPrompt 构造自愈修复 Prompt
func BuildRemediationPrompt(problems []DiagnosticItem) string {
	var sb strings.Builder
	tool := DiagnosticTool(problems)
	fmt.Fprintf(&sb, "%s compilation failed with the following diagnostic errors:\n\n", tool)

	for _, p := range problems {
		sb.WriteString(fmt.Sprintf("%s:%d:%d: %s %s\n", p.File, p.Line, p.Column, p.Severity, p.Message))
	}

	fmt.Fprintf(&sb, `
Please resolve all reported %s errors in the affected files.
Strictly adhere to the ZERO PLACEHOLDER POLICY:
- Provide the complete, functional source code for each fixed file without TODO or placeholder comments.
- Emit output using the structured tag:
<dyad-write path="path/to/file.tsx" description="Fix %s compilation error">
// Full corrected source code here
</dyad-write>
`, tool, tool)

	return sb.String()
}

// DiagnosticTool 为既有 TypeScript 诊断提供默认工具名称。
func DiagnosticTool(problems []DiagnosticItem) string {
	if len(problems) > 0 && problems[0].Tool != "" {
		return problems[0].Tool
	}
	return "TypeScript"
}
