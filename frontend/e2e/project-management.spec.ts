import { test, expect } from '@playwright/test';

test.describe('Project Management Center View & LeftDock Navigation', () => {
  test('Complete Project Management workflow: Dock navigation -> View inspection -> Theme/Language toggle -> Screenshots', async ({
    page,
  }, testInfo) => {
    // 1. 访问首页，验证左侧微坞呈现构建区下方的工程管理区图标
    await page.goto('/');

    const dockBuilder = page.getByTestId('dock-builder');
    const dockProjects = page.getByTestId('dock-projects');
    await expect(dockBuilder).toBeVisible();
    await expect(dockProjects).toBeVisible();

    // 2. 点击工程管理区图标，进入工程管理页面
    await dockProjects.click();
    await expect(page.getByTestId('projects-center-view')).toBeVisible();

    // 验证卡片与项目信息
    await expect(page.getByTestId('project-search-input')).toBeVisible();
    await expect(page.getByTestId('new-project-btn')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Browse Templates' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Pantry Planner' })).toBeVisible();

    // 截图 1: 浅色主题 + 英文模式
    await page.screenshot({
      path: testInfo.outputPath('01-projects-center-light-en.png'),
      fullPage: true,
    });

    // 3. 验证页头与空状态的入口都返回首页
    await page.getByTestId('new-project-btn').click();
    await expect(page.getByTestId('guide-user-input')).toBeVisible();
    await dockProjects.click();
    await page.getByTestId('project-search-input').fill('Sample AI App');
    const emptyState = page.getByTestId('empty-projects-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByRole('button', { name: 'Browse Templates' })).toHaveCount(0);
    await emptyState.getByRole('button', { name: 'New Project' }).click();
    await expect(page.getByTestId('guide-user-input')).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('02-home-after-new-project.png'),
      fullPage: true,
    });
    await dockProjects.click();

    // 4. 切换为暗黑模式
    const themeBtn = page.getByRole('button', { name: /switch to light mode|switch to dark mode/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
    }
    await page.screenshot({
      path: testInfo.outputPath('03-projects-center-dark-en.png'),
      fullPage: true,
    });

    // 5. 切换为中文模式
    const langBtn = page.getByRole('button', { name: /switch to chinese|switch to english|语言/i });
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await expect(page.getByText('工程管理')).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath('04-projects-center-dark-zh.png'),
        fullPage: true,
      });

      // 切换回浅色模式以记录中文浅色截图
      if (await themeBtn.isVisible()) {
        await themeBtn.click();
        await page.screenshot({
          path: testInfo.outputPath('05-projects-center-light-zh.png'),
          fullPage: true,
        });
      }
    }
  });
});
