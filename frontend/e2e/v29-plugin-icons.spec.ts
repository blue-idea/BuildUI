import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v29/reports/screenshots');

test.describe('v29 Plugins Real Site Icons Visual Verification', () => {
  test('navigates to Plugins page and renders real site icons for preset plugins', async ({ page }) => {
    await page.goto('/');

    // 1. 点击底部/侧边栏 dock-components 进入插件中心
    const dockComponents = page.getByTestId('dock-components');
    await expect(dockComponents).toBeVisible();
    await dockComponents.click();

    // 2. 验证插件中心主视图呈现
    await expect(page.getByTestId('component-center-view')).toBeVisible();

    // 3. 验证主要预设插件卡片真实站点图标存在
    const expoIcon = page.getByTestId('plugin-icon-expo');
    const shadcnIcon = page.getByTestId('plugin-icon-shadcn');
    const playwrightIcon = page.getByTestId('plugin-icon-playwright');
    const stitchIcon = page.getByTestId('plugin-icon-stitch');
    const githubIcon = page.getByTestId('plugin-icon-github');
    const cloudflareIcon = page.getByTestId('plugin-icon-cloudflare');
    const snykIcon = page.getByTestId('plugin-icon-snyk');
    const stripeIcon = page.getByTestId('plugin-icon-stripe');
    const huggingfaceIcon = page.getByTestId('plugin-icon-huggingface');
    const heygenIcon = page.getByTestId('plugin-icon-heygen');

    await expect(expoIcon).toBeVisible();
    await expect(shadcnIcon).toBeVisible();
    await expect(playwrightIcon).toBeVisible();
    await expect(stitchIcon).toBeVisible();
    await expect(stripeIcon).toBeVisible();
    await expect(huggingfaceIcon).toBeVisible();

    // 截图 01: 插件中心预设项真实站点图标全景
    await page.screenshot({
      path: path.join(screenshotsDir, '01-v29-plugin-catalog-real-icons.png'),
      fullPage: true,
    });

    // 滚动到下半部分查看更多预设项（Project Tooling & AI & Media）
    await githubIcon.scrollIntoViewIfNeeded();
    await expect(githubIcon).toBeVisible();
    await expect(cloudflareIcon).toBeVisible();
    await expect(snykIcon).toBeVisible();
    await expect(heygenIcon).toBeVisible();

    // 截图 02: 研发与 AI 媒体分类的真实站点图标局部视图
    await page.screenshot({
      path: path.join(screenshotsDir, '02-v29-plugin-developer-tools-icons.png'),
    });
  });
});
