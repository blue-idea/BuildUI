package tsc

import (
	"fmt"
	"strings"
)

// BuildRemediationPrompt 构造自愈修复 Prompt
func BuildRemediationPrompt(problems []DiagnosticItem) string {
	var sb strings.Builder
	sb.WriteString("TypeScript compilation failed with the following diagnostic errors:\n\n")

	for _, p := range problems {
		sb.WriteString(fmt.Sprintf("%s:%d:%d: %s %s\n", p.File, p.Line, p.Column, p.Severity, p.Message))
	}

	sb.WriteString(`
Please resolve all reported TypeScript errors in the affected files.
Strictly adhere to the ZERO PLACEHOLDER POLICY:
- Provide the complete, functional source code for each fixed file without TODO or placeholder comments.
- Emit output using the structured tag:
<dyad-write path="path/to/file.tsx" description="Fix TypeScript compilation error">
// Full corrected source code here
</dyad-write>
`)

	return sb.String()
}
