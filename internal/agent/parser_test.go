package agent

import (
	"strings"
	"testing"
)

// v1.REQ-003-AC-001: 增量流式 XML 状态机逐 Token 解析与事件分发
func TestXMLStreamParser_StreamingWriteFile(t *testing.T) {
	var chunks []string
	var toolStarts []ToolStartEvent
	var toolEnds []ToolEndEvent
	var writtenFiles []WrittenFile

	parser := NewXMLStreamParser(ParserCallbacks{
		OnChunk: func(chunk string) {
			chunks = append(chunks, chunk)
		},
		OnToolStart: func(event ToolStartEvent) {
			toolStarts = append(toolStarts, event)
		},
		OnToolEnd: func(event ToolEndEvent) {
			toolEnds = append(toolEnds, event)
		},
		OnWriteFile: func(path, description, content string) error {
			writtenFiles = append(writtenFiles, WrittenFile{
				Path:        path,
				Description: description,
				Content:     content,
			})
			return nil
		},
	})

	// 模拟分块流式 Token 输入（在标签和属性中间切断）
	tokens := []string{
		"I will create a component for you.\n",
		"<dyad-",
		"write path=\"src/components/",
		"Card.tsx\" description=\"Card component\">\n",
		"```tsx\n",
		"import React from 'react';\n",
		"export function Card() {\n",
		"  return <div>Card Content</div>;\n",
		"}\n",
		"```\n",
		"</dyad-write>\n",
		"已更新每日健身打卡。",
	}

	for _, token := range tokens {
		err := parser.Feed(token)
		if err != nil {
			t.Fatalf("feed error: %v", err)
		}
	}
	if err := parser.Flush(); err != nil {
		t.Fatalf("flush error: %v", err)
	}

	// 验证普通 Chunk 推送
	fullText := strings.Join(chunks, "")
	if !strings.Contains(fullText, "I will create a component for you.") {
		t.Errorf("missing intro text in chunks, got: %s", fullText)
	}
	if !strings.Contains(fullText, "已更新每日健身打卡。") {
		t.Errorf("missing outro text in chunks, got: %s", fullText)
	}

	// 验证工具调用事件
	if len(toolStarts) != 1 {
		t.Fatalf("expected 1 toolStart, got %d", len(toolStarts))
	}
	if toolStarts[0].Tool != "write_file" || toolStarts[0].Path != "src/components/Card.tsx" {
		t.Errorf("unexpected toolStart: %+v", toolStarts[0])
	}

	if len(toolEnds) != 1 {
		t.Fatalf("expected 1 toolEnd, got %d", len(toolEnds))
	}
	if !toolEnds[0].Success || toolEnds[0].Tool != "write_file" {
		t.Errorf("unexpected toolEnd: %+v", toolEnds[0])
	}

	// 验证落盘文件内容
	if len(writtenFiles) != 1 {
		t.Fatalf("expected 1 written file, got %d", len(writtenFiles))
	}
	if writtenFiles[0].Path != "src/components/Card.tsx" {
		t.Errorf("expected path src/components/Card.tsx, got %s", writtenFiles[0].Path)
	}
	if !strings.Contains(writtenFiles[0].Content, "export function Card()") {
		t.Errorf("expected content to contain export function Card(), got: %s", writtenFiles[0].Content)
	}
	if strings.Contains(writtenFiles[0].Content, "```") {
		t.Fatalf("文件仍包含模型的 Markdown 围栏：%q", writtenFiles[0].Content)
	}
}

func TestXMLStreamParser_RejectsTruncatedFile(t *testing.T) {
	written := false
	parser := NewXMLStreamParser(ParserCallbacks{OnWriteFile: func(_, _, _ string) error {
		written = true
		return nil
	}})
	if err := parser.Feed(`<dyad-write path="src/pages/Index.tsx">export default function Index() {`); err != nil {
		t.Fatal(err)
	}
	if err := parser.Flush(); err == nil || written {
		t.Fatalf("截断的模型工具调用必须报错且不能写入：%v, %t", err, written)
	}
}

// v1.REQ-003-AC-002: 增量流式识别 <dyad-add-dependency>
func TestXMLStreamParser_StreamingAddDependency(t *testing.T) {
	var toolStarts []ToolStartEvent
	var toolEnds []ToolEndEvent
	var installedDeps [][]string

	parser := NewXMLStreamParser(ParserCallbacks{
		OnToolStart: func(event ToolStartEvent) {
			toolStarts = append(toolStarts, event)
		},
		OnToolEnd: func(event ToolEndEvent) {
			toolEnds = append(toolEnds, event)
		},
		OnAddDependency: func(packages []string) error {
			installedDeps = append(installedDeps, packages)
			return nil
		},
	})

	input := `Now installing icons:
<dyad-add-dependency packages="lucide-react canvas-confetti"></dyad-add-dependency>
Dependencies added.`

	err := parser.Feed(input)
	if err != nil {
		t.Fatalf("feed error: %v", err)
	}
	if err := parser.Flush(); err != nil {
		t.Fatalf("flush error: %v", err)
	}

	if len(toolStarts) != 1 {
		t.Fatalf("expected 1 toolStart, got %d", len(toolStarts))
	}
	if toolStarts[0].Tool != "add_dependency" {
		t.Errorf("unexpected tool: %s", toolStarts[0].Tool)
	}

	if len(toolEnds) != 1 || !toolEnds[0].Success {
		t.Fatalf("expected 1 successful toolEnd")
	}

	if len(installedDeps) != 1 {
		t.Fatalf("expected 1 addDependency call, got %d", len(installedDeps))
	}
	if len(installedDeps[0]) != 2 || installedDeps[0][0] != "lucide-react" || installedDeps[0][1] != "canvas-confetti" {
		t.Errorf("unexpected packages: %v", installedDeps[0])
	}
}
