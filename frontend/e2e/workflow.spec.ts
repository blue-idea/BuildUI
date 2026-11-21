import { test, expect } from '@playwright/test';
import path from 'path';

// process.cwd() 在运行测试时为 frontend 目录
const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v1-finished/reports/screenshots');

test.describe('Blot-UI E2E Core Workflow', () => {
  test('Complete workflow: Main layout -> Submit prompt -> Blueprint Approval -> Code Gen & Live Preview', async ({ page }) => {
    // 1. 访问首页，验证初始左右分栏与欢迎信息
    await page.goto('/');
    await expect(page.getByText('Blot-UI', { exact: true })).toBeVisible();
    await expect(page.getByText('Welcome to Blot-UI', { exact: false })).toBeVisible();
    await expect(page.getByText('Preview', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reload preview' })).toBeVisible();

    // 截图 1: 左右分栏主界面
    await page.screenshot({
      path: path.join(screenshotsDir, '01-main-layout.png'),
      fullPage: true,
    });

    // 2. 提交应用生成需求
    const input = page.getByPlaceholder('Describe what to build...');
    await input.fill('Create a modern SaaS Analytics Dashboard');
    await page.getByRole('button', { name: 'Send prompt' }).click();

    // 验证用户消息已上屏
    await expect(page.getByText('Create a modern SaaS Analytics Dashboard')).toBeVisible();

    // 3. 蓝图生成与审批卡片展示
    await expect(page.getByText('Application Design Blueprint')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Pending Approval')).toBeVisible();
    await expect(page.getByText('Design Direction')).toBeVisible();

    // 截图 2: 蓝图审批门禁卡片
    await page.screenshot({
      path: path.join(screenshotsDir, '02-blueprint-approval.png'),
      fullPage: true,
    });

    // 4. 点击批准蓝图门禁
    const approveBtn = page.getByRole('button', { name: 'Approve Blueprint & Start Generation' });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // 验证审批通过状态标识
    await expect(page.getByText('Blueprint Approved', { exact: true })).toBeVisible();
    await expect(page.getByText('✓ Blueprint approved. Code implementation unlocked.')).toBeVisible();

    // 验证代码生成及沙箱验证通知
    await expect(
      page.getByText('Application code generated and verified in local sandbox')
    ).toBeVisible({ timeout: 5000 });

    // 验证右侧实时预览状态为 running，Iframe 渲染
    await expect(page.locator('iframe[title="App live preview"]')).toBeVisible();

    // 截图 3: 运行中实时预览与已批准状态
    await page.screenshot({
      path: path.join(screenshotsDir, '03-preview-running.png'),
      fullPage: true,
    });
  });
});
