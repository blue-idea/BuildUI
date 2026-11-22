package agent

import (
	"os"
	"path/filepath"
	"testing"
)

// v1.REQ-003-AC-001: 校验零占位符与安全落盘
func TestFileWriter_ValidatePlaceholders(t *testing.T) {
	writer := NewFileWriter("/fake/workspace")

	// 含有 // TODO 占位符的代码应当被拦截
	badCode1 := `
import React from 'react';
export function Header() {
	// TODO: implement header links
	return <header>Title</header>;
}
`
	err := writer.ValidateContent(badCode1)
	if err == nil {
		t.Fatalf("expected error for code containing // TODO, got nil")
	}

	// 含有 /* implement */ 占位符的代码应当被拦截
	badCode2 := `
export function computeTotal() {
	/* implement */
	return 0;
}
`
	err = writer.ValidateContent(badCode2)
	if err == nil {
		t.Fatalf("expected error for code containing /* implement */, got nil")
	}

	// 含有 // ... existing code ... 占位符的代码应当被拦截
	badCode3 := `
// ... existing code ...
export const version = '1.0';
`
	err = writer.ValidateContent(badCode3)
	if err == nil {
		t.Fatalf("expected error for code containing ellipsis placeholder, got nil")
	}

	// 含有 // rest of code unchanged 或 /* rest of code unchanged */ 应当被拦截
	badCode4 := `
export function renderHeader() { return <h1>Header</h1>; }
// rest of code unchanged
`
	err = writer.ValidateContent(badCode4)
	if err == nil {
		t.Fatalf("expected error for code containing 'rest of code unchanged', got nil")
	}

	// 含有 /* ... existing code ... */ 块注释占位符应当被拦截
	badCode5 := `
/* ... existing code ... */
export const count = 42;
`
	err = writer.ValidateContent(badCode5)
	if err == nil {
		t.Fatalf("expected error for code containing '/* ... existing code ... */', got nil")
	}

	// 含有 /* FIXME */ 块注释应当被拦截
	badCode6 := `
/* FIXME: fix login token expiration */
export function login() {}
`
	err = writer.ValidateContent(badCode6)
	if err == nil {
		t.Fatalf("expected error for code containing '/* FIXME */', got nil")
	}

	// 正常全功能代码应通过验证
	goodCode := `
import React from 'react';
export function Header() {
	return <header className="p-4 bg-slate-900 text-white">Title</header>;
}
`
	err = writer.ValidateContent(goodCode)
	if err != nil {
		t.Fatalf("unexpected error for valid code: %v", err)
	}
}

func TestFileWriter_WriteFile_SecurityAndSuccess(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "agent_writer_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	writer := NewFileWriter(tempDir)

	// 测试路径穿越拦截
	traversalPath := "../outside.txt"
	err = writer.WriteFile(traversalPath, "content")
	if err == nil {
		t.Fatalf("expected error for path traversal, got nil")
	}

	// 测试合法路径写入及自动创建父目录
	validRelPath := filepath.Join("src", "components", "Button.tsx")
	content := "export function Button() { return <button>Click</button>; }"
	err = writer.WriteFile(validRelPath, content)
	if err != nil {
		t.Fatalf("unexpected error writing file: %v", err)
	}

	// 验证文件在磁盘上正确存在且内容一致
	fullPath := filepath.Join(tempDir, validRelPath)
	data, err := os.ReadFile(fullPath)
	if err != nil {
		t.Fatalf("failed to read written file: %v", err)
	}
	if string(data) != content {
		t.Fatalf("content mismatch. expected %q, got %q", content, string(data))
	}
}
