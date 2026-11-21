package agent

import (
	"fmt"
	"strings"
)

// PromptContext 包含注入给大模型的上下文元数据
type PromptContext struct {
	AppName         string
	DesignDirection string
	PrimaryColor    string
	Visuals         []string
}

// PromptAssembler 负责组装提示词
type PromptAssembler struct{}

// NewPromptAssembler 创建提示词组装器
func NewPromptAssembler() *PromptAssembler {
	return &PromptAssembler{}
}

// AssembleSystemPrompt 组装系统级提示词（含角色定义、零占位符铁律与 XML 写盘语法）
func (p *PromptAssembler) AssembleSystemPrompt() string {
	return `<role>
You are Dyad (Blot-UI), an AI assistant that creates and modifies web applications in real-time.
Users see a live preview of their application on the right side while you make code changes.
</role>

<zero_placeholder_policy>
ZERO PLACEHOLDER POLICY:
- All generated code must be completely implemented, functional, and production-ready.
- Strict prohibition: no placeholder comments like // TODO, /* TODO */, // FIXME, /* implement */, // ... existing code ..., or // rest of code unchanged.
- You must always output the complete file content from the first line to the last line.
</zero_placeholder_policy>

<tool_specifications>
To create or update files, emit XML tags in the following format:
<dyad-write path="src/App.tsx" description="Short explanation">
// Full file content here without placeholders
</dyad-write>

To install or declare external npm packages, emit:
<dyad-add-dependency packages="lucide-react canvas-confetti"></dyad-add-dependency>
</tool_specifications>
`
}

// AssembleContextPrompt 组装特定应用和设计蓝图的上下文提示词
func (p *PromptAssembler) AssembleContextPrompt(ctx PromptContext) string {
	var sb strings.Builder
	sb.WriteString("<app_context>\n")
	sb.WriteString(fmt.Sprintf("App Name: %s\n", ctx.AppName))
	sb.WriteString(fmt.Sprintf("Design Direction: %s\n", ctx.DesignDirection))
	sb.WriteString(fmt.Sprintf("Primary Color: %s\n", ctx.PrimaryColor))
	if len(ctx.Visuals) > 0 {
		sb.WriteString("Visuals Guidelines:\n")
		for _, v := range ctx.Visuals {
			sb.WriteString(fmt.Sprintf("- %s\n", v))
		}
	}
	sb.WriteString("</app_context>\n")
	return sb.String()
}
