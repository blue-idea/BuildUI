package agent

import (
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"
)

// HistoryMessage 历史消息元数据
type HistoryMessage struct {
	Role    string `json:"role"`    // user | assistant
	Content string `json:"content"` // 消息内容
}

// PromptContext 包含注入给大模型的上下文元数据
type PromptContext struct {
	AppName         string
	DesignDirection string
	PrimaryColor    string
	Visuals         []string
	WorkspaceTree   string
	HistoryMessages []HistoryMessage
}

// ScanWorkspaceTree 扫描工作区目录结构，排除 node_modules, .git 等非必要文件
func ScanWorkspaceTree(workspacePath string) (string, error) {
	var files []string
	ignoredDirs := map[string]bool{
		".git":         true,
		"node_modules": true,
		"dist":         true,
		".next":        true,
		"build":        true,
		"vendor":       true,
		".gemini":      true,
	}

	err := filepath.WalkDir(workspacePath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			if ignoredDirs[d.Name()] {
				return filepath.SkipDir
			}
			return nil
		}

		// 忽略隐藏文件与 SQLite 临时数据库
		if strings.HasPrefix(d.Name(), ".") || strings.HasSuffix(d.Name(), ".db") || strings.HasSuffix(d.Name(), ".db-journal") {
			return nil
		}

		relPath, err := filepath.Rel(workspacePath, path)
		if err == nil && relPath != "." {
			files = append(files, filepath.ToSlash(relPath))
		}
		return nil
	})

	if err != nil {
		return "", err
	}

	sort.Strings(files)
	return strings.Join(files, "\n"), nil
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

	// 注入工作区当前目录树
	if strings.TrimSpace(ctx.WorkspaceTree) != "" {
		sb.WriteString("<workspace_tree>\n")
		sb.WriteString(strings.TrimSpace(ctx.WorkspaceTree))
		sb.WriteString("\n</workspace_tree>\n")
	}

	// 注入多轮会话历史
	if len(ctx.HistoryMessages) > 0 {
		sb.WriteString("<conversation_history>\n")
		for _, msg := range ctx.HistoryMessages {
			sb.WriteString(fmt.Sprintf("<message role=\"%s\">%s</message>\n", msg.Role, msg.Content))
		}
		sb.WriteString("</conversation_history>\n")
	}

	return sb.String()
}
