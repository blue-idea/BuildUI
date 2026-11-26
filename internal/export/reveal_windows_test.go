package export

import (
	"path/filepath"
	"slices"
	"testing"
)

func TestFileManagerCommandWindows(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "Sample AI App")
	file := filepath.Join(dir, "Sample AI App.txt")
	cases := []struct {
		name  string
		path  string
		isDir bool
		args  []string
	}{
		{name: "directory", path: dir, isDir: true, args: []string{"explorer.exe", dir}},
		{name: "file", path: file, args: []string{"explorer.exe", "/select,", file}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			cmd := fileManagerCommand(tc.path, tc.isDir)
			if cmd.SysProcAttr != nil && cmd.SysProcAttr.HideWindow {
				t.Fatal("Explorer must start with a visible window")
			}
			if !slices.Equal(cmd.Args, tc.args) {
				t.Fatalf("Explorer arguments = %q, want %q", cmd.Args, tc.args)
			}
		})
	}
}
