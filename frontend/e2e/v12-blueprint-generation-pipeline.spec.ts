import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v12/reports/screenshots');

test.describe('Blot-UI v12 Blueprint & Generation Pipeline E2E', () => {
  test('Complete flow: Clarification Questionnaire -> Blueprint Card -> Approval -> Implementation Unlocked', async ({ page }) => {
    // 1. 进入构建器页面
    await page.goto('/');
    
    // 若在导览首页，点击进入构建视图或者点击左侧 dock-builder
    const builderDock = page.getByTestId('dock-builder');
    if (await builderDock.isVisible()) {
      await builderDock.click();
    }

    await expect(page.getByText('Chat & Blueprint', { exact: false })).toBeVisible();

    // 2. 触发需求澄清问卷
    const mockQBtn = page.getByRole('button', { name: 'Mock Questionnaire' });
    await expect(mockQBtn).toBeVisible();
    await mockQBtn.click();

    // 验证问卷卡片渲染
    await expect(page.getByText('Project Clarification Questionnaire')).toBeVisible();
    await expect(page.getByText('1. What is the primary target audience?')).toBeVisible();

    // 截图 01: 需求澄清问卷呈现
    await page.screenshot({
      path: path.join(screenshotsDir, '01-v12-questionnaire-card.png'),
      fullPage: true,
    });

    // 3. 作答问卷并提交
    const devOption = page.getByRole('button', { name: 'Developers' });
    await devOption.click();

    const submitBtn = page.getByRole('button', { name: 'Submit Answers' });
    await submitBtn.click();

    // 4. 验证问卷提交后生成应用蓝图卡片
    await expect(page.getByText('Submitted questionnaire answers')).toBeVisible();
    await expect(page.getByText('Pending Approval')).toBeVisible();
    await expect(page.getByText('Design Direction')).toBeVisible();
    await expect(page.getByText('brand-logo')).toBeVisible();

    // 截图 02: 应用蓝图展示卡片（待审批态）
    await page.screenshot({
      path: path.join(screenshotsDir, '02-v12-blueprint-card-pending.png'),
      fullPage: true,
    });

    // 5. 点击审批蓝图
    const approveBtn = page.getByRole('button', { name: /Approve Blueprint/i });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // 验证审批通过状态
    await expect(page.getByText('Approved', { exact: true })).toBeVisible();
    await expect(page.getByText('Blueprint approved. Code implementation unlocked.', { exact: false })).toBeVisible();

    // 截图 03: 蓝图审批通过与写盘工具解锁
    await page.screenshot({
      path: path.join(screenshotsDir, '03-v12-blueprint-approved-unlocked.png'),
      fullPage: true,
    });

    // 6. 切换为浅色模式留证
    const themeBtn = page.getByRole('button', { name: /Switch to (Light|Dark) Mode/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(screenshotsDir, '04-v12-theme-mode-switch.png'),
        fullPage: true,
      });
    }
  });
});
