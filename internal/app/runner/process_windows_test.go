package runner

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

const previewHostFixtureEnv = "BUILDUI_TEST_PREVIEW_HOST_FIXTURE"

// v29.REQ-020 / AC-020-01：宿主被开发监听器直接结束时，子服务仍应释放端口。
func TestPreviewProcessTreeExitsWithHost(t *testing.T) {
	if root := os.Getenv(previewHostFixtureEnv); root != "" {
		runFixturePreviewHost(t, root)
		return
	}
	root := t.TempDir()
	files := map[string]string{
		"package.json": `{"name":"preview-host-fixture","scripts":{"dev":"node server.js"}}`,
		"server.js": `const http = require('node:http');
const server = http.createServer((_, res) => res.end('ok'));
server.listen(0, '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + server.address().port));`,
	}
	for name, body := range files {
		if err := os.WriteFile(filepath.Join(root, name), []byte(body), 0644); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.Mkdir(filepath.Join(root, "node_modules"), 0755); err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(t.Context(), 30*time.Second)
	defer cancel()
	host := exec.CommandContext(ctx, os.Args[0], "-test.run=^TestPreviewProcessTreeExitsWithHost$")
	host.Env = append(os.Environ(), previewHostFixtureEnv+"="+root)
	output, err := host.StdoutPipe()
	if err != nil {
		t.Fatal(err)
	}
	host.Stderr = os.Stderr
	if err := host.Start(); err != nil {
		t.Fatal(err)
	}
	defer host.Wait()
	defer host.Process.Kill()

	var preview RunAppResponse
	scanner := bufio.NewScanner(output)
	for scanner.Scan() {
		if raw, ok := strings.CutPrefix(scanner.Text(), "PREVIEW "); ok {
			if err := json.Unmarshal([]byte(raw), &preview); err != nil {
				t.Fatal(err)
			}
			break
		}
		t.Log(scanner.Text())
	}
	if preview.ProcessID == 0 || preview.PreviewURL == "" {
		t.Fatalf("preview fixture did not start: %v", scanner.Err())
	}
	address := strings.TrimPrefix(preview.PreviewURL, "http://")
	// 红灯阶段也只回收仍在监听的测试进程树。
	defer func() {
		if previewPortListening(address) {
			_ = killPreviewProcess(preview.ProcessID)
		}
	}()
	if !previewPortListening(address) {
		t.Fatalf("preview fixture was not listening on %s", address)
	}
	if err := host.Process.Kill(); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(4 * time.Second)
	for previewPortListening(address) && time.Now().Before(deadline) {
		time.Sleep(30 * time.Millisecond)
	}
	if previewPortListening(address) {
		t.Fatalf("preview process %d outlived its host on %s", preview.ProcessID, address)
	}
}

func previewPortListening(address string) bool {
	conn, err := net.DialTimeout("tcp", address, 120*time.Millisecond)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

func runFixturePreviewHost(t *testing.T, root string) {
	response, err := NewAppRunner(nil).StartApp(t.Context(), 1, root)
	if err != nil {
		t.Fatal(err)
	}
	encoded, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Printf("PREVIEW %s\n", encoded)
	// 主测试在收到地址后强制退出宿主，模拟 Wails 自动重编译。
	<-time.After(45 * time.Second)
}
