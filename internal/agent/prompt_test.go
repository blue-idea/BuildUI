package agent

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestNextProjectUsesAppRouterPrompt(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "next.config.ts"), []byte("export default {};"), 0644); err != nil {
		t.Fatal(err)
	}
	prompt := NewPromptAssembler().assembleProjectSystemPrompt(root)
	if !strings.Contains(prompt, "src/app/page.tsx") || strings.Contains(prompt, "TypeScript + Vite") {
		t.Fatal("Next.js generation must target its App Router entry and preserve its framework")
	}
}

// v1.REQ-003-AC-001 & v12.REQ-002 & v12.REQ-003: Agent 提示词装配与零占位符保障
func TestPromptAssembler_AssembleSystemPrompt(t *testing.T) {
	assembler := NewPromptAssembler()

	systemPrompt := assembler.AssembleSystemPrompt()

	// 验证核心角色定义
	if !strings.Contains(systemPrompt, "<role>") {
		t.Errorf("system prompt missing <role> block")
	}

	// 验证零占位符铁律 (Zero Placeholder Policy)
	if !strings.Contains(systemPrompt, "ZERO PLACEHOLDER") && !strings.Contains(systemPrompt, "no placeholder") && !strings.Contains(systemPrompt, "TODO") {
		t.Errorf("system prompt missing zero placeholder policy requirement")
	}

	// v12.REQ-003: 全功能可用 (FULLY FUNCTIONAL) 与严禁省略号代码
	if !strings.Contains(systemPrompt, "FULLY FUNCTIONAL") {
		t.Errorf("system prompt missing FULLY FUNCTIONAL constraint")
	}

	// v12.REQ-003: 内部文件即时创建铁律 (Immediate Internal File Creation)
	if !strings.Contains(systemPrompt, "IMMEDIATE FILE CREATION") || !strings.Contains(systemPrompt, "immediately create") {
		t.Errorf("system prompt missing immediate internal file creation rule")
	}

	// v12.REQ-002: 40+ shadcn/ui 组件库与内置原语说明
	if !strings.Contains(systemPrompt, "shadcn/ui") || !strings.Contains(systemPrompt, "@/components/ui/") {
		t.Errorf("system prompt missing shadcn/ui components guidelines")
	}

	// v12.REQ-002: 规范目录结构 (src/pages/, src/components/, src/pages/Index.tsx)
	if !strings.Contains(systemPrompt, "src/pages/") || !strings.Contains(systemPrompt, "src/components/") || !strings.Contains(systemPrompt, "src/pages/Index.tsx") {
		t.Errorf("system prompt missing folder structure specifications")
	}

	// v12.REQ-002: Tailwind CSS 独占且严格禁止自定义 CSS
	if !strings.Contains(systemPrompt, "Tailwind CSS") || !strings.Contains(systemPrompt, "PROHIBIT") || !strings.Contains(systemPrompt, "custom CSS") {
		t.Errorf("system prompt missing strict Tailwind CSS rule prohibiting custom CSS")
	}

	// 验证 XML 写盘标签语法说明
	if !strings.Contains(systemPrompt, "<dyad-write") {
		t.Errorf("system prompt missing <dyad-write> tag specification")
	}

	// 验证依赖自动安装说明
	if !strings.Contains(systemPrompt, "<dyad-add-dependency") {
		t.Errorf("system prompt missing <dyad-add-dependency> specification")
	}
}

func TestPromptAssembler_AssembleContextPrompt(t *testing.T) {
	assembler := NewPromptAssembler()

	ctxData := PromptContext{
		AppName:         "My Awesome App",
		DesignDirection: "Cyberpunk neon dark mode",
		PrimaryColor:    "#00ffcc",
		Visuals: []string{
			"Hero neon banner",
			"Cyber icon set",
		},
	}

	contextPrompt := assembler.AssembleContextPrompt(ctxData)

	if !strings.Contains(contextPrompt, "My Awesome App") {
		t.Errorf("context prompt missing AppName")
	}
	if !strings.Contains(contextPrompt, "Cyberpunk neon dark mode") {
		t.Errorf("context prompt missing DesignDirection")
	}
	if !strings.Contains(contextPrompt, "#00ffcc") {
		t.Errorf("context prompt missing PrimaryColor")
	}
	if !strings.Contains(contextPrompt, "Hero neon banner") {
		t.Errorf("context prompt missing Visuals")
	}
}

// v12.REQ-001: 蓝图必须包含设计方向、主色调、视觉资产清单（Logo、插图 prompts）
func TestBlueprintPrompt_ContainsVisualAssetsAndDesignDirection(t *testing.T) {
	if !strings.Contains(BlueprintPrompt, "designDirection") {
		t.Errorf("BlueprintPrompt missing designDirection")
	}
	if !strings.Contains(BlueprintPrompt, "primaryColor") {
		t.Errorf("BlueprintPrompt missing primaryColor")
	}
	if !strings.Contains(BlueprintPrompt, "visuals") || !strings.Contains(BlueprintPrompt, "logo") || !strings.Contains(BlueprintPrompt, "illustration") {
		t.Errorf("BlueprintPrompt missing visuals assets list prompts (logo, illustration)")
	}
}
