import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v23-finished/screenshots');

test.describe('v23 Classic Multi-Platform Style & Home Presets Classification', () => {
  test('Home Presets Popover supports category filtering (All, App, Desktop, Web) and style selection', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('guide-user-input')).toBeVisible();

    // 1. 点击调色板图标打开风格预设 Popover
    const styleBtn = page.getByTestId('guide-style-btn');
    await expect(styleBtn).toBeVisible();
    await styleBtn.click();

    // 验证 Popover 和分类筛选胶囊可见且使用简短文字
    const filterAll = page.getByTestId('guide-style-filter-all');
    const filterWeb = page.getByTestId('guide-style-filter-web');
    const filterDesktop = page.getByTestId('guide-style-filter-desktop');
    const filterApp = page.getByTestId('guide-style-filter-app');

    await expect(filterAll).toBeVisible();
    await expect(filterWeb).toBeVisible();
    await expect(filterDesktop).toBeVisible();
    await expect(filterApp).toBeVisible();

    await expect(filterWeb).toHaveText('Web');
    await expect(filterDesktop).toHaveText('Desktop');
    await expect(filterApp).toHaveText('App');

    // 截图 01: 首页预设 Popover 打开 (All 默认)
    await page.screenshot({
      path: path.join(screenshotsDir, '01-home-style-popover-all.png'),
    });

    // 2. 依次点击切换到 Web 分类筛选
    await filterWeb.click();
    await expect(page.getByTestId('preset-benchmark-linear')).toBeVisible();
    await expect(page.getByTestId('preset-benchmark-stripe')).toBeVisible();

    // 截图 02: 首页预设筛选 Web
    await page.screenshot({
      path: path.join(screenshotsDir, '04-home-style-popover-web.png'),
    });

    // 3. 依次点击切换到 Desktop 分类筛选
    await filterDesktop.click();
    await expect(page.getByTestId('preset-benchmark-windows-fluent')).toBeVisible();
    await expect(page.getByTestId('preset-benchmark-slack')).toBeVisible();
    await expect(page.getByTestId('preset-benchmark-vscode')).toBeVisible();

    // 截图 03: 首页预设筛选 Desktop
    await page.screenshot({
      path: path.join(screenshotsDir, '03-home-style-popover-desktop.png'),
    });

    // 4. 依次点击切换到 App 分类筛选
    await filterApp.click();
    await expect(page.getByTestId('preset-benchmark-ios-health')).toBeVisible();
    await expect(page.getByTestId('preset-benchmark-threads')).toBeVisible();
    await expect(page.getByTestId('preset-benchmark-duolingo')).toBeVisible();

    // 截图 04: 首页预设筛选 App
    await page.screenshot({
      path: path.join(screenshotsDir, '02-home-style-popover-app.png'),
    });

    // 5. 选择 Apple Health 经典风格
    await page.getByTestId('preset-benchmark-ios-health').click();

    // 验证首页操作栏展示已选风格 Badge
    await expect(page.getByTestId('guide-selected-style-badge')).toContainText('Apple Health Inspired');

    // 截图 05: 首页选中 Apple Health 预设
    await page.screenshot({
      path: path.join(screenshotsDir, '05-home-selected-apple-health.png'),
    });
  });

  test('Style Center View shows expanded App, Desktop, and Web benchmark styles with filtering', async ({ page }) => {
    await page.goto('/');

    // 1. 点击左侧 Dock 导航进入风格中心
    const dockStyle = page.getByTestId('dock-style');
    await expect(dockStyle).toBeVisible();
    await dockStyle.click();

    await expect(page.getByTestId('style-center-view')).toBeVisible();

    // 截图 06: 风格与设计中心全景
    await page.screenshot({
      path: path.join(screenshotsDir, '06-style-center-all-templates.png'),
    });

    // 2. 筛选 App 经典风格模版
    await page.getByTestId('style-filter-app').click();
    await expect(page.getByText('Apple Health Inspired')).toBeVisible();
    await expect(page.getByText('Threads Mobile Inspired')).toBeVisible();
    await expect(page.getByText('Duolingo Mobile Inspired')).toBeVisible();
    await expect(page.getByText('Cash App Mobile Inspired')).toBeVisible();

    // 截图 07: 风格中心筛选 App 模版
    await page.screenshot({
      path: path.join(screenshotsDir, '07-style-center-app-templates.png'),
    });

    // 3. 筛选 Desktop 经典风格模版
    await page.getByTestId('style-filter-desktop').click();
    await expect(page.getByText('Windows Fluent Inspired')).toBeVisible();
    await expect(page.getByText('Slack Workstation Inspired')).toBeVisible();
    await expect(page.getByText('VS Code Pro Dark Inspired')).toBeVisible();
    await expect(page.getByText('Apple Inspired')).toBeVisible();
    await expect(page.getByText('Raycast Inspired')).toBeVisible();

    // 截图 08: 风格中心筛选 Desktop 模版
    await page.screenshot({
      path: path.join(screenshotsDir, '08-style-center-desktop-templates.png'),
    });
  });
});
