import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';

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
});
