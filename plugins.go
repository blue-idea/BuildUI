package main

import (
	"buildui/internal/errs"
	"buildui/internal/plugins"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// 插件 RPC 复用服务校验，并为启动失败的桌面环境返回一致错误。
func (a *App) plugins() (*plugins.Service, error) {
	if a.pluginService == nil {
		return nil, errs.NewPreconditionError("Plugin storage is unavailable.", nil)
	}
	return a.pluginService, nil
}

func (a *App) ListPlugins() ([]plugins.Plugin, error) {
	s, err := a.plugins()
	if err != nil {
		return nil, err
	}
	return s.List(a.ctx)
}

func (a *App) SavePlugin(input plugins.Input) (plugins.Plugin, error) {
	s, err := a.plugins()
	if err != nil {
		return plugins.Plugin{}, err
	}
	return s.Save(a.ctx, input)
}

func (a *App) DeletePlugin(id int64) error {
	s, err := a.plugins()
	if err != nil {
		return err
	}
	return s.Delete(a.ctx, id)
}

func (a *App) SavePluginCredential(input plugins.CredentialEdit) (plugins.Plugin, error) {
	s, err := a.plugins()
	if err != nil {
		return plugins.Plugin{}, err
	}
	return s.SaveCredential(a.ctx, input)
}

func (a *App) ListPluginTools(id int64) ([]plugins.Tool, error) {
	s, err := a.plugins()
	if err != nil {
		return nil, err
	}
	return s.Tools(a.ctx, id)
}

func (a *App) SetPluginToolPermission(id int64, name string, allow bool) error {
	s, err := a.plugins()
	if err != nil {
		return err
	}
	return s.SetToolPermission(a.ctx, id, name, allow)
}

func (a *App) SignInPlugin(id int64, options plugins.OAuthOptions) (plugins.Plugin, error) {
	s, err := a.plugins()
	if err != nil {
		return plugins.Plugin{}, err
	}
	if err := s.SignIn(a.ctx, id, options, func(url string) error {
		runtime.BrowserOpenURL(a.ctx, url)
		return nil
	}); err != nil {
		return plugins.Plugin{}, err
	}
	return s.Get(a.ctx, id)
}

func (a *App) PluginOAuthRedirectURL() string { return plugins.OAuthRedirectURL() }

func (a *App) DisconnectPlugin(id int64) (plugins.Plugin, error) {
	s, err := a.plugins()
	if err != nil {
		return plugins.Plugin{}, err
	}
	if err := s.Disconnect(a.ctx, id); err != nil {
		return plugins.Plugin{}, err
	}
	return s.Get(a.ctx, id)
}
