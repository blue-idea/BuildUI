import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test.describe('Model Selector and LLM Provider Preferences E2E and Visual Regression', () => {
  test('renders provider preferences, configures local Ollama, and reflects in model selector on Home and Builder', async ({ page }) => {
    await page.goto('/');

    // 1. 首页模型选择器，验证默认为 Auto
    const homeModelSelectorBtn = page.getByRole('button', { name: /model selector/i });
    await expect(homeModelSelectorBtn).toBeVisible();
    await expect(homeModelSelectorBtn).toHaveText(/Auto|自动/i);

    // 截图 1: 首页默认状态与模型选择器
    await page.screenshot({
      path: path.join(screenshotsDir, 'home-model-selector-default.png'),
      fullPage: false,
    });

    // 2. 点击展开首页模型选择下拉菜单
    await homeModelSelectorBtn.click();
    await expect(homeModelSelectorBtn).toHaveAttribute('aria-expanded', 'true');

    const dropdownMenu = page.getByRole('listbox', { name: /model options/i });
    await expect(dropdownMenu).toBeVisible();

    // 截图 2: 首页模型选择下拉菜单展示
    await page.screenshot({
      path: path.join(screenshotsDir, 'home-model-selector-dropdown-open.png'),
      fullPage: false,
    });

    // 3. 点击 Manage Providers 进入大模型 Provider 偏好设置页
    const manageBtn = page.getByRole('button', { name: /manage providers/i });
    await expect(manageBtn).toBeVisible();
    await manageBtn.click();

    // 4. 验证 SettingsModal 偏好设置弹窗，并展示已设置的 Provider 列表
    const settingsTitle = page.getByText(/LLM Provider Settings|偏好设置/i);
    await expect(settingsTitle).toBeVisible();

    const configuredList = page.getByTestId('configured-providers-list');
    await expect(configuredList).toBeVisible();

    // 截图 3: 大模型 Provider 偏好设置页与已设置 Provider 列表展示
    await page.screenshot({
      path: path.join(screenshotsDir, 'provider-preferences-configured-list.png'),
      fullPage: false,
    });

    // 5. 点击添加 Provider 按钮
    const addProviderBtn = page.getByTestId('add-provider-btn');
    await expect(addProviderBtn).toBeVisible();
    await addProviderBtn.click();

    // 6. 配置本地 Ollama 提供商（统一使用 URL, Key, 模型名称，Ollama Key 可为空）
    const nameInput = page.getByTestId('provider-name-input');
    await nameInput.fill('Local Ollama Cluster');

    const urlInput = page.getByTestId('provider-url-input');
    await urlInput.fill('http://127.0.0.1:11434/v1');

    const keyInput = page.getByTestId('provider-key-input');
    await keyInput.fill(''); // 本地 Ollama 无需 Key

    const modelInput = page.getByTestId('provider-model-input');
    await modelInput.fill('qwen2.5-coder:32b');

    // 截图 4: 填写统一 Provider 表单（URL, Key 可空, 模型名称）
    await page.screenshot({
      path: path.join(screenshotsDir, 'provider-preferences-edit-form.png'),
      fullPage: false,
    });

    // 7. 应用并保存全部设置
    const applyBtn = page.getByTestId('save-provider-config-btn');
    await applyBtn.click();

    const saveSettingsBtn = page.getByRole('button', { name: /save settings|保存/i });
    await saveSettingsBtn.click();
    await expect(settingsTitle).not.toBeVisible();

    // 8. 重新点击首页模型选择器，验证已从当前设置的 Provider 获取并列出新配置项
    await homeModelSelectorBtn.click();
    await expect(dropdownMenu).toBeVisible();

    const ollamaOption = page.getByRole('option', { name: /qwen2\.5-coder:32b/i });
    await expect(ollamaOption).toBeVisible();

    // 截图 5: 首页模型选择器下拉中包含新配置的本地 Ollama
    await page.screenshot({
      path: path.join(screenshotsDir, 'home-model-selector-with-ollama.png'),
      fullPage: false,
    });

    // 9. 选择该模型
    await ollamaOption.click();
    await expect(homeModelSelectorBtn).toContainText('qwen2.5-coder:32b');

    // 10. 切换到构建页（Builder），验证构建页的模型选择器同样从设置中获取且同步所选模型
    const builderDockBtn = page.getByTestId('dock-builder');
    await builderDockBtn.click();

    const builderModelSelectorBtn = page.getByRole('button', { name: /model selector/i });
    await expect(builderModelSelectorBtn).toBeVisible();
    await expect(builderModelSelectorBtn).toContainText('qwen2.5-coder:32b');

    // 展开构建页模型选择器，验证同样包含完整的已设置 Provider 列表
    await builderModelSelectorBtn.click();
    const builderDropdown = page.getByRole('listbox', { name: /model options/i });
    await expect(builderDropdown).toBeVisible();
    await expect(page.getByRole('option', { name: /qwen2\.5-coder:32b/i })).toBeVisible();

    // 截图 6: 构建页模型选择器从已设置 Provider 中获取展示
    await page.screenshot({
      path: path.join(screenshotsDir, 'builder-model-selector-configured-providers.png'),
      fullPage: false,
    });
  });
});
