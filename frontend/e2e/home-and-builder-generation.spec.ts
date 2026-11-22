import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/screenshots/bugfix-2026-11-22');

test.describe('Home to Builder and Builder Send Generation Flow', () => {
  test('Flow 1: 首页点击开始生成按钮，自动切换到构建区并开始生成，无需再次点击发送指令', async ({ page }) => {
    // 1. 访问首页
    await page.goto('/');
    await expect(page.getByTestId('guide-user-input')).toBeVisible();
    await expect(page.getByTestId('guide-submit-btn')).toBeVisible();

    // 2. 在首页输入需求
    await page.getByTestId('guide-user-input').fill('Create a modern fitness workout tracker');

    // 截图 01: 首页输入需求
    await page.screenshot({
      path: path.join(screenshotsDir, '01-home-input-prompt.png'),
    });

    // 3. 点击开始生成按钮 (ArrowUp)
    await page.getByTestId('guide-submit-btn').click();

    // 4. 验证自动切换到构建区
    await expect(page.getByText('Chat & Blueprint', { exact: false })).toBeVisible();

    // 5. 验证需求已自动进入聊天流并开始生成，无需再点发送指令
    await expect(page.getByText('Create a modern fitness workout tracker')).toBeVisible();

    // 6. 验证构建区输入框已自动清空
    const chatInput = page.getByPlaceholder('Describe what to build...');
    await expect(chatInput).toHaveValue('');

    // 截图 02: 自动进入构建区并开始生成
    await page.screenshot({
      path: path.join(screenshotsDir, '02-builder-auto-generating.png'),
    });
  });

  test('Flow 2: 构建页的发送指令按钮，直接开始构建项目，不会跳转到工程管理页面', async ({ page }) => {
    // 1. 访问首页并点击进入构建区
    await page.goto('/');
    const builderDock = page.getByTestId('dock-builder');
    await expect(builderDock).toBeVisible();
    await builderDock.click();

    await expect(page.getByText('Chat & Blueprint', { exact: false })).toBeVisible();

    // 2. 在构建区输入指令并点击发送
    const chatInput = page.getByPlaceholder('Describe what to build...');
    await chatInput.fill('Add a nutrition analysis chart with macros breakdown');

    // 截图 03: 构建区输入指令
    await page.screenshot({
      path: path.join(screenshotsDir, '03-builder-input-prompt.png'),
    });

    // 3. 点击发送指令按钮
    const sendBtn = page.getByRole('button', { name: 'Send prompt' });
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    // 4. 验证绝对没有跳转到工程管理页面
    await expect(page.getByTestId('projects-center-view')).not.toBeVisible();

    // 5. 验证需求已发送并在构建区中展示
    await expect(page.getByText('Add a nutrition analysis chart with macros breakdown')).toBeVisible();

    // 截图 04: 构建区成功发送指令并开始构建
    await page.screenshot({
      path: path.join(screenshotsDir, '04-builder-sent-building.png'),
    });
  });
});
