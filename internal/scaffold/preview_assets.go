package scaffold

import (
	"io/fs"
	"os"
	"path"
	"path/filepath"

	"buildui/internal/config"
)

// preparePreviewAssets 将运行时适配器和浏览器检查脚本放在同一个临时目录，供开发服务器同时加载。
func preparePreviewAssets(project, cacheDirectory string, adapters fs.FS, entry string, extra ...string) (string, func(), error) {
	cache, err := filepath.Abs(filepath.Join(project, cacheDirectory))
	if err != nil {
		return "", nil, err
	}
	if err := os.MkdirAll(cache, 0755); err != nil {
		return "", nil, err
	}
	dir, err := os.MkdirTemp(cache, "buildui-preview-")
	if err != nil {
		return "", nil, err
	}
	cleanup := func() { _ = os.RemoveAll(dir) }
	write := func(assets fs.FS, name string) error {
		data, err := fs.ReadFile(assets, name)
		if err != nil {
			return err
		}
		return os.WriteFile(filepath.Join(dir, path.Base(name)), data, 0600)
	}
	for _, name := range append([]string{entry}, extra...) {
		if err := write(adapters, name); err != nil {
			cleanup()
			return "", nil, err
		}
	}
	if err := write(templateFS, config.ReactPreviewInspectorAsset); err != nil {
		cleanup()
		return "", nil, err
	}
	return filepath.Join(dir, path.Base(entry)), cleanup, nil
}
