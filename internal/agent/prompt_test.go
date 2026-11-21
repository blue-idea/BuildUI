package agent

import (
	"strings"
	"testing"
)

// v1.REQ-003-AC-001: Agent 提示词装配与零占位符保障
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
