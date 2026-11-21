import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// 截图保存路径至 v6 reports/screenshots 目录
const screenshotsDir = path.resolve(process.cwd(), '../docs/spec/versions/v6/reports/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});

test.describe('Blot-UI v6 macOS Aesthetic Workbench & Bilingual Theme System', () => {
  test('Complete v6 workflow: macOS Traffic Lights & Three-column Layout -> Light/Dark Theme Switching -> Bilingual i18n Localization', async ({
    page,
  }) => {
    // 1. 访问首页，验证 macOS 浅色英文初始状态
    await page.goto('/');

    // 验证交通灯
    await expect(page.getByTestId('traffic-light-close')).toBeVisible();
    await expect(page.getByTestId('traffic-light-min')).toBeVisible();
    await expect(page.getByTestId('traffic-light-zoom')).toBeVisible();

    // 验证 Manage app 按钮与项目 Tab
    await expect(page.getByRole('button', { name: /manage app/i })).toBeVisible();
    await expect(page.getByText('Pantry Planner', { exact: true })).toBeVisible();

    // 验证左侧微坞
    await expect(page.getByTestId('dock-toggle')).toBeVisible();
    await expect(page.getByTestId('dock-home')).toBeVisible();
    await expect(page.getByTestId('dock-templates')).toBeVisible();

    // 验证会话消息与文件卡片
    await expect(page.getByText(/build a pantry recipe planner/i)).toBeVisible();
    await expect(page.getByText('PantryList.tsx', { exact: true })).toBeVisible();
    await expect(page.getByText('RecipeCard.tsx', { exact: true })).toBeVisible();
    await expect(page.getByText(/writing\.\.\./i)).toBeVisible();

    // 验证右侧工作区与拟真浏览器
    await expect(page.getByTestId('tab-preview')).toBeVisible();
    await expect(page.getByTestId('tab-code')).toBeVisible();
    await expect(page.getByTestId('tab-publish')).toBeVisible();
    await expect(page.getByTestId('browser-address')).toBeVisible();
    await expect(page.getByTestId('system-messages-toggle')).toBeVisible();

    // 截图 1: macOS 浅色主题 + 英文模式（1:1 对标用户提供的参考图）
    await page.screenshot({
      path: path.join(screenshotsDir, '01-v6-macos-light-en.png'),
      fullPage: true,
    });

    // 2. 切换至中文模式
    const langBtn = page.getByRole('button', { name: /switch to chinese/i });
    await expect(langBtn).toBeVisible();
    await langBtn.click();

    // 验证中文界面文案即时呈现
    await expect(page.getByText('管理应用')).toBeVisible();
    await expect(page.getByText('新建对话')).toBeVisible();
    await expect(page.getByText('实时预览')).toBeVisible();
    await expect(page.getByText('代码检视')).toBeVisible();
    await expect(page.getByText('打包发布')).toBeVisible();
    await expect(page.getByText('系统运行日志')).toBeVisible();

    // 截图 2: macOS 浅色主题 + 中文模式
    await page.screenshot({
      path: path.join(screenshotsDir, '02-v6-macos-light-zh.png'),
      fullPage: true,
    });

    // 3. 切换至深色模式
    const themeBtn = page.getByRole('button', { name: /switch to dark/i });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();

    // 验证根元素添加 .dark 类
    await expect(page.locator('html')).toHaveClass(/dark/);

    // 截图 3: macOS 深色主题 + 中文模式
    await page.screenshot({
      path: path.join(screenshotsDir, '03-v6-macos-dark-zh.png'),
      fullPage: true,
    });

    // 4. 切回英文模式
    const langBtnZh = page.getByRole('button', { name: /switch to english/i });
    await expect(langBtnZh).toBeVisible();
    await langBtnZh.click();

    // 验证切回英文
    await expect(page.getByRole('button', { name: /manage app/i })).toBeVisible();
    await expect(page.getByTestId('tab-preview')).toBeVisible();

    // 截图 4: macOS 深色主题 + 英文模式
    await page.screenshot({
      path: path.join(screenshotsDir, '04-v6-macos-dark-en.png'),
      fullPage: true,
    });

    // 5. 验证右侧工作区三态切换交互
    // 切换到 Code 视图
    await page.getByTestId('tab-code').click();
    await expect(page.getByRole('button', { name: 'PantryList.tsx' })).toBeVisible();
    await expect(page.locator('pre')).toContainText('Pantry Inventory');

    // 切换到 Publish 视图
    await page.getByTestId('tab-publish').click();
    await expect(page.getByRole('button', { name: /export standalone zip/i })).toBeVisible();

    // 展开底部 System Messages 抽屉
    const drawerToggle = page.getByTestId('system-messages-toggle');
    await drawerToggle.click();
    await expect(page.getByTestId('system-messages-drawer')).toBeVisible();
    await expect(page.getByText('Vite dev server listening')).toBeVisible();

    // 截图 5: 深色模式下工作区代码/发布与控制台日志抽屉展开
    await page.screenshot({
      path: path.join(screenshotsDir, '05-v6-macos-dark-drawer.png'),
      fullPage: true,
    });
  });
});
