import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { ThemeProvider } from '../context/ThemeContext';

describe('SettingsModal', () => {
  it('renders correctly when open and switches presets', async () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    expect(screen.getByText('LLM Provider Settings')).toBeDefined();
    expect(screen.getByText('Base URL')).toBeDefined();
    expect(screen.getByText('API Key')).toBeDefined();

    // 切换预设到 DeepSeek
    const providerSelect = screen.getByLabelText('Select Provider');
    fireEvent.change(providerSelect, { target: { value: 'deepseek' } });

    // 检查是否自动填充 deepseek 的 Base URL
    const baseUrlInput = screen.getByPlaceholderText('https://api.deepseek.com/v1') as HTMLInputElement;
    expect(baseUrlInput).toBeDefined();
    expect(baseUrlInput.value).toBe('https://api.deepseek.com/v1');
  });

  it('triggers test connection and displays result', async () => {
    const handleTest = vi.fn().mockResolvedValue('Connection established successfully');

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onTestConnection={handleTest}
      />
    );

    const testBtn = screen.getByRole('button', { name: 'Test Connection' });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(handleTest).toHaveBeenCalled();
      expect(screen.getByText(/Connection established successfully/)).toBeDefined();
    });
  });

  it('saves settings with entered values', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    const apiKeyInput = screen.getByPlaceholderText('sk-...') as HTMLInputElement;
    fireEvent.change(apiKeyInput, { target: { value: 'sk-my-secret-key' } });

    const saveBtn = screen.getByRole('button', { name: 'Save Settings' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          'llm.api_key': 'sk-my-secret-key',
        })
      );
    });
  });

  it('supports tab switching between providers without losing entered credentials', async () => {
    const handleSave = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    // 切换到 DeepSeek Tab
    const deepseekTab = screen.getByRole('tab', { name: /DeepSeek/i });
    fireEvent.click(deepseekTab);

    // 填写 DeepSeek API Key
    const apiKeyInput = screen.getByPlaceholderText('sk-...') as HTMLInputElement;
    fireEvent.change(apiKeyInput, { target: { value: 'sk-deepseek-tab-key' } });
    expect(apiKeyInput.value).toBe('sk-deepseek-tab-key');

    // 切换到 OpenAI Tab
    const openaiTab = screen.getByRole('tab', { name: /OpenAI/i });
    fireEvent.click(openaiTab);

    // 填写 OpenAI API Key
    fireEvent.change(apiKeyInput, { target: { value: 'sk-openai-tab-key' } });
    expect(apiKeyInput.value).toBe('sk-openai-tab-key');

    // 切换回 DeepSeek Tab，原填写的凭据应保留
    fireEvent.click(deepseekTab);
    expect(apiKeyInput.value).toBe('sk-deepseek-tab-key');

    // 保存设置，应同时持久化两个 provider 的配置
    const saveBtn = screen.getByRole('button', { name: 'Save Settings' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          'llm.providers.deepseek.api_key': 'sk-deepseek-tab-key',
          'llm.providers.openai.api_key': 'sk-openai-tab-key',
        })
      );
    });
  });

  it('renders left-side navigation tabs and switches to Storage & Workspace tab', async () => {
    const handleSave = vi.fn();
    const handleSelectDir = vi.fn().mockResolvedValue('D:\\MyWorkspace');

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        onSelectDirectory={handleSelectDir}
        initialSettings={{
          'workspace.dir': 'C:\\DefaultWorkspace',
        }}
      />
    );

    // 检查左侧 Tab 导航项存在
    const workspaceNavTab = screen.getByTestId('settings-nav-workspace');
    expect(workspaceNavTab).toBeDefined();

    // 点击切换至存储与工作区 Tab
    fireEvent.click(workspaceNavTab);

    // 检查展示本地工作区存储路径标题和输入框
    const dirInput = screen.getByTestId('workspace-dir-input') as HTMLInputElement;
    expect(dirInput).toBeDefined();
    expect(dirInput.value).toBe('C:\\DefaultWorkspace');

    // 测试点击选择目录按钮
    const browseBtn = screen.getByTestId('browse-workspace-btn');
    fireEvent.click(browseBtn);

    await waitFor(() => {
      expect(handleSelectDir).toHaveBeenCalled();
      expect(dirInput.value).toBe('D:\\MyWorkspace');
    });

    // 手动修改工作区路径
    fireEvent.change(dirInput, { target: { value: 'E:\\CustomWorkspace' } });
    expect(dirInput.value).toBe('E:\\CustomWorkspace');

    // 保存并验证 workspace.dir 提交
    const saveBtn = screen.getByRole('button', { name: 'Save Settings' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          'workspace.dir': 'E:\\CustomWorkspace',
        })
      );
    });
  });

  it('renders Appearance tab and allows toggling theme', async () => {
    render(
      <ThemeProvider initialMode="light">
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    // 切换到外观与主题 Tab
    const appearanceTab = screen.getByTestId('settings-nav-appearance');
    fireEvent.click(appearanceTab);

    expect(screen.getAllByText('Appearance & Themes').length).toBeGreaterThan(0);

    // 点击切换为暗黑模式
    const darkBtn = screen.getByTestId('theme-mode-dark');
    fireEvent.click(darkBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // 点击切换回浅色模式
    const lightBtn = screen.getByTestId('theme-mode-light');
    fireEvent.click(lightBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('lists configured providers in the preferences page and displays details', async () => {
    const initialSettings = {
      'llm.provider_ids': 'openai,ollama',
      'llm.active_provider': 'ollama',
      'llm.providers.openai.name': 'OpenAI (Official)',
      'llm.providers.openai.base_url': 'https://api.openai.com/v1',
      'llm.providers.openai.api_key': 'sk-test-openai',
      'llm.providers.openai.model': 'gpt-4o',
      'llm.providers.ollama.name': 'Ollama (Local)',
      'llm.providers.ollama.base_url': 'http://localhost:11434/v1',
      'llm.providers.ollama.api_key': '',
      'llm.providers.ollama.model': 'qwen2.5-coder',
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        initialSettings={initialSettings}
      />
    );

    // 偏好设置中列出已设置的 Provider
    const providerList = screen.getByTestId('configured-providers-list');
    expect(providerList).toBeDefined();

    // 检查 OpenAI 和 Ollama 在列表中渲染
    expect(providerList.textContent).toContain('OpenAI (Official)');
    expect(providerList.textContent).toContain('Ollama (Local)');
    expect(providerList.textContent).toContain('qwen2.5-coder');
    expect(providerList.textContent).toContain('gpt-4o');
  });

  it('通过 Add Provider 新建 Custom，并支持配置无需 API Key 的本地端点', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        initialSettings={{
          'llm.provider_ids': 'openai',
          'llm.providers.openai.base_url': 'https://api.openai.com/v1',
          'llm.providers.openai.api_key': 'sk-test',
          'llm.providers.openai.model': 'gpt-4o',
        }}
      />
    );

    // 点击添加 Provider 按钮
    const addBtn = screen.getByTestId('add-provider-btn');
    fireEvent.click(addBtn);

    // 填写统一配置项：URL、Key（留空）、模型名称
    const nameInput = screen.getByTestId('provider-name-input') as HTMLInputElement;
    const urlInput = screen.getByTestId('provider-url-input') as HTMLInputElement;
    const keyInput = screen.getByTestId('provider-key-input') as HTMLInputElement;
    const modelInput = screen.getByTestId('provider-model-input') as HTMLInputElement;
    expect(nameInput.value).toBe('Custom (OpenAI-compatible)');
    expect(urlInput.value).toBe('');
    expect(keyInput.value).toBe('');
    expect(modelInput.value).toBe('');

    fireEvent.change(nameInput, { target: { value: 'My Local Ollama' } });
    fireEvent.change(urlInput, { target: { value: 'http://127.0.0.1:11434/v1' } });
    fireEvent.change(modelInput, { target: { value: 'deepseek-r1:14b' } });

    // 保存 Provider
    const saveProviderBtn = screen.getByTestId('save-provider-config-btn');
    fireEvent.click(saveProviderBtn);

    // 点击底部保存全部设置
    const saveAllBtn = screen.getByRole('button', { name: 'Save Settings' });
    fireEvent.click(saveAllBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          'llm.provider_ids': 'openai,custom',
          'llm.providers.custom.base_url': 'http://127.0.0.1:11434/v1',
          'llm.providers.custom.api_key': '',
          'llm.providers.custom.model': 'deepseek-r1:14b',
        })
      );
    });
  });

  it('supports deleting a provider from the configured list', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        initialSettings={{
          'llm.provider_ids': 'openai,custom_test',
          'llm.providers.openai.base_url': 'https://api.openai.com/v1',
          'llm.providers.openai.model': 'gpt-4o',
          'llm.providers.custom_test.name': 'Temp Provider',
          'llm.providers.custom_test.base_url': 'http://temp.internal/v1',
          'llm.providers.custom_test.model': 'temp-model',
        }}
      />
    );

    // 找到 Temp Provider 对应的删除按钮
    const deleteBtn = screen.getByTestId('delete-provider-custom_test');
    fireEvent.click(deleteBtn);

    // 保存全部设置
    const saveAllBtn = screen.getByRole('button', { name: 'Save Settings' });
    fireEvent.click(saveAllBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
      const savedArgs = handleSave.mock.calls[0][0];
      expect(savedArgs['llm.provider_ids']).not.toContain('custom_test');
    });
  });

  it('switches to Version & Update tab and displays version, check updates button and repository link', async () => {
    const handleCheckUpdates = vi.fn().mockResolvedValue({
      available: false,
    });
    const handleOpenExternal = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        currentVersion="0.1.0"
        onCheckForUpdates={handleCheckUpdates}
        onOpenExternalUrl={handleOpenExternal}
      />
    );

    // 切换到版本与更新 Tab
    const aboutTab = screen.getByTestId('settings-nav-about');
    fireEvent.click(aboutTab);

    // 验证显示版本与仓库地址
    expect(screen.getByTestId('current-version-badge').textContent).toContain('0.1.0');
    expect(screen.getByText('https://github.com/blue-idea/BuildUI')).toBeDefined();

    // 点击检查更新按钮
    const checkBtn = screen.getByTestId('btn-check-updates');
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(handleCheckUpdates).toHaveBeenCalled();
      expect(screen.getByText(/latest version/i)).toBeDefined();
    });

    // 点击访问仓库按钮
    const openRepoBtn = screen.getByTestId('btn-open-repo');
    fireEvent.click(openRepoBtn);
    expect(handleOpenExternal).toHaveBeenCalledWith('https://github.com/blue-idea/BuildUI');

    // 点击复制仓库链接按钮
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
    const copyRepoBtn = screen.getByTestId('btn-copy-repo');
    fireEvent.click(copyRepoBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://github.com/blue-idea/BuildUI');
    expect(screen.getByText('Copied!')).toBeDefined();
  });

  it('displays new version available feedback when update check finds newer release', async () => {
    const handleCheckUpdates = vi.fn().mockResolvedValue({
      available: true,
      version: '0.2.0',
      releaseUrl: 'https://github.com/blue-idea/BuildUI/releases/tag/v0.2.0',
      downloadUrl: 'https://github.com/blue-idea/BuildUI/releases/download/v0.2.0/BuildUI.dmg',
    });
    const handleOpenExternal = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        currentVersion="0.1.0"
        onCheckForUpdates={handleCheckUpdates}
        onOpenExternalUrl={handleOpenExternal}
      />
    );

    const aboutTab = screen.getByTestId('settings-nav-about');
    fireEvent.click(aboutTab);

    const checkBtn = screen.getByTestId('btn-check-updates');
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText(/0\.2\.0/)).toBeDefined();
      expect(screen.getByText(/brew upgrade buildui/)).toBeDefined();
    });

    const downloadBtn = screen.getByTestId('btn-download-update');
    fireEvent.click(downloadBtn);
    expect(handleOpenExternal).toHaveBeenCalledWith(
      'https://github.com/blue-idea/BuildUI/releases/download/v0.2.0/BuildUI.dmg'
    );
  });

  it('renders remember window size option in General tab with default true and saves correctly', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    // 切换到通用偏好选项卡
    const generalNav = screen.getByTestId('settings-nav-general');
    fireEvent.click(generalNav);

    // 验证记忆窗口大小开关存在并默认开启
    const toggle = screen.getByTestId('switch-remember-window-size');
    expect(toggle).toBeDefined();
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    // 点击保存，验证 payload 包含 window.remember_size: 'true'
    const saveBtn = screen.getByRole('button', { name: 'Save Settings' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          'window.remember_size': 'true',
        })
      );
    });
  });

  it('honors initial false setting and allows toggling remember window size', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        initialSettings={{
          'window.remember_size': 'false',
        }}
        onSave={handleSave}
      />
    );

    // 切换到通用偏好选项卡
    const generalNav = screen.getByTestId('settings-nav-general');
    fireEvent.click(generalNav);

    // 验证开关初始为关闭状态
    const toggle = screen.getByTestId('switch-remember-window-size');
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    // 点击开关切换为开启
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    // 保存设置
    const saveBtn = screen.getByRole('button', { name: 'Save Settings' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          'window.remember_size': 'true',
        })
      );
    });
  });
});
