package workspace

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestEnsureProjectDependenciesRepairsInterruptedPnpmInstall(t *testing.T) {
	root := t.TempDir()
	modules := filepath.Join(root, "node_modules")
	if err := os.MkdirAll(filepath.Join(modules, ".pnpm"), 0755); err != nil {
		t.Fatal(err)
	}
	bin := t.TempDir()
	name := "pnpm"
	command := filepath.Join(modules, ".bin", "tsc")
	script := "#!/bin/sh\nprintf '%s\\n' \"$*\" > install-args.txt\ntouch node_modules/.modules.yaml\nmkdir -p node_modules/.bin\ntouch node_modules/.bin/tsc\nchmod +x node_modules/.bin/tsc\n"
	if runtime.GOOS == "windows" {
		name += ".cmd"
		command += ".cmd"
		script = "@echo off\r\necho %* > install-args.txt\r\ntype nul > node_modules\\.modules.yaml\r\nif not exist node_modules\\.bin mkdir node_modules\\.bin\r\ntype nul > node_modules\\.bin\\tsc.cmd\r\n"
	}
	if err := os.WriteFile(filepath.Join(bin, name), []byte(script), 0755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", bin+string(os.PathListSeparator)+os.Getenv("PATH"))

	if err := EnsureProjectDependencies(t.Context(), root); err != nil {
		t.Fatal(err)
	}
	argsPath := filepath.Join(root, "install-args.txt")
	args, err := os.ReadFile(argsPath)
	if err != nil || !strings.Contains(string(args), "install --no-prod") {
		t.Fatalf("依赖未安装完时应补齐开发依赖：%s, %v", args, err)
	}

	if err := os.Remove(argsPath); err != nil {
		t.Fatal(err)
	}
	if err := EnsureProjectDependencies(t.Context(), root, "tsc"); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(argsPath); !os.IsNotExist(err) {
		t.Fatalf("已完成安装的项目无需重复安装：%v", err)
	}
	if err := os.Remove(command); err != nil {
		t.Fatal(err)
	}
	if err := EnsureProjectDependencies(t.Context(), root, "tsc"); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(command); err != nil {
		t.Fatalf("已有安装标记但缺少 tsc 时也应补齐依赖：%v", err)
	}
}
