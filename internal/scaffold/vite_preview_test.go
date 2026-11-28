package scaffold

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func TestRefreshVitePreviewInspector(t *testing.T) {
	legacy := []byte("// BuildUI preview\n")
	custom := []byte("// Custom preview\n")
	current := []byte("// Current BuildUI preview\n")
	legacyHashes := []string{fmt.Sprintf("%x", sha256.Sum256(legacy))}

	for _, tc := range []struct {
		name   string
		before []byte
		want   []byte
	}{
		{name: "legacy", before: legacy, want: current},
		{name: "legacy CRLF", before: bytes.ReplaceAll(legacy, []byte("\n"), []byte("\r\n")), want: current},
		{name: "custom", before: custom, want: custom},
		{name: "absent"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "preview-inspector.js")
			if tc.before != nil {
				if err := os.WriteFile(path, tc.before, 0644); err != nil {
					t.Fatal(err)
				}
			}
			if err := refreshVitePreviewInspector(path, current, legacyHashes); err != nil {
				t.Fatal(err)
			}
			actual, err := os.ReadFile(path)
			if tc.want == nil && os.IsNotExist(err) {
				return
			}
			if err != nil || !bytes.Equal(actual, tc.want) {
				t.Fatalf("unexpected inspector content %q: %v", actual, err)
			}
		})
	}
}
