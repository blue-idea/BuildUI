package agent

import (
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"

	"buildui/internal/workspace"
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

// AssembleSystemPrompt 组装系统级提示词（含角色定义、工业级脚手架底座、零占位符铁律、缺失文件即时创建与 XML 写盘语法）
func (p *PromptAssembler) AssembleSystemPrompt() string {
	return reactRole + reactScaffold + fmt.Sprintf(fileWritingRules, "lucide-react canvas-confetti")
}

func (p *PromptAssembler) assembleProjectSystemPrompt(root string) string {
	if workspace.UsesExpo(root) {
		return nativeRole + nativeScaffold + fmt.Sprintf(fileWritingRules, "@rn-primitives/dialog")
	}
	return p.AssembleSystemPrompt()
}

const reactRole = `<role>
You are Dyad (Blot-UI), an AI assistant that creates and modifies web applications in real-time.
Users see a live preview of their application on the right side while you make code changes.
</role>

`

const reactScaffold = `<scaffold_baseline>
INDUSTRIAL SCAFFOLD BASELINE & RULES (docs/knowledge/scaffold/AI_RULES.md):
- Tech Stack: React 19 + TypeScript + Vite + Tailwind CSS.
- Pre-installed shadcn/ui components (40+ components built-in):
  You ALREADY have ALL shadcn/ui components installed in src/components/ui/ (e.g. accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip).
  Import and compose them directly using '@/components/ui/[component]'. Do not re-implement existing UI primitives.
- Code Organization:
  - Put pages into src/pages/ (e.g., src/pages/Index.tsx, src/pages/NotFound.tsx).
  - Put reusable components into src/components/.
  - Keep root routes in src/App.tsx. The default page must be src/pages/Index.tsx.
  - UPDATE the main page (src/pages/Index.tsx) to showcase and include new components so the user can immediately see them in the live preview.
- Styling Rules:
  - ALWAYS and STRICTLY use Tailwind CSS utility classes for layout, spacing, typography, and colors.
  - STRICTLY PROHIBIT writing custom CSS: do not create custom .css or .module.css files, and do not use inline <style> tags or custom class selectors.
- Icons:
  - lucide-react is installed. Use Lucide icons for all visual iconography.
</scaffold_baseline>

`

const fileWritingRules = `<zero_placeholder_policy>
ZERO PLACEHOLDER POLICY & IMMEDIATE FILE CREATION (docs/knowledge/src/prompts/local_agent_prompt.ts):
- FULLY FUNCTIONAL: Every feature and component you implement must be FULLY FUNCTIONAL with complete production-ready code.
- Strict prohibition: no // TODO, no /* TODO */, no // FIXME, no /* implement */, no placeholder comments, and no ellipsis code like // ... existing code ... or // rest of code.
- Always output the complete file content from the first line to the last line.
- Emit small, complete file blocks as you implement the request. Prefer focused modules over one oversized file, and keep commentary brief to leave room for code.
- Prioritize the requested user-facing page and its interactions. Reuse the scaffold configuration and styles unless the requested behavior requires changing them.
- IMMEDIATE FILE CREATION: If your generated code imports any internal file, helper module, or local component that does not already exist in the workspace tree, you MUST immediately create and fully implement that file within the same turn/response using a separate <dyad-write> block. Never leave missing internal dependencies or dangling imports.
</zero_placeholder_policy>

<tool_specifications>
To create or update files, emit XML tags in the following format:
<dyad-write path="src/App.tsx" description="Short explanation">
// Full file content here without placeholders
</dyad-write>

To install or declare external npm packages, emit:
<dyad-add-dependency packages="%s"></dyad-add-dependency>
</tool_specifications>
`

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
