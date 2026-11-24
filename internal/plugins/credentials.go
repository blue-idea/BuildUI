package plugins

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strconv"

	"buildui/internal/config"
)

func openCipher(dir string) (cipher.AEAD, error) {
	path := filepath.Join(dir, config.MCPKeyFile)
	key, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		key = make([]byte, 32)
		if _, err = rand.Read(key); err != nil {
			return nil, err
		}
		// 先完整写入临时文件，再发布，避免进程并发启动读到半个密钥。
		file, err := os.CreateTemp(dir, ".mcp-key-*")
		if err != nil {
			return nil, err
		}
		defer os.Remove(file.Name())
		_, writeErr := file.Write(key)
		if err = errors.Join(writeErr, file.Close()); err != nil {
			return nil, err
		}
		if err = os.Link(file.Name(), path); err != nil {
			if !errors.Is(err, os.ErrExist) {
				return nil, err
			}
			key, err = os.ReadFile(path)
			if err != nil {
				return nil, err
			}
		}
	}
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCMWithRandomNonce(block)
}

func credentialAAD(id int64) []byte { return []byte(strconv.FormatInt(id, 10)) }

func (s *Service) encrypt(id int64, values map[string]string) (string, error) {
	if len(values) == 0 {
		return "", nil
	}
	data, err := json.Marshal(values)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(s.cipher.Seal(nil, nil, data, credentialAAD(id))), nil
}

func (s *Service) decrypt(id int64, encoded string) (map[string]string, error) {
	values := make(map[string]string)
	if encoded == "" {
		return values, nil
	}
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err == nil && len(data) >= s.cipher.Overhead() {
		var plain []byte
		plain, err = s.cipher.Open(nil, nil, data, credentialAAD(id))
		if err == nil && json.Unmarshal(plain, &values) == nil {
			return values, nil
		}
	}
	return nil, errors.New("Saved plugin credentials could not be decrypted.")
}
