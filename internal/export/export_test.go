package export_test

import (
	"archive/zip"
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"buildui/internal/export"
)

// v3.REQ-003-AC-001 & v3.REQ-003-AC-002: 工程 Zip 归档过滤与原生资源管理器定位测试
func TestExportService_ExportAppZipAndReveal(t *testing.T) {
	ctx := context.Background()

	// 1. 创建模拟应用目录
	tempAppDir, err := os.MkdirTemp("", "blot-export-src-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempAppDir)

	// 创建正常工程文件
	_ = os.WriteFile(filepath.Join(tempAppDir, "package.json"), []byte(`{"name":"test"}`), 0644)
	_ = os.MkdirAll(filepath.Join(tempAppDir, "src"), 0755)
	_ = os.WriteFile(filepath.Join(tempAppDir, "src", "App.tsx"), []byte(`export default () => <div>Test</div>`), 0644)

	// 创建应当被过滤排除的目录
	_ = os.MkdirAll(filepath.Join(tempAppDir, ".git"), 0755)
	_ = os.WriteFile(filepath.Join(tempAppDir, ".git", "config"), []byte(`git config`), 0644)
	_ = os.MkdirAll(filepath.Join(tempAppDir, "node_modules", "pkg"), 0755)
	_ = os.WriteFile(filepath.Join(tempAppDir, "node_modules", "pkg", "index.js"), []byte(`console.log()`), 0644)
	_ = os.MkdirAll(filepath.Join(tempAppDir, "dist"), 0755)
	_ = os.WriteFile(filepath.Join(tempAppDir, "dist", "bundle.js"), []byte(`bundled`), 0644)

	svc := export.NewExportService()

	// 2. 导出为 Zip
	destZip := filepath.Join(tempAppDir, "output.zip")
	outPath, err := svc.ExportAppZip(ctx, tempAppDir, destZip)
	if err != nil {
		t.Fatalf("ExportAppZip failed: %v", err)
	}

	if outPath != destZip {
		t.Fatalf("expected outPath %s, got %s", destZip, outPath)
	}

	info, err := os.Stat(outPath)
	if err != nil || info.Size() == 0 {
		t.Fatalf("zip file not created or empty: %v", err)
	}

	// 3. 验证 Zip 包内文件条目过滤正确性
	zipReader, err := zip.OpenReader(outPath)
	if err != nil {
		t.Fatalf("failed to open zip reader: %v", err)
	}
	defer zipReader.Close()

	foundFiles := make(map[string]bool)
	for _, f := range zipReader.File {
		cleanName := filepath.ToSlash(f.Name)
		foundFiles[cleanName] = true

		if strings.HasPrefix(cleanName, ".git") || strings.HasPrefix(cleanName, "node_modules") || strings.HasPrefix(cleanName, "dist") {
			t.Fatalf("forbidden excluded entry found in zip: %s", cleanName)
		}
	}

	if !foundFiles["package.json"] {
		t.Errorf("missing package.json in zip")
	}
	if !foundFiles["src/App.tsx"] {
		t.Errorf("missing src/App.tsx in zip")
	}

	// 4. 原生文件管理器调用测试（路径存在时无错误）
	err = svc.OpenInFileManager(tempAppDir)
	if err != nil {
		t.Fatalf("OpenInFileManager unexpected error: %v", err)
	}

	// 路径不存在时应当抛出错误
	err = svc.OpenInFileManager(filepath.Join(tempAppDir, "non_existent_folder_12345"))
	if err == nil {
		t.Fatalf("expected error for non-existent path, got nil")
	}
}
