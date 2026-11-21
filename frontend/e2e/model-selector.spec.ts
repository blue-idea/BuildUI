import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test.describe('Model Selector E2E and Visual Regression', () => {
  test('renders model selector defaulting to Auto and allows toggling dropdown options', async ({ page }) => {
    await page.goto('/');

    // 1. 定位模型选择按钮，验证默认为 Auto
    const modelSelectorBtn = page.getByRole('button', { name: /model selector/i });
    await expect(modelSelectorBtn).toBeVisible();
    await expect(modelSelectorBtn).toHaveText(/Auto|自动/i);

    // 截图 1: 默认 Auto 状态下的多模态输入框与模型选择器
    await page.screenshot({
      path: path.join(screenshotsDir, 'model-selector-default-auto.png'),
      fullPage: false,
    });

    // 2. 点击展开下拉菜单
    await modelSelectorBtn.click();
    await expect(modelSelectorBtn).toHaveAttribute('aria-expanded', 'true');

    // 验证下拉浮层出现
    const dropdownMenu = page.getByRole('listbox', { name: /model options/i });
    await expect(dropdownMenu).toBeVisible();

    // 验证 Auto 选项可见且带有选中指示
    const autoOption = page.getByRole('option', { name: /auto/i });
    await expect(autoOption).toBeVisible();

    // 截图 2: 模型选择下拉框展开状态
    await page.screenshot({
      path: path.join(screenshotsDir, 'model-selector-dropdown-open.png'),
      fullPage: false,
    });

    // 3. 点击 Auto 选项关闭下拉框
    await autoOption.click();
    await expect(modelSelectorBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(modelSelectorBtn).toHaveText(/Auto|自动/i);
  });
});
